import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, CheckCircle, Clock, Filter, Maximize2, Minimize2, Play, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { sanitizeHtml } from '@/lib/safeHtml';


type AcademyCourse = {
  id: string;
  title: string;
  description: string | null;
  difficulty: number;
  is_published: boolean;
};

type AcademyLesson = {
  id: string;
  course_id: string;
  title: string;
  summary: string | null;
  order_index: number;
  difficulty: number;
  estimated_minutes: number;
  required_video_percent: number;
  xp_base: number;
  is_published: boolean;
};

type AcademyBlock = {
  id: string;
  lesson_id: string;
  block_type: 'video' | 'text' | 'image' | 'gallery' | 'checklist' | 'quiz' | 'cta' | 'reward' | 'task' | 'html' | 'heading' | 'quote' | 'file' | 'divider';
  title: string | null;
  content: Record<string, unknown>;
  required: boolean;
  order_index: number;
};

type AcademyProgress = {
  lesson_id: string;
  status: 'started' | 'completed';
  video_progress_percent: number;
  task_completed: boolean;
  xp_awarded: number;
};

const toEmbedVideoUrl = (url?: string): string => {
  const trimmed = (url ?? '').trim();
  if (!trimmed) return '';

  const youtubeWatchMatch = trimmed.match(/youtube\.com\/watch\?v=([^&]+)/i);
  if (youtubeWatchMatch?.[1]) {
    return `https://www.youtube.com/embed/${youtubeWatchMatch[1]}`;
  }

  const youtubeShortMatch = trimmed.match(/youtu\.be\/([^?&]+)/i);
  if (youtubeShortMatch?.[1]) {
    return `https://www.youtube.com/embed/${youtubeShortMatch[1]}`;
  }

  return trimmed;
};

const isYoutubeUrl = (url?: string): boolean => {
  const value = (url ?? '').toLowerCase();
  return value.includes('youtube.com') || value.includes('youtu.be');
};

const Learning: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [lessons, setLessons] = useState<AcademyLesson[]>([]);
  const [blocks, setBlocks] = useState<AcademyBlock[]>([]);
  const [progressRows, setProgressRows] = useState<AcademyProgress[]>([]);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedLesson, setSelectedLesson] = useState<AcademyLesson | null>(null);
  const [readerFullscreen, setReaderFullscreen] = useState(false);
  const [readerHint, setReaderHint] = useState<string | null>(null);
  const lessonReaderMetrics = useRef({
    startTime: 0,
    lastScrollTop: 0,
    lastScrollAt: 0,
    totalScrollDistance: 0,
    scrollEvents: 0,
    maxScrollPercent: 0,
    charsCount: 0,
    startedMarked: false,
    completedMarked: false,
  });

  const loadData = async () => {
    setLoading(true);

    const [{ data: courseData, error: courseError }, { data: lessonData, error: lessonError }, { data: blockData, error: blockError }, { data: progressData, error: progressError }] = await Promise.all([
      supabasePublic.from('academy_courses').select('*').eq('is_published', true).order('order_index', { ascending: true }),
      supabasePublic.from('academy_lessons').select('*').eq('is_published', true).order('order_index', { ascending: true }),
      supabasePublic.from('academy_blocks').select('*').order('order_index', { ascending: true }),
      user
        ? supabasePublic
            .from('academy_progress')
            .select('lesson_id,status,video_progress_percent,task_completed,xp_awarded')
            .eq('user_id', user.id)
        : Promise.resolve({ data: [], error: null as unknown as null }),
    ]);

    if (courseError || lessonError || blockError || progressError) {
      toast({
        title: 'Не удалось загрузить обучение',
        description: courseError?.message || lessonError?.message || blockError?.message || progressError?.message || 'Ошибка загрузки данных',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    setCourses((courseData ?? []) as AcademyCourse[]);
    setLessons((lessonData ?? []) as AcademyLesson[]);
    setBlocks((blockData ?? []) as AcademyBlock[]);
    setProgressRows((progressData ?? []) as AcademyProgress[]);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, [user?.id]);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(courses.map(course => course.title)))],
    [courses],
  );

  const filteredLessons = useMemo(() => {
    const publishedCourseIds = new Set(
      (categoryFilter === 'all' ? courses : courses.filter(course => course.title === categoryFilter)).map(course => course.id),
    );

    return lessons.filter(lesson => publishedCourseIds.has(lesson.course_id));
  }, [categoryFilter, courses, lessons]);

  const getProgress = (lessonId: string): AcademyProgress | undefined =>
    progressRows.find(row => row.lesson_id === lessonId);

  const stats = useMemo(() => {
    const completed = progressRows.filter(row => row.status === 'completed').length;
    const total = lessons.length;
    const available = lessons.length - completed;
    const xpFromAcademy = progressRows.reduce((sum, row) => sum + (row.xp_awarded ?? 0), 0);

    return {
      total,
      completed,
      available,
      xpFromAcademy,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [lessons.length, progressRows]);

  const selectedBlocks = useMemo(() => {
    if (!selectedLesson) return [];
    return blocks.filter(block => block.lesson_id === selectedLesson.id).sort((a, b) => a.order_index - b.order_index);
  }, [blocks, selectedLesson]);

  const getLessonTextLength = (lesson: AcademyLesson | null, blocks: AcademyBlock[]) => {
    if (!lesson) return 0;
    const textParts: string[] = [];
    if (lesson.summary) textParts.push(lesson.summary);
    blocks
      .filter(block => block.lesson_id === lesson.id && (block.block_type === 'text' || block.block_type === 'quote'))
      .forEach(block => {
        textParts.push(String(block.content?.body ?? block.content?.text ?? ''));
      });
    blocks
      .filter(block => block.lesson_id === lesson.id && block.block_type === 'html')
      .forEach(block => {
        const html = String(block.content?.html ?? '');
        textParts.push(html.replace(/<[^>]*>/g, ' '));
      });
    const text = textParts.join(' ').replace(/\s+/g, ' ').trim();
    return text.length;
  };

  const resetLessonReaderMetrics = (lesson: AcademyLesson | null) => {
    lessonReaderMetrics.current = {
      startTime: lesson ? Date.now() : 0,
      lastScrollTop: 0,
      lastScrollAt: Date.now(),
      totalScrollDistance: 0,
      scrollEvents: 0,
      maxScrollPercent: 0,
      charsCount: getLessonTextLength(lesson, blocks),
      startedMarked: false,
      completedMarked: false,
    };
    setReaderHint(null);
  };

  const saveLessonProgress = async (lesson: AcademyLesson, status: 'started' | 'completed') => {
    if (!user) return;

    const { data: existingRow, error: fetchError } = await supabasePublic
      .from('academy_progress')
      .select('id,status')
      .eq('lesson_id', lesson.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Cannot fetch lesson progress', fetchError.message);
      return;
    }

    const values: Record<string, unknown> = {
      lesson_id: lesson.id,
      user_id: user.id,
      status,
      updated_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      values.completed_at = new Date().toISOString();
    }

    if (existingRow?.id) {
      const { error } = await supabasePublic
        .from('academy_progress')
        .update(values)
        .eq('id', existingRow.id);

      if (error) {
        console.error('Cannot update lesson progress', error.message);
      }
    } else {
      const { error } = await supabasePublic.from('academy_progress').insert(values);
      if (error) {
        console.error('Cannot insert lesson progress', error.message);
      }
    }

    await loadData();
  };

  const evaluateLessonProgress = async (lesson: AcademyLesson | null, shouldSave = false) => {
    if (!user || !lesson || lessonReaderMetrics.current.startTime === 0) return;

    const metrics = lessonReaderMetrics.current;
    const elapsedMs = Date.now() - metrics.startTime;
    const elapsedSecs = elapsedMs / 1000;
    const elapsedMinutes = Math.max(0.5, elapsedSecs / 60);
    const chars = Math.max(1, metrics.charsCount);
    const speed = chars / elapsedMinutes;
    const fastScan = elapsedSecs < 40 || speed > 6500;

    if (!metrics.completedMarked && metrics.maxScrollPercent >= 0.9 && elapsedSecs >= 25) {
      metrics.completedMarked = true;
      setReaderHint(
        fastScan
          ? 'Пройдено. NovaAI считает, что вы просмотрели материал, но рекомендует повторное чтение для закрепления.'
          : 'Пройдено. NovaAI зафиксировал прочтение урока.'
      );
      if (shouldSave) {
        await saveLessonProgress(lesson, 'completed');
      }
      return;
    }

    if (!metrics.startedMarked && (elapsedSecs >= 15 || metrics.maxScrollPercent >= 0.25)) {
      metrics.startedMarked = true;
      setReaderHint(
        fastScan
          ? 'Урок засчитан как начатый. NovaAI отмечает быстрый просмотр и советует вернуться к материалу для закрепления.'
          : 'Урок засчитан как начатый. NovaAI рекомендует продолжить изучение и повторить важные моменты.'
      );
      if (shouldSave) {
        await saveLessonProgress(lesson, 'started');
      }
    }
  };

  useEffect(() => {
    resetLessonReaderMetrics(selectedLesson);
  }, [selectedLesson, selectedBlocks]);

  const handleLessonReaderScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!selectedLesson) return;

    const element = event.currentTarget;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    if (scrollHeight <= 0) return;

    const metrics = lessonReaderMetrics.current;
    const now = Date.now();
    const scrollPercent = Math.min(1, scrollTop / scrollHeight);
    const distance = Math.abs(scrollTop - metrics.lastScrollTop);

    metrics.maxScrollPercent = Math.max(metrics.maxScrollPercent, scrollPercent);
    metrics.totalScrollDistance += distance;
    metrics.scrollEvents += 1;
    metrics.lastScrollTop = scrollTop;
    metrics.lastScrollAt = now;

    void evaluateLessonProgress(selectedLesson);
  };

  const handleLessonReaderClose = async () => {
    await evaluateLessonProgress(selectedLesson, true);
  };

  const markVideoProgress = async (lesson: AcademyLesson) => {
    const videoBlock = selectedBlocks.find(block => block.block_type === 'video');
    const videoSeconds = Number(videoBlock?.content?.durationSeconds ?? lesson.estimated_minutes * 60);
    const watchSeconds = Math.ceil(videoSeconds * (lesson.required_video_percent / 100));

    const { error } = await (supabasePublic as any).rpc('academy_mark_video_progress', {
      p_lesson_id: lesson.id,
      p_watch_seconds: watchSeconds,
      p_video_seconds: videoSeconds,
    });

    if (error) {
      toast({ title: 'Не удалось отметить просмотр', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Просмотр подтверждён', description: `Зачтено ${lesson.required_video_percent}% видео` });
    await loadData();
  };

  const confirmTask = async (lesson: AcademyLesson) => {
    const { error } = await (supabasePublic as any).rpc('academy_confirm_task', {
      p_lesson_id: lesson.id,
      p_completed: true,
    });

    if (error) {
      toast({ title: 'Не удалось подтвердить задание', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Задание подтверждено', description: 'Теперь можно получить XP за урок' });
    await loadData();
  };

  const awardXp = async (lesson: AcademyLesson) => {
    const { data, error } = await (supabasePublic as any).rpc('academy_award_xp', {
      p_lesson_id: lesson.id,
    });

    if (error) {
      toast({ title: 'Не удалось выдать XP', description: error.message, variant: 'destructive' });
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    const grantedXp = Number(row?.granted_xp ?? 0);
    const reason = String(row?.reason ?? 'unknown');

    if (grantedXp > 0) {
      toast({ title: 'XP начислен', description: `+${grantedXp} XP за урок` });
    } else {
      const reasonMap: Record<string, string> = {
        cooldown_active: 'Сработала задержка между выдачей XP',
        video_requirement_not_met: 'Недостаточно просмотра видео',
        task_not_completed: 'Сначала подтвердите выполнение задания',
        xp_cap_or_inactive: 'Достигнут дневной лимит XP или нет активности стримера',
      };
      toast({
        title: 'XP не начислен',
        description: reasonMap[reason] || 'Проверьте условия урока',
        variant: 'destructive',
      });
    }

    await loadData();
  };

  if (loading) {
    return <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">Загрузка академии...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Обучение</h1>
          <p className="text-muted-foreground mt-1">
            Курсы NovaBoost Academy с XP, задачами и прогрессом.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="font-bold text-primary">{stats.xpFromAcademy}</span>
          <span className="text-muted-foreground">XP из обучения</span>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="p-6 rounded-xl glass border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">Прогресс academy</h3>
          <span className="text-sm text-muted-foreground">
            {stats.progressPercent}% завершено
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-cosmic rounded-full transition-all duration-700"
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-sm">
          <span className="text-success">{stats.completed} пройдено</span>
          <span className="text-primary">{stats.available} доступно</span>
          <span className="text-muted-foreground">{stats.total} всего уроков</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                categoryFilter === cat 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {cat === 'all' ? 'Все' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLessons.map((lesson) => (
          (() => {
            const progress = getProgress(lesson.id);
            const isCompleted = progress?.status === 'completed';

            return (
              <div
                key={lesson.id}
                className={cn(
                  "group p-5 rounded-xl border transition-all duration-300",
                  isCompleted
                    ? "bg-success/5 border-success/30"
                    : "glass border-border hover:border-primary/30 hover:scale-[1.02]"
                )}
              >
            <div className="flex items-start justify-between mb-3">
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                isCompleted
                  ? "bg-success/20 text-success"
                  : "bg-secondary text-muted-foreground"
              )}>
                Урок
              </span>
              <div className={cn(
                "w-8 h-8 flex items-center justify-center rounded-full",
                isCompleted
                  ? "bg-success text-success-foreground"
                  : "bg-primary text-primary-foreground group-hover:shadow-glow transition-all"
              )}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </div>
            </div>

            <h3 className="font-medium mb-1">{lesson.title}</h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{lesson.summary || 'Без описания'}</p>

            <div className="text-xs text-muted-foreground mb-4 space-y-1">
              <p>Сложность: {lesson.difficulty}/5</p>
              <p>База XP: {lesson.xp_base}</p>
              <p>Видео минимум: {lesson.required_video_percent}%</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {lesson.estimated_minutes} мин
              </div>
              <button
                className={cn(
                  "text-sm font-medium transition-colors",
                  isCompleted ? "text-success hover:text-success/80" : "text-primary hover:text-primary/80"
                )}
                onClick={() => setSelectedLesson(lesson)}
              >
                {isCompleted ? 'Повторить ↺' : 'Открыть →'}
              </button>
            </div>
          </div>
            );
          })()
        ))}
      </div>

      <div className="rounded-xl border border-border p-4 bg-secondary/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="font-medium">AI-рекомендации</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Приоритет: курсы с низким прогрессом и высокой сложностью. Рекомендуем завершить ближайшие 2 урока, чтобы открыть дополнительные AI-инструменты.
        </p>
      </div>

      <Dialog open={Boolean(selectedLesson)} onOpenChange={(open) => { if (!open) { void handleLessonReaderClose(); setSelectedLesson(null); setReaderFullscreen(false); } }}>
        <DialogContent
          className={cn(
            'overflow-y-auto p-0',
            readerFullscreen
              ? 'max-w-[100vw] w-screen h-screen max-h-screen rounded-none sm:rounded-none'
              : 'sm:max-w-5xl max-h-[92vh]'
          )}
        >
          <DialogHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border px-6 py-4 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-display">{selectedLesson?.title}</DialogTitle>
            <button
              onClick={() => setReaderFullscreen(v => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-secondary/50 hover:bg-secondary transition-colors"
              title={readerFullscreen ? 'Свернуть' : 'На весь экран'}
            >
              {readerFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              {readerFullscreen ? 'Свернуть' : 'На весь экран'}
            </button>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {selectedLesson && (() => {
            const lessonProgress = getProgress(selectedLesson.id);
            const alreadyCompleted = lessonProgress?.status === 'completed';
            return (
            <div className="px-4 sm:px-8 py-6 space-y-6">
              {selectedLesson.summary && (
                <p className="academy-reader text-base text-muted-foreground !my-0">{selectedLesson.summary}</p>
              )}
              {readerHint && (
                <div className="academy-reader rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
                  {readerHint}
                </div>
              )}
              {alreadyCompleted && (
                <div className="academy-reader !my-0">
                  <div className="callout callout-green">
                    <div className="callout-icon">✓</div>
                    <div className="callout-body">Часть уже пройдена. Можно перечитать материал — повторные XP не начисляются.</div>
                  </div>
                </div>
              )}

              {selectedBlocks.map((block) => (
                <div key={block.id}>
                  {block.block_type === 'text' && (
                    <div className="academy-reader whitespace-pre-wrap">
                      {String(block.content?.body ?? '') || 'Текстовое содержимое блока не добавлено.'}
                    </div>
                  )}

                  {block.block_type === 'image' && (
                    <figure className="academy-reader">
                      {block.content?.url ? (
                        <>
                          <img src={String(block.content.url)} alt={String(block.content.caption ?? selectedLesson.title)} loading="lazy" />
                          {block.content?.caption ? <figcaption>{String(block.content.caption)}</figcaption> : null}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Изображение не задано.</p>
                      )}
                    </figure>
                  )}

                  {block.block_type === 'video' && (
                    <div className="academy-reader">
                      <div className="rounded-xl overflow-hidden border border-border">
                        {block.content?.url ? (
                          isYoutubeUrl(String(block.content.url)) ? (
                            <iframe
                              src={toEmbedVideoUrl(String(block.content.url))}
                              title={`video-${block.id}`}
                              className="w-full aspect-video"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              referrerPolicy="strict-origin-when-cross-origin"
                              allowFullScreen
                            />
                          ) : (
                            <video src={String(block.content.url)} className="w-full aspect-video object-cover bg-black" controls />
                          )
                        ) : (
                          <p className="text-sm text-muted-foreground p-4">Видео не задано.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {block.block_type === 'html' && (
                    <div
                      className="academy-reader"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(block.content?.html ?? '')) }}
                    />
                  )}

                  {block.block_type === 'heading' && (
                    <div className="academy-reader">
                      {(() => {
                        const level = Number(block.content?.level ?? 2);
                        const text = String(block.content?.text ?? block.content?.body ?? block.title ?? '');
                        if (level === 1) return <h1>{text}</h1>;
                        if (level === 3) return <h3>{text}</h3>;
                        if (level === 4) return <h4>{text}</h4>;
                        return <h2>{text}</h2>;
                      })()}
                    </div>
                  )}

                  {block.block_type === 'quote' && (
                    <div className="academy-reader">
                      <blockquote>
                        {String(block.content?.text ?? block.content?.body ?? '')}
                        {block.content?.author ? <p className="text-xs not-italic mt-2">— {String(block.content.author)}</p> : null}
                      </blockquote>
                    </div>
                  )}

                  {block.block_type === 'divider' && <div className="academy-reader"><hr /></div>}

                  {block.block_type === 'file' && block.content?.url && (
                    <div className="academy-reader">
                      <a href={String(block.content.url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                        📎 {String(block.content.caption ?? block.content.label ?? block.content.url)}
                      </a>
                    </div>
                  )}

                  {!['text','image','video','html','heading','quote','divider','file'].includes(block.block_type) && (
                    <pre className="text-xs whitespace-pre-wrap break-all text-muted-foreground rounded-lg border border-border p-3 bg-secondary/20">{JSON.stringify(block.content, null, 2)}</pre>
                  )}
                </div>
              ))}

              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 max-w-[760px] mx-auto">
                <p className="font-medium">Завершение урока</p>
                <div className="grid sm:grid-cols-3 gap-2">
                  <button className="px-3 py-2 text-sm rounded-lg border border-border bg-background hover:bg-secondary" onClick={() => void markVideoProgress(selectedLesson)}>
                    Подтвердить просмотр {selectedLesson.required_video_percent}%
                  </button>
                  <button className="px-3 py-2 text-sm rounded-lg border border-border bg-background hover:bg-secondary" onClick={() => void confirmTask(selectedLesson)}>
                    Подтвердить выполнение задания
                  </button>
                  <button className="px-3 py-2 text-sm rounded-lg border border-primary bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => void awardXp(selectedLesson)}>
                    Получить XP
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Анти-абьюз: проверяется минимум просмотра видео, выполнение задания, задержка между выдачами и дневной лимит XP.
                </p>
              </div>
            </div>
            );
          })()}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Learning;
