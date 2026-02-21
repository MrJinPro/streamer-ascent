import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle, Clock, Filter, Play, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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
  block_type: 'video' | 'text' | 'image' | 'gallery' | 'checklist' | 'quiz' | 'cta' | 'reward' | 'task';
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
              {!isCompleted && (
                <button
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  onClick={() => setSelectedLesson(lesson)}
                >
                  Открыть →
                </button>
              )}
              {isCompleted && (
                <span className="text-sm text-success">✓ Пройдено</span>
              )}
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

      <Dialog open={Boolean(selectedLesson)} onOpenChange={(open) => !open && setSelectedLesson(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedLesson?.title}</DialogTitle>
          </DialogHeader>

          {selectedLesson && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedLesson.summary}</p>

              {selectedBlocks.map((block) => (
                <div key={block.id} className="rounded-xl border border-border p-4 bg-secondary/20">
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{block.block_type}</p>
                  {block.title && <p className="font-medium mb-2">{block.title}</p>}

                  {block.block_type === 'text' && (
                    <div className="rounded-xl border border-border bg-secondary/20 p-4 whitespace-pre-wrap leading-relaxed">
                      {String(block.content?.body ?? '') || 'Текстовое содержимое блока не добавлено.'}
                    </div>
                  )}

                  {block.block_type === 'image' && (
                    <div className="rounded-xl overflow-hidden border border-border bg-secondary/20">
                      {block.content?.url ? (
                        <img src={String(block.content.url)} alt={selectedLesson.title} className="w-full max-h-[360px] object-cover" />
                      ) : (
                        <p className="text-sm text-muted-foreground p-4">Изображение не задано.</p>
                      )}
                    </div>
                  )}

                  {block.block_type === 'video' && (
                    <div className="rounded-xl overflow-hidden border border-border">
                      {block.content?.url ? (
                        isYoutubeUrl(String(block.content.url)) ? (
                          <iframe
                            src={toEmbedVideoUrl(String(block.content.url))}
                            title={`video-${block.id}`}
                            className="w-full h-72"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        ) : (
                          <video src={String(block.content.url)} className="w-full h-72 object-cover bg-black" controls />
                        )
                      ) : (
                        <p className="text-sm text-muted-foreground p-4">Видео не задано.</p>
                      )}
                    </div>
                  )}

                  {block.block_type !== 'text' && block.block_type !== 'image' && block.block_type !== 'video' && (
                    <pre className="text-xs whitespace-pre-wrap break-all text-muted-foreground">{JSON.stringify(block.content, null, 2)}</pre>
                  )}
                </div>
              ))}

              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Learning;
