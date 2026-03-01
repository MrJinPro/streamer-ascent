import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Example: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run ingest:tiktok');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const sources = [
  {
    seedUrl: 'https://www.tiktok.com/support',
    title: 'TikTok Support',
    language: 'ru',
    region: 'global',
    allowedPathPrefixes: ['/support'],
    maxPages: 50,
  },
  {
    seedUrl: 'https://www.tiktok.com/community-guidelines/ru/overview',
    title: 'TikTok Community Guidelines (RU)',
    language: 'ru',
    region: 'ru',
    allowedPathPrefixes: ['/community-guidelines/ru'],
    maxPages: 40,
  },
];

const fetchAsMarkdown = async (url) => {
  const proxyUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
  const response = await fetch(proxyUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NovaBoostPolicyIngest/1.0)',
      Accept: 'text/plain, text/markdown;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const text = await response.text();
  return text;
};

const normalizeUrl = (value) => {
  try {
    const parsed = new URL(value);
    parsed.hash = '';
    if (parsed.searchParams.has('lang')) {
      parsed.search = `?lang=${parsed.searchParams.get('lang')}`;
    } else {
      parsed.search = '';
    }

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return value;
  }
};

const normalizeText = (value) => {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const splitIntoChunks = (text, size = 1300, overlap = 220) => {
  const cleaned = normalizeText(text);
  if (!cleaned) return [];

  const chunks = [];
  let index = 0;

  while (index < cleaned.length) {
    let end = Math.min(cleaned.length, index + size);

    if (end < cleaned.length) {
      const windowText = cleaned.slice(index, end);
      const boundaryCandidates = [windowText.lastIndexOf('\n\n'), windowText.lastIndexOf('. '), windowText.lastIndexOf('! '), windowText.lastIndexOf('? ')];
      const boundary = Math.max(...boundaryCandidates);
      if (boundary > Math.floor(size * 0.45)) {
        end = index + boundary + 1;
      }
    }

    const part = cleaned.slice(index, end).trim();
    if (part) chunks.push(part);

    if (end >= cleaned.length) break;
    index = Math.max(0, end - overlap);
  }

  return chunks;
};

const extractLinks = (markdown, currentUrl) => {
  const links = new Set();
  const markdownLinks = markdown.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g);

  for (const match of markdownLinks) {
    const raw = match[1]?.trim();
    if (!raw || raw.startsWith('#') || raw.startsWith('mailto:')) continue;
    try {
      const absolute = normalizeUrl(new URL(raw, currentUrl).toString());
      links.add(absolute);
    } catch {
      continue;
    }
  }

  return [...links];
};

const isAllowedSupportUrl = (url, allowedPathPrefixes) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'www.tiktok.com') return false;
    if (parsed.pathname.startsWith('/tag/')) return false;
    return allowedPathPrefixes.some((prefix) => parsed.pathname.startsWith(prefix));
  } catch {
    return false;
  }
};

const parseSectionsFromMarkdown = (markdown, sourceUrl) => {
  const lines = markdown.split('\n');
  const sections = [];
  const headingStack = [];
  let currentHeading = null;
  let buffer = [];
  let introBuffer = [];

  const pageTitle =
    lines
      .find((line) => line.startsWith('# '))
      ?.replace(/^#\s+/, '')
      ?.trim()
      ?.slice(0, 180) || 'TikTok статья';

  const flush = () => {
    if (!currentHeading) return;
    const content = normalizeText(buffer.join('\n'));
    if (content.length < 120) {
      buffer = [];
      return;
    }

    const fullPath = headingStack.join(' → ').slice(0, 220);

    sections.push({
      title: currentHeading,
      titlePath: fullPath || currentHeading,
      pageTitle,
      body: content,
      sourceUrl,
    });

    buffer = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{2,5})\s+(.+)$/);
    if (headingMatch) {
      flush();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      headingStack.length = Math.max(0, level - 2);
      headingStack[level - 2] = headingText;
      currentHeading = headingText;
      continue;
    }

    if (!currentHeading) {
      introBuffer.push(line);
      continue;
    }

    buffer.push(line);
  }

  flush();

  const introText = normalizeText(introBuffer.join('\n'));
  if (introText.length >= 120) {
    sections.unshift({
      title: 'Обзор',
      titlePath: `${pageTitle} → Обзор`,
      pageTitle,
      body: introText,
      sourceUrl,
    });
  }

  return sections.slice(0, 80);
};

const upsertPolicyDocAndChunks = async ({ title, url, language, region, markdown, sections }) => {
  const content = normalizeText(markdown);
  const sectionChunks = sections.flatMap((section) => {
    return splitIntoChunks(section.body, 1200, 180).map((chunk) => `${section.titlePath}\n\n${chunk}`);
  });

  const chunks = sectionChunks.length > 0 ? sectionChunks : splitIntoChunks(content);

  const { data: existingDocs, error: existingError } = await supabase
    .from('policy_docs')
    .select('id, content')
    .eq('source_url', url)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (existingError) throw existingError;

  const existingDoc = existingDocs?.[0] ?? null;
  let docId = existingDoc?.id;
  const isUnchanged = !!existingDoc && normalizeText(existingDoc.content) === content;

  if (docId && !isUnchanged) {
    const { error } = await supabase
      .from('policy_docs')
      .update({
        title,
        language,
        region,
        source_url: url,
        active: true,
        content,
      })
      .eq('id', docId);

    if (error) throw error;
  } else if (!docId) {
    const { data, error } = await supabase
      .from('policy_docs')
      .insert({
        title,
        language,
        region,
        source_url: url,
        active: true,
        content,
      })
      .select('id')
      .single();

    if (error) throw error;
    docId = data.id;
  }

  if (!docId) {
    throw new Error(`No policy_docs row for ${url}`);
  }

  if (isUnchanged) {
    const { count } = await supabase
      .from('policy_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('doc_id', docId);

    return { docId, chunkCount: count ?? 0, changed: false };
  }

  const { error: deleteError } = await supabase
    .from('policy_chunks')
    .delete()
    .eq('doc_id', docId);

  if (deleteError) throw deleteError;

  if (chunks.length > 0) {
    const { error: insertError } = await supabase
      .from('policy_chunks')
      .insert(
        chunks.map((chunk, chunkIndex) => ({
          doc_id: docId,
          chunk_index: chunkIndex,
          language,
          region,
          content: chunk,
        })),
      );

    if (insertError) throw insertError;
  }

  return { docId, chunkCount: chunks.length, changed: true };
};

const refreshPolicyQna = async (sections) => {
  const normalized = sections
    .filter((item) => item.body.length >= 180)
    .map((item) => ({
      question: `Что важно знать о разделе «${item.title}» в TikTok?`,
      answer: normalizeText(item.body).slice(0, 1100),
      language: 'ru',
      region: item.sourceUrl.includes('/community-guidelines/ru') ? 'ru' : 'global',
      source_chunk_ids: [],
      active: true,
    }));

  const deduped = [];
  const seen = new Set();
  for (const item of normalized) {
    const key = `${item.question.toLowerCase()}::${item.answer.slice(0, 120).toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
    if (deduped.length >= 120) break;
  }

  const { error: deleteError } = await supabase
    .from('policy_qna')
    .delete()
    .or('question.ilike.%TikTok%,answer.ilike.%TikTok%');

  if (deleteError) throw deleteError;

  if (deduped.length > 0) {
    const { error: insertError } = await supabase
      .from('policy_qna')
      .insert(deduped);

    if (insertError) throw insertError;
  }

  return { qnaCount: deduped.length };
};

const upsertAcademyLearning = async (allSections) => {
  const courseTitle = 'TikTok: Поддержка и Правила платформы';

  const { data: existingCourse, error: existingCourseError } = await supabase
    .from('academy_courses')
    .select('id')
    .eq('title', courseTitle)
    .maybeSingle();

  if (existingCourseError) throw existingCourseError;

  let courseId = existingCourse?.id;

  const coursePayload = {
    title: courseTitle,
    description: 'Автоматически импортированные материалы из TikTok Support и Community Guidelines для обучения стримеров.',
    difficulty: 2,
    is_published: true,
    required_level: 1,
    order_index: 999,
    tags: ['tiktok', 'policy', 'safety', 'support'],
  };

  if (!courseId) {
    const { data, error } = await supabase
      .from('academy_courses')
      .insert(coursePayload)
      .select('id')
      .single();

    if (error) throw error;
    courseId = data.id;
  } else {
    const { error } = await supabase
      .from('academy_courses')
      .update(coursePayload)
      .eq('id', courseId);

    if (error) throw error;
  }

  const { data: oldLessons, error: oldLessonsError } = await supabase
    .from('academy_lessons')
    .select('id')
    .eq('course_id', courseId)
    .contains('reward_meta', { source: 'tiktok_policy_import' });

  if (oldLessonsError) throw oldLessonsError;

  const oldLessonIds = (oldLessons ?? []).map((item) => item.id);

  if (oldLessonIds.length > 0) {
    const { error: deleteBlocksError } = await supabase
      .from('academy_blocks')
      .delete()
      .in('lesson_id', oldLessonIds);

    if (deleteBlocksError) throw deleteBlocksError;

    const { error: deleteLessonsError } = await supabase
      .from('academy_lessons')
      .delete()
      .in('id', oldLessonIds);

    if (deleteLessonsError) throw deleteLessonsError;
  }

  let orderIndex = 0;
  for (const section of allSections.slice(0, 60)) {
    const title = section.titlePath.slice(0, 140);
    const summary = section.body.slice(0, 380);

    const { data: lesson, error: lessonError } = await supabase
      .from('academy_lessons')
      .insert({
        course_id: courseId,
        title,
        summary,
        order_index: orderIndex,
        difficulty: 2,
        estimated_minutes: 10,
        required_video_percent: 70,
        xp_base: 40,
        reward_meta: { source: 'tiktok_policy_import' },
        is_published: true,
      })
      .select('id')
      .single();

    if (lessonError) throw lessonError;

    const { error: blockError } = await supabase
      .from('academy_blocks')
      .insert({
        lesson_id: lesson.id,
        block_type: 'text',
        title,
        required: true,
        order_index: 0,
        content: {
          markdown: section.body,
          sourceUrl: section.sourceUrl,
          sourcePath: section.titlePath,
          pageTitle: section.pageTitle,
          source: 'tiktok_policy_import',
        },
      });

    if (blockError) throw blockError;

    orderIndex += 1;
  }

  return { courseId, lessonCount: Math.min(allSections.length, 60) };
};

const crawlSource = async (source) => {
  const queue = [normalizeUrl(source.seedUrl)];
  const visited = new Set();
  const pages = [];

  while (queue.length > 0 && pages.length < source.maxPages) {
    const currentUrl = queue.shift();
    if (!currentUrl || visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    try {
      const markdown = await fetchAsMarkdown(currentUrl);
      const sections = parseSectionsFromMarkdown(markdown, currentUrl);
      pages.push({ url: currentUrl, markdown, sections });

      const links = extractLinks(markdown, currentUrl);
      for (const link of links) {
        if (visited.has(link)) continue;
        if (!isAllowedSupportUrl(link, source.allowedPathPrefixes)) continue;
        if (!queue.includes(link)) queue.push(link);
      }

      console.log(`Crawled ${pages.length}/${source.maxPages}: ${currentUrl}`);
    } catch (error) {
      console.warn(`Skip page ${currentUrl}: ${error?.message ?? error}`);
    }
  }

  return pages;
};

const run = async () => {
  console.log('Starting TikTok knowledge ingest with crawl + freshness check...');

  const sectionAccumulator = [];
  const crawledUrls = [];
  let totalChangedPages = 0;
  let totalChunkCount = 0;

  for (const source of sources) {
    console.log(`Crawling source: ${source.seedUrl}`);
    const pages = await crawlSource(source);

    for (const page of pages) {
      crawledUrls.push(page.url);
      const pageTitle = page.sections[0]?.pageTitle || source.title;
      const policyTitle = `${source.title}: ${pageTitle}`.slice(0, 180);

      const result = await upsertPolicyDocAndChunks({
        title: policyTitle,
        url: page.url,
        language: source.language,
        region: source.region,
        markdown: page.markdown,
        sections: page.sections,
      });

      totalChunkCount += result.chunkCount;
      if (result.changed) totalChangedPages += 1;

      sectionAccumulator.push(...page.sections);
    }

    console.log(`Source done: pages=${pages.length}`);
  }

  const crawlUrlSet = new Set(crawledUrls);
  const { data: allDocs, error: docsReadError } = await supabase
    .from('policy_docs')
    .select('id, source_url')
    .or('source_url.ilike.%tiktok.com/support%,source_url.ilike.%tiktok.com/community-guidelines/ru%');

  if (docsReadError) throw docsReadError;

  const staleDocIds = (allDocs ?? [])
    .filter((doc) => doc.source_url && !crawlUrlSet.has(normalizeUrl(doc.source_url)))
    .map((doc) => doc.id);

  if (staleDocIds.length > 0) {
    const { error: staleChunkDeleteError } = await supabase
      .from('policy_chunks')
      .delete()
      .in('doc_id', staleDocIds);

    if (staleChunkDeleteError) throw staleChunkDeleteError;

    const { error: staleDocUpdateError } = await supabase
      .from('policy_docs')
      .update({ active: false })
      .in('id', staleDocIds);

    if (staleDocUpdateError) throw staleDocUpdateError;
  }

  const qnaResult = await refreshPolicyQna(sectionAccumulator);
  const academyResult = await upsertAcademyLearning(sectionAccumulator);

  console.log(`Freshness summary: pages=${crawledUrls.length}, changed=${totalChangedPages}, stale_deactivated=${staleDocIds.length}`);
  console.log(`Policy chunks total=${totalChunkCount}, qna=${qnaResult.qnaCount}`);
  console.log(`Academy imported: course=${academyResult.courseId}, lessons=${academyResult.lessonCount}`);
  console.log('Done ✅');
};

run().catch((error) => {
  console.error('Ingest failed:', error?.message ?? error);
  process.exit(1);
});
