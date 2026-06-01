import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, BookOpen, ListOrdered, GripVertical, Trash2, Eye, EyeOff, Pencil, Check, X, ClipboardPaste } from 'lucide-react';
import { sanitizeHtml } from '@/lib/safeHtml';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type AcademyCourse = {
  id: string;
  title: string;
  description: string | null;
  difficulty: number;
  is_published: boolean;
  order_index: number;
};

type AcademyLesson = {
  id: string;
  course_id: string;
  title: string;
  summary: string | null;
  order_index: number;
  difficulty: number;
  xp_base: number;
  required_video_percent: number;
  is_published: boolean;
};

type BlockType =
  | 'video' | 'text' | 'html' | 'heading' | 'quote' | 'image' | 'gallery'
  | 'file' | 'divider' | 'checklist' | 'quiz' | 'cta' | 'reward' | 'task';

type AcademyBlock = {
  id: string;
  lesson_id: string;
  block_type: BlockType;
  title: string | null;
  content: Record<string, unknown>;
  order_index: number;
  required: boolean;
};

const blockTypeLabels: Record<BlockType, string> = {
  video: 'Видео',
  text: 'Текст (Markdown)',
  html: 'HTML',
  heading: 'Заголовок',
  quote: 'Цитата',
  image: 'Изображение',
  gallery: 'Галерея',
  file: 'Файл',
  divider: 'Разделитель',
  checklist: 'Чеклист',
  quiz: 'Квиз',
  cta: 'CTA',
  reward: 'Награда',
  task: 'Задание',
};

const defaultBlockContent = (type: BlockType): Record<string, unknown> => {
  switch (type) {
    case 'video': return { url: '', minPercent: 70 };
    case 'text': return { body: '', font: 'sans', align: 'left' };
    case 'html': return { html: '<p>Вставь HTML — теги script и on* будут вырезаны.</p>' };
    case 'heading': return { body: 'Заголовок раздела', level: 2 };
    case 'quote': return { body: 'Цитата', author: '' };
    case 'image': return { url: '', caption: '' };
    case 'gallery': return { images: [] };
    case 'file': return { url: '', caption: 'Файл' };
    case 'divider': return {};
    case 'checklist': return { items: [{ text: '', required: true }] };
    case 'quiz': return { question: '', options: ['', '', ''], answerIndex: 0 };
    case 'cta': return { label: 'Открыть', actionUrl: '' };
    case 'reward': return { rewardType: 'xp', value: 50 };
    case 'task': return { title: 'Провести стрим 60 минут', verificationType: 'stream_minutes', minutes: 60 };
  }
};

const AdminAcademy: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<AcademyCourse[]>([]);
  const [lessons, setLessons] = useState<AcademyLesson[]>([]);
  const [blocks, setBlocks] = useState<AcademyBlock[]>([]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');

  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');

  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonSummary, setNewLessonSummary] = useState('');
  const [newLessonDifficulty, setNewLessonDifficulty] = useState('1');
  const [newLessonXpBase, setNewLessonXpBase] = useState('50');

  const [newBlockType, setNewBlockType] = useState<BlockType>('text');
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockContentJson, setNewBlockContentJson] = useState('{\n  "body": ""\n}');
  const [editorMode, setEditorMode] = useState<'rich' | 'block' | 'html'>('rich');
  const [htmlBuffer, setHtmlBuffer] = useState('<p>...</p>');
  const richRef = useRef<HTMLDivElement | null>(null);
  const [richHtml, setRichHtml] = useState('');

  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editCourseDraft, setEditCourseDraft] = useState({ title: '', description: '' });
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonDraft, setEditLessonDraft] = useState({ title: '', summary: '', xp_base: 50 });

  const selectedCourseLessons = useMemo(
    () => lessons.filter(l => l.course_id === selectedCourseId).sort((a, b) => a.order_index - b.order_index),
    [lessons, selectedCourseId],
  );
  const selectedLessonBlocks = useMemo(
    () => blocks.filter(b => b.lesson_id === selectedLessonId).sort((a, b) => a.order_index - b.order_index),
    [blocks, selectedLessonId],
  );

  const loadData = async () => {
    setLoading(true);
    const [c, l, b] = await Promise.all([
      supabasePublic.from('academy_courses').select('*').order('order_index'),
      supabasePublic.from('academy_lessons').select('*').order('order_index'),
      supabasePublic.from('academy_blocks').select('*').order('order_index'),
    ]);
    if (c.error || l.error || b.error) {
      toast({ title: 'Ошибка загрузки', description: c.error?.message || l.error?.message || b.error?.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    setCourses((c.data ?? []) as AcademyCourse[]);
    setLessons((l.data ?? []) as AcademyLesson[]);
    setBlocks((b.data ?? []) as AcademyBlock[]);
    if (!selectedCourseId && (c.data ?? []).length > 0) setSelectedCourseId((c.data ?? [])[0].id);
    setLoading(false);
  };

  useEffect(() => { void loadData(); }, []);

  useEffect(() => {
    if (!selectedCourseId) { setSelectedLessonId(''); return; }
    const lesson = selectedCourseLessons[0];
    if (lesson && !selectedCourseLessons.some(item => item.id === selectedLessonId)) {
      setSelectedLessonId(lesson.id);
    }
  }, [selectedCourseId, selectedCourseLessons, selectedLessonId]);

  useEffect(() => {
    setNewBlockContentJson(JSON.stringify(defaultBlockContent(newBlockType), null, 2));
  }, [newBlockType]);

  const createCourse = async () => {
    if (!newCourseTitle.trim()) return;
    const { error } = await supabasePublic.from('academy_courses').insert({
      title: newCourseTitle.trim(),
      description: newCourseDescription.trim() || null,
      order_index: courses.length,
      is_published: true,
      difficulty: 1,
    });
    if (error) { toast({ title: 'Не создан', description: error.message, variant: 'destructive' }); return; }
    setNewCourseTitle(''); setNewCourseDescription('');
    toast({ title: 'Курс создан' });
    await loadData();
  };

  const createLesson = async () => {
    if (!selectedCourseId || !newLessonTitle.trim()) return;
    const { error } = await supabasePublic.from('academy_lessons').insert({
      course_id: selectedCourseId,
      title: newLessonTitle.trim(),
      summary: newLessonSummary.trim() || null,
      order_index: selectedCourseLessons.length,
      difficulty: Number(newLessonDifficulty) || 1,
      xp_base: Number(newLessonXpBase) || 50,
      required_video_percent: 70,
      is_published: true,
    });
    if (error) { toast({ title: 'Не создан', description: error.message, variant: 'destructive' }); return; }
    setNewLessonTitle(''); setNewLessonSummary(''); setNewLessonDifficulty('1'); setNewLessonXpBase('50');
    toast({ title: 'Урок создан' });
    await loadData();
  };

  const createBlock = async () => {
    if (!selectedLessonId) return;
    let content: Record<string, unknown>;
    let blockType: BlockType = newBlockType;
    if (editorMode === 'html') {
      content = { html: htmlBuffer };
      blockType = 'html';
    } else if (editorMode === 'rich') {
      const html = (richRef.current?.innerHTML ?? richHtml).trim();
      if (!html) { toast({ title: 'Пустой контент', variant: 'destructive' }); return; }
      content = { html: sanitizeHtml(html) };
      blockType = 'html';
    } else {
      try { content = JSON.parse(newBlockContentJson); }
      catch { toast({ title: 'Некорректный JSON', variant: 'destructive' }); return; }
    }
    const { error } = await supabasePublic.from('academy_blocks').insert({
      lesson_id: selectedLessonId,
      block_type: blockType,
      title: newBlockTitle.trim() || null,
      content,
      order_index: selectedLessonBlocks.length,
      required: true,
    });
    if (error) { toast({ title: 'Не создан блок', description: error.message, variant: 'destructive' }); return; }
    setNewBlockTitle('');
    setNewBlockContentJson(JSON.stringify(defaultBlockContent(newBlockType), null, 2));
    setHtmlBuffer('<p>...</p>');
    setRichHtml('');
    if (richRef.current) richRef.current.innerHTML = '';
    toast({ title: 'Блок добавлен' });
    await loadData();
  };

  const createPartWithContent = async () => {
    if (!selectedCourseId) return;
    const html = (richRef.current?.innerHTML ?? richHtml).trim();
    const title = newBlockTitle.trim() || newLessonTitle.trim();
    if (!title) { toast({ title: 'Укажите название части', variant: 'destructive' }); return; }
    if (!html) { toast({ title: 'Вставьте контент', variant: 'destructive' }); return; }
    const { data: lesson, error: lessonError } = await supabasePublic.from('academy_lessons').insert({
      course_id: selectedCourseId,
      title,
      summary: newLessonSummary.trim() || null,
      order_index: selectedCourseLessons.length,
      difficulty: Number(newLessonDifficulty) || 1,
      xp_base: Number(newLessonXpBase) || 50,
      required_video_percent: 0,
      is_published: true,
    }).select('id').single();
    if (lessonError || !lesson) { toast({ title: 'Не создана часть', description: lessonError?.message, variant: 'destructive' }); return; }
    const { error: blockError } = await supabasePublic.from('academy_blocks').insert({
      lesson_id: lesson.id,
      block_type: 'html',
      title,
      content: { html: sanitizeHtml(html) },
      order_index: 0,
      required: true,
    });
    if (blockError) { toast({ title: 'Часть создана, но блок не сохранён', description: blockError.message, variant: 'destructive' }); }
    else { toast({ title: 'Часть добавлена с контентом' }); }
    setNewBlockTitle(''); setNewLessonTitle(''); setNewLessonSummary('');
    setRichHtml('');
    if (richRef.current) richRef.current.innerHTML = '';
    await loadData();
    setSelectedLessonId(lesson.id);
  };

  const toggleCoursePublished = async (id: string, next: boolean) => {
    const { error } = await supabasePublic.from('academy_courses').update({ is_published: next }).eq('id', id);
    if (error) { toast({ title: 'Ошибка', description: error.message, variant: 'destructive' }); return; }
    setCourses(prev => prev.map(c => c.id === id ? { ...c, is_published: next } : c));
  };

  const toggleLessonPublished = async (id: string, next: boolean) => {
    const { error } = await supabasePublic.from('academy_lessons').update({ is_published: next }).eq('id', id);
    if (error) { toast({ title: 'Ошибка', description: error.message, variant: 'destructive' }); return; }
    setLessons(prev => prev.map(l => l.id === id ? { ...l, is_published: next } : l));
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('Удалить курс и все его уроки/блоки/прогресс? Действие необратимо.')) return;
    const { error } = await supabasePublic.rpc('academy_delete_course', { p_course_id: id });
    if (error) { toast({ title: 'Не удалось удалить', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Курс удалён' });
    if (selectedCourseId === id) setSelectedCourseId('');
    await loadData();
  };

  const deleteLesson = async (id: string) => {
    if (!confirm('Удалить урок и все его блоки/прогресс?')) return;
    const { error } = await supabasePublic.rpc('academy_delete_lesson', { p_lesson_id: id });
    if (error) { toast({ title: 'Не удалось удалить', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Урок удалён' });
    if (selectedLessonId === id) setSelectedLessonId('');
    await loadData();
  };

  const saveCourseEdit = async () => {
    if (!editingCourseId) return;
    const { error } = await supabasePublic.from('academy_courses').update({
      title: editCourseDraft.title.trim(),
      description: editCourseDraft.description.trim() || null,
    }).eq('id', editingCourseId);
    if (error) { toast({ title: 'Ошибка', description: error.message, variant: 'destructive' }); return; }
    setEditingCourseId(null);
    await loadData();
  };

  const saveLessonEdit = async () => {
    if (!editingLessonId) return;
    const { error } = await supabasePublic.from('academy_lessons').update({
      title: editLessonDraft.title.trim(),
      summary: editLessonDraft.summary.trim() || null,
      xp_base: Number(editLessonDraft.xp_base) || 50,
    }).eq('id', editingLessonId);
    if (error) { toast({ title: 'Ошибка', description: error.message, variant: 'destructive' }); return; }
    setEditingLessonId(null);
    await loadData();
  };

  const reorderBlocks = async (from: string, to: string) => {
    if (from === to) return;
    const ordered = [...selectedLessonBlocks];
    const fi = ordered.findIndex(o => o.id === from);
    const ti = ordered.findIndex(o => o.id === to);
    if (fi < 0 || ti < 0) return;
    const [m] = ordered.splice(fi, 1);
    ordered.splice(ti, 0, m);
    const payload = ordered.map((it, i) => ({ id: it.id, order_index: i }));
    const { error } = await supabasePublic.from('academy_blocks').upsert(payload, { onConflict: 'id' });
    if (error) { toast({ title: 'Ошибка', description: error.message, variant: 'destructive' }); return; }
    setBlocks(prev => prev.map(item => {
      const f = payload.find(p => p.id === item.id);
      return f ? { ...item, order_index: f.order_index } : item;
    }));
  };

  const deleteBlock = async (id: string) => {
    if (!confirm('Удалить блок?')) return;
    const { error } = await supabasePublic.from('academy_blocks').delete().eq('id', id);
    if (error) { toast({ title: 'Ошибка', description: error.message, variant: 'destructive' }); return; }
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  if (loading) return <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">Загрузка...</div>;

  return (
    <div className="space-y-6">
      {/* Courses */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Главы курса</h3>
          <span className="text-xs text-muted-foreground">(каждая глава = курс с частями)</span>
        </div>
        <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3">
          <Input value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} placeholder="Название главы" />
          <Input value={newCourseDescription} onChange={e => setNewCourseDescription(e.target.value)} placeholder="Описание главы" />
          <Button onClick={() => void createCourse()}><Plus className="w-4 h-4 mr-2" />Глава</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {courses.map(course => (
            <div
              key={course.id}
              className={cn('rounded-lg border p-3', selectedCourseId === course.id ? 'border-primary bg-primary/5' : 'border-border')}
            >
              {editingCourseId === course.id ? (
                <div className="space-y-2">
                  <Input value={editCourseDraft.title} onChange={e => setEditCourseDraft(d => ({ ...d, title: e.target.value }))} placeholder="Название" />
                  <Input value={editCourseDraft.description} onChange={e => setEditCourseDraft(d => ({ ...d, description: e.target.value }))} placeholder="Описание" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void saveCourseEdit()}><Check className="w-3 h-3 mr-1" />Сохранить</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingCourseId(null)}><X className="w-3 h-3" /></Button>
                  </div>
                </div>
              ) : (
                <>
                  <button onClick={() => setSelectedCourseId(course.id)} className="text-left w-full">
                    <p className="font-medium truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description || 'Без описания'}</p>
                  </button>
                  <div className="flex items-center gap-1 mt-2">
                    <Button size="sm" variant="ghost" onClick={() => { setEditingCourseId(course.id); setEditCourseDraft({ title: course.title, description: course.description ?? '' }); }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void toggleCoursePublished(course.id, !course.is_published)}>
                      {course.is_published ? <Eye className="w-3 h-3 text-success" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void deleteCourse(course.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                    <span className={cn('ml-auto text-xs px-2 py-0.5 rounded-full', course.is_published ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground')}>
                      {course.is_published ? 'Опубликован' : 'Скрыт'}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lessons */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-accent" />
          <h3 className="font-semibold">Части главы</h3>
          <span className="text-xs text-muted-foreground">(каждая часть = урок)</span>
        </div>
        <div className="grid md:grid-cols-[1.3fr_1fr_120px_120px_auto] gap-3">
          <Input value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} placeholder="Название части" disabled={!selectedCourseId} />
          <Input value={newLessonSummary} onChange={e => setNewLessonSummary(e.target.value)} placeholder="Краткое описание" disabled={!selectedCourseId} />
          <Input value={newLessonDifficulty} onChange={e => setNewLessonDifficulty(e.target.value)} placeholder="Сложн. 1-5" disabled={!selectedCourseId} />
          <Input value={newLessonXpBase} onChange={e => setNewLessonXpBase(e.target.value)} placeholder="XP база" disabled={!selectedCourseId} />
          <Button onClick={() => void createLesson()} disabled={!selectedCourseId}><Plus className="w-4 h-4 mr-2" />Часть</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {selectedCourseLessons.map(lesson => (
            <div
              key={lesson.id}
              className={cn('rounded-lg border p-3', selectedLessonId === lesson.id ? 'border-primary bg-primary/5' : 'border-border')}
            >
              {editingLessonId === lesson.id ? (
                <div className="space-y-2">
                  <Input value={editLessonDraft.title} onChange={e => setEditLessonDraft(d => ({ ...d, title: e.target.value }))} placeholder="Название" />
                  <Input value={editLessonDraft.summary} onChange={e => setEditLessonDraft(d => ({ ...d, summary: e.target.value }))} placeholder="Описание" />
                  <Input type="number" value={editLessonDraft.xp_base} onChange={e => setEditLessonDraft(d => ({ ...d, xp_base: Number(e.target.value) }))} placeholder="XP" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void saveLessonEdit()}><Check className="w-3 h-3 mr-1" />Сохранить</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingLessonId(null)}><X className="w-3 h-3" /></Button>
                  </div>
                </div>
              ) : (
                <>
                  <button onClick={() => setSelectedLessonId(lesson.id)} className="text-left w-full">
                    <p className="font-medium truncate">{lesson.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{lesson.summary || 'Без описания'}</p>
                    <p className="text-xs text-muted-foreground mt-2">XP: {lesson.xp_base} • Сложность: {lesson.difficulty}</p>
                  </button>
                  <div className="flex items-center gap-1 mt-2">
                    <Button size="sm" variant="ghost" onClick={() => { setEditingLessonId(lesson.id); setEditLessonDraft({ title: lesson.title, summary: lesson.summary ?? '', xp_base: lesson.xp_base }); }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void toggleLessonPublished(lesson.id, !lesson.is_published)}>
                      {lesson.is_published ? <Eye className="w-3 h-3 text-success" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void deleteLesson(lesson.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                    <span className={cn('ml-auto text-xs px-2 py-0.5 rounded-full', lesson.is_published ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground')}>
                      {lesson.is_published ? 'Опубликован' : 'Скрыт'}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Block editor */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-semibold">Конструктор блоков урока</h3>
          <div className="flex gap-1 p-1 rounded-md bg-secondary">
            <button
              onClick={() => setEditorMode('block')}
              className={cn('px-3 py-1 text-xs rounded', editorMode === 'block' ? 'bg-background shadow' : 'text-muted-foreground')}
            >Блочный</button>
            <button
              onClick={() => setEditorMode('html')}
              className={cn('px-3 py-1 text-xs rounded', editorMode === 'html' ? 'bg-background shadow' : 'text-muted-foreground')}
            >HTML</button>
          </div>
        </div>

        {editorMode === 'block' ? (
          <div className="grid md:grid-cols-[200px_1fr_1fr_auto] gap-3">
            <div>
              <Label>Тип блока</Label>
              <Select value={newBlockType} onValueChange={v => setNewBlockType(v as BlockType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(blockTypeLabels).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Название</Label>
              <Input value={newBlockTitle} onChange={e => setNewBlockTitle(e.target.value)} placeholder="Опционально" disabled={!selectedLessonId} />
            </div>
            <div>
              <Label>Содержимое (JSON)</Label>
              <Textarea value={newBlockContentJson} onChange={e => setNewBlockContentJson(e.target.value)} className="min-h-[88px] font-mono text-xs" disabled={!selectedLessonId} />
            </div>
            <div className="flex items-end">
              <Button onClick={() => void createBlock()} disabled={!selectedLessonId}><Plus className="w-4 h-4 mr-2" />Блок</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>HTML-разметка (теги script и обработчики on* удаляются автоматически)</Label>
            <Textarea value={htmlBuffer} onChange={e => setHtmlBuffer(e.target.value)} className="min-h-[180px] font-mono text-xs" disabled={!selectedLessonId} />
            <Input value={newBlockTitle} onChange={e => setNewBlockTitle(e.target.value)} placeholder="Название блока (опционально)" disabled={!selectedLessonId} />
            <Button onClick={() => void createBlock()} disabled={!selectedLessonId}><Plus className="w-4 h-4 mr-2" />Добавить HTML-блок</Button>
          </div>
        )}

        <div className="space-y-2">
          {selectedLessonBlocks.map(block => (
            <div
              key={block.id}
              draggable
              onDragStart={() => setDraggingBlockId(block.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (draggingBlockId) void reorderBlocks(draggingBlockId, block.id); setDraggingBlockId(null); }}
              className="rounded-lg border border-border p-3 bg-secondary/20"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="font-medium truncate">{block.title || blockTypeLabels[block.block_type]}</p>
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">{blockTypeLabels[block.block_type]}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => void deleteBlock(block.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap break-all line-clamp-3">{JSON.stringify(block.content, null, 2)}</pre>
            </div>
          ))}
          {selectedLessonId && selectedLessonBlocks.length === 0 && (
            <p className="text-sm text-muted-foreground">У этого урока пока нет блоков.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAcademy;
