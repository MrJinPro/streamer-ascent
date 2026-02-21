import React, { useEffect, useMemo, useState } from 'react';
import { Plus, BookOpen, ListOrdered, GripVertical, Save } from 'lucide-react';
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

type AcademyBlock = {
  id: string;
  lesson_id: string;
  block_type: 'video' | 'text' | 'image' | 'gallery' | 'checklist' | 'quiz' | 'cta' | 'reward' | 'task';
  title: string | null;
  content: Record<string, unknown>;
  order_index: number;
  required: boolean;
};

const blockTypeLabels: Record<AcademyBlock['block_type'], string> = {
  video: 'Видео',
  text: 'Текст',
  image: 'Изображение',
  gallery: 'Галерея',
  checklist: 'Чеклист',
  quiz: 'Квиз',
  cta: 'CTA',
  reward: 'Награда',
  task: 'Задание',
};

const defaultBlockContent = (type: AcademyBlock['block_type']): Record<string, unknown> => {
  switch (type) {
    case 'video':
      return { url: '', minPercent: 70 };
    case 'text':
      return { body: '' };
    case 'image':
      return { url: '', caption: '' };
    case 'gallery':
      return { images: [] };
    case 'checklist':
      return { items: [{ text: '', required: true }] };
    case 'quiz':
      return { question: '', options: ['', '', ''], answerIndex: 0 };
    case 'cta':
      return { label: 'Открыть', actionUrl: '' };
    case 'reward':
      return { rewardType: 'xp', value: 50 };
    case 'task':
      return { title: 'Провести стрим 60 минут', verificationType: 'stream_minutes', minutes: 60 };
    default:
      return {};
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

  const [newBlockType, setNewBlockType] = useState<AcademyBlock['block_type']>('text');
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockContentJson, setNewBlockContentJson] = useState('{\n  "body": ""\n}');

  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);

  const selectedCourseLessons = useMemo(
    () => lessons.filter(lesson => lesson.course_id === selectedCourseId).sort((a, b) => a.order_index - b.order_index),
    [lessons, selectedCourseId],
  );

  const selectedLessonBlocks = useMemo(
    () => blocks.filter(block => block.lesson_id === selectedLessonId).sort((a, b) => a.order_index - b.order_index),
    [blocks, selectedLessonId],
  );

  const loadData = async () => {
    setLoading(true);

    const [{ data: coursesData, error: coursesError }, { data: lessonsData, error: lessonsError }, { data: blocksData, error: blocksError }] = await Promise.all([
      supabasePublic.from('academy_courses').select('*').order('order_index', { ascending: true }),
      supabasePublic.from('academy_lessons').select('*').order('order_index', { ascending: true }),
      supabasePublic.from('academy_blocks').select('*').order('order_index', { ascending: true }),
    ]);

    if (coursesError || lessonsError || blocksError) {
      toast({
        title: 'Ошибка загрузки academy',
        description: coursesError?.message || lessonsError?.message || blocksError?.message || 'Не удалось загрузить данные',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    setCourses((coursesData ?? []) as AcademyCourse[]);
    setLessons((lessonsData ?? []) as AcademyLesson[]);
    setBlocks((blocksData ?? []) as AcademyBlock[]);

    if (!selectedCourseId && (coursesData ?? []).length > 0) {
      setSelectedCourseId((coursesData ?? [])[0].id);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      setSelectedLessonId('');
      return;
    }

    const lesson = selectedCourseLessons[0];
    if (lesson && !selectedCourseLessons.some(item => item.id === selectedLessonId)) {
      setSelectedLessonId(lesson.id);
    }
  }, [selectedCourseId, selectedCourseLessons, selectedLessonId]);

  const createCourse = async () => {
    if (!newCourseTitle.trim()) return;

    const orderIndex = courses.length;

    const { error } = await supabasePublic.from('academy_courses').insert({
      title: newCourseTitle.trim(),
      description: newCourseDescription.trim() || null,
      order_index: orderIndex,
      is_published: false,
      difficulty: 1,
    });

    if (error) {
      toast({ title: 'Не удалось создать курс', description: error.message, variant: 'destructive' });
      return;
    }

    setNewCourseTitle('');
    setNewCourseDescription('');
    toast({ title: 'Курс создан' });
    await loadData();
  };

  const createLesson = async () => {
    if (!selectedCourseId || !newLessonTitle.trim()) return;

    const orderIndex = selectedCourseLessons.length;

    const { error } = await supabasePublic.from('academy_lessons').insert({
      course_id: selectedCourseId,
      title: newLessonTitle.trim(),
      summary: newLessonSummary.trim() || null,
      order_index: orderIndex,
      difficulty: Number(newLessonDifficulty) || 1,
      xp_base: Number(newLessonXpBase) || 50,
      required_video_percent: 70,
      is_published: false,
    });

    if (error) {
      toast({ title: 'Не удалось создать урок', description: error.message, variant: 'destructive' });
      return;
    }

    setNewLessonTitle('');
    setNewLessonSummary('');
    setNewLessonDifficulty('1');
    setNewLessonXpBase('50');
    toast({ title: 'Урок создан' });
    await loadData();
  };

  const createBlock = async () => {
    if (!selectedLessonId) return;

    let parsedContent: Record<string, unknown>;
    try {
      parsedContent = JSON.parse(newBlockContentJson);
    } catch {
      toast({ title: 'Некорректный JSON', description: 'Проверь формат содержимого блока', variant: 'destructive' });
      return;
    }

    const orderIndex = selectedLessonBlocks.length;

    const { error } = await supabasePublic.from('academy_blocks').insert({
      lesson_id: selectedLessonId,
      block_type: newBlockType,
      title: newBlockTitle.trim() || null,
      content: parsedContent,
      order_index: orderIndex,
      required: true,
    });

    if (error) {
      toast({ title: 'Не удалось создать блок', description: error.message, variant: 'destructive' });
      return;
    }

    setNewBlockTitle('');
    setNewBlockContentJson(JSON.stringify(defaultBlockContent(newBlockType), null, 2));
    toast({ title: 'Блок добавлен' });
    await loadData();
  };

  const toggleCoursePublished = async (courseId: string, next: boolean) => {
    const { error } = await supabasePublic.from('academy_courses').update({ is_published: next }).eq('id', courseId);
    if (error) {
      toast({ title: 'Не удалось обновить курс', description: error.message, variant: 'destructive' });
      return;
    }

    setCourses(prev => prev.map(item => item.id === courseId ? { ...item, is_published: next } : item));
  };

  const toggleLessonPublished = async (lessonId: string, next: boolean) => {
    const { error } = await supabasePublic.from('academy_lessons').update({ is_published: next }).eq('id', lessonId);
    if (error) {
      toast({ title: 'Не удалось обновить урок', description: error.message, variant: 'destructive' });
      return;
    }

    setLessons(prev => prev.map(item => item.id === lessonId ? { ...item, is_published: next } : item));
  };

  const reorderBlocks = async (fromBlockId: string, toBlockId: string) => {
    if (fromBlockId === toBlockId || !selectedLessonId) return;

    const ordered = [...selectedLessonBlocks];
    const fromIndex = ordered.findIndex(item => item.id === fromBlockId);
    const toIndex = ordered.findIndex(item => item.id === toBlockId);
    if (fromIndex < 0 || toIndex < 0) return;

    const [moved] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, moved);

    const payload = ordered.map((item, index) => ({ id: item.id, order_index: index }));

    const { error } = await supabasePublic.from('academy_blocks').upsert(payload, { onConflict: 'id' });
    if (error) {
      toast({ title: 'Не удалось изменить порядок блоков', description: error.message, variant: 'destructive' });
      return;
    }

    setBlocks(prev => prev.map(item => {
      const found = payload.find(p => p.id === item.id);
      return found ? { ...item, order_index: found.order_index } : item;
    }));
  };

  useEffect(() => {
    setNewBlockContentJson(JSON.stringify(defaultBlockContent(newBlockType), null, 2));
  }, [newBlockType]);

  if (loading) {
    return <div className="rounded-xl border border-border p-6 text-sm text-muted-foreground">Загрузка academy...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Курсы</h3>
        </div>
        <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3">
          <Input value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} placeholder="Название курса" />
          <Input value={newCourseDescription} onChange={e => setNewCourseDescription(e.target.value)} placeholder="Краткое описание" />
          <Button onClick={() => void createCourse()}><Plus className="w-4 h-4 mr-2" />Курс</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {courses.map(course => (
            <button
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className={cn(
                'text-left rounded-lg border p-3 transition-colors',
                selectedCourseId === course.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/40',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">{course.title}</p>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    void toggleCoursePublished(course.id, !course.is_published);
                  }}
                  className={cn('text-xs px-2 py-1 rounded-full', course.is_published ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground')}
                >
                  {course.is_published ? 'Опубликован' : 'Черновик'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description || 'Без описания'}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-5 h-5 text-accent" />
          <h3 className="font-semibold">Уроки</h3>
        </div>

        <div className="grid md:grid-cols-[1.3fr_1fr_120px_120px_auto] gap-3">
          <Input value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} placeholder="Название урока" disabled={!selectedCourseId} />
          <Input value={newLessonSummary} onChange={e => setNewLessonSummary(e.target.value)} placeholder="Краткое описание" disabled={!selectedCourseId} />
          <Input value={newLessonDifficulty} onChange={e => setNewLessonDifficulty(e.target.value)} placeholder="Сложн. 1-5" disabled={!selectedCourseId} />
          <Input value={newLessonXpBase} onChange={e => setNewLessonXpBase(e.target.value)} placeholder="XP база" disabled={!selectedCourseId} />
          <Button onClick={() => void createLesson()} disabled={!selectedCourseId}><Plus className="w-4 h-4 mr-2" />Урок</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-2">
          {selectedCourseLessons.map(lesson => (
            <button
              key={lesson.id}
              onClick={() => setSelectedLessonId(lesson.id)}
              className={cn(
                'text-left rounded-lg border p-3 transition-colors',
                selectedLessonId === lesson.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/40',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">{lesson.title}</p>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    void toggleLessonPublished(lesson.id, !lesson.is_published);
                  }}
                  className={cn('text-xs px-2 py-1 rounded-full', lesson.is_published ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground')}
                >
                  {lesson.is_published ? 'Опубликован' : 'Черновик'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{lesson.summary || 'Без описания'}</p>
              <p className="text-xs text-muted-foreground mt-2">XP: {lesson.xp_base} • Сложность: {lesson.difficulty}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border p-4 space-y-3">
        <h3 className="font-semibold">Конструктор блоков урока</h3>

        <div className="grid md:grid-cols-[200px_1fr_1fr_auto] gap-3">
          <div>
            <Label>Тип блока</Label>
            <Select value={newBlockType} onValueChange={value => setNewBlockType(value as AcademyBlock['block_type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(blockTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Название блока</Label>
            <Input value={newBlockTitle} onChange={e => setNewBlockTitle(e.target.value)} placeholder="Например: Проверочный квиз" disabled={!selectedLessonId} />
          </div>
          <div>
            <Label>Содержимое блока (JSON)</Label>
            <Textarea
              value={newBlockContentJson}
              onChange={e => setNewBlockContentJson(e.target.value)}
              className="min-h-[88px] font-mono text-xs"
              disabled={!selectedLessonId}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => void createBlock()} disabled={!selectedLessonId}><Plus className="w-4 h-4 mr-2" />Блок</Button>
          </div>
        </div>

        <div className="space-y-2">
          {selectedLessonBlocks.map(block => (
            <div
              key={block.id}
              draggable
              onDragStart={() => setDraggingBlockId(block.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggingBlockId) {
                  void reorderBlocks(draggingBlockId, block.id);
                }
                setDraggingBlockId(null);
              }}
              className="rounded-lg border border-border p-3 bg-secondary/20"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="font-medium truncate">{block.title || blockTypeLabels[block.block_type]}</p>
                  <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">{blockTypeLabels[block.block_type]}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    const { error } = await supabasePublic.from('academy_blocks').delete().eq('id', block.id);
                    if (error) {
                      toast({ title: 'Не удалось удалить блок', description: error.message, variant: 'destructive' });
                      return;
                    }
                    setBlocks(prev => prev.filter(item => item.id !== block.id));
                  }}
                >
                  <Save className="w-4 h-4 text-destructive" />
                </Button>
              </div>
              <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap break-all">{JSON.stringify(block.content, null, 2)}</pre>
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
