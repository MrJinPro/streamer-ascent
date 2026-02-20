import React, { useState } from 'react';
import type { Lesson } from '@/types/app-data';
import { Plus, Pencil, Trash2, GraduationCap, Lock, CheckCircle, Play, Type, Video, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAppData } from '@/contexts/AppDataContext';

type FormData = {
  title: string;
  description: string;
  duration: string;
  category: string;
  locked: boolean;
  contentType: 'text' | 'video' | 'image' | 'mixed';
  contentText: string;
  videoUrl: string;
  imageUrl: string;
};

const emptyForm: FormData = {
  title: '',
  description: '',
  duration: '15 мин',
  category: 'Основы',
  locked: false,
  contentType: 'text',
  contentText: '',
  videoUrl: '',
  imageUrl: '',
};

const contentTypeLabels: Record<FormData['contentType'], string> = {
  text: 'Текст',
  video: 'Видео',
  image: 'Изображение',
  mixed: 'Комбинированный',
};

const toEmbedVideoUrl = (url: string): string => {
  const trimmed = url.trim();
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

const AdminLearning: React.FC = () => {
  const { lessons: items, updateContent } = useAppData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const categories = Array.from(new Set(items.map(l => l.category)));

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (l: Lesson) => {
    setEditId(l.id);
    setForm({
      title: l.title,
      description: l.description,
      duration: l.duration,
      category: l.category,
      locked: l.locked,
      contentType: l.contentType ?? 'text',
      contentText: l.contentText ?? '',
      videoUrl: l.videoUrl ?? '',
      imageUrl: l.imageUrl ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    try {
      if (editId) {
        const nextItems = items.map(l => l.id === editId ? {
          ...l,
          title: form.title,
          description: form.description,
          duration: form.duration,
          category: form.category,
          locked: form.locked,
          contentType: form.contentType,
          contentText: form.contentText.trim() || undefined,
          videoUrl: form.videoUrl.trim() || undefined,
          imageUrl: form.imageUrl.trim() || undefined,
        } : l);
        await updateContent('lessons', nextItems);
        toast({ title: 'Урок обновлён' });
      } else {
        const newItem: Lesson = {
          id: Date.now().toString(),
          title: form.title,
          description: form.description,
          duration: form.duration,
          category: form.category,
          locked: form.locked,
          contentType: form.contentType,
          contentText: form.contentText.trim() || undefined,
          videoUrl: form.videoUrl.trim() || undefined,
          imageUrl: form.imageUrl.trim() || undefined,
          completed: false,
        };
        const nextItems = [...items, newItem];
        await updateContent('lessons', nextItems);
        toast({ title: 'Урок создан' });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Не удалось сохранить урок',
        description: error instanceof Error ? error.message : 'Ошибка записи в базу данных',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const nextItems = items.filter(l => l.id !== id);
      await updateContent('lessons', nextItems);
      setDeleteConfirm(null);
      toast({ title: 'Урок удалён' });
    } catch (error) {
      toast({
        title: 'Не удалось удалить урок',
        description: error instanceof Error ? error.message : 'Ошибка записи в базу данных',
        variant: 'destructive',
      });
    }
  };

  const toggleLocked = async (id: string) => {
    try {
      const nextItems = items.map(l => l.id === id ? { ...l, locked: !l.locked } : l);
      await updateContent('lessons', nextItems);
    } catch (error) {
      toast({
        title: 'Не удалось изменить доступ',
        description: error instanceof Error ? error.message : 'Ошибка записи в базу данных',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Управление обучением</h3>
          <span className="text-sm text-muted-foreground">({items.length} уроков)</span>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Добавить
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 rounded-xl border border-border bg-secondary/30">
          <p className="text-sm text-muted-foreground">Категории</p>
          <p className="text-xl font-bold">{categories.length}</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-secondary/30">
          <p className="text-sm text-muted-foreground">Доступные</p>
          <p className="text-xl font-bold text-primary">{items.filter(l => !l.locked).length}</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-secondary/30">
          <p className="text-sm text-muted-foreground">Заблокированные</p>
          <p className="text-xl font-bold text-muted-foreground">{items.filter(l => l.locked).length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Урок</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Категория</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Длительность</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Статус</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Доступ</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{l.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{l.description}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-secondary text-foreground">{l.category}</span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{l.duration}</td>
                <td className="px-4 py-3">
                  {l.completed ? (
                    <span className="flex items-center gap-1 text-xs text-success"><CheckCircle className="w-3.5 h-3.5" /> Пройден</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Play className="w-3.5 h-3.5" /> Не пройден</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleLocked(l.id)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors",
                      l.locked ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"
                    )}
                  >
                    {l.locked ? <><Lock className="w-3 h-3" /> Закрыт</> : '✓ Открыт'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="w-4 h-4" /></Button>
                    {deleteConfirm === l.id ? (
                      <div className="flex items-center gap-1">
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(l.id)}>Да</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Нет</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(l.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Редактировать урок' : 'Новый урок'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Название урока" />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Описание урока" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Категория</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="напр. Основы" />
              </div>
              <div>
                <Label>Длительность</Label>
                <Input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="напр. 30 мин" />
              </div>
            </div>
            <div>
              <Label>Формат материала</Label>
              <Select value={form.contentType} onValueChange={value => setForm(f => ({ ...f, contentType: value as FormData['contentType'] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Текст</SelectItem>
                  <SelectItem value="video">Видео</SelectItem>
                  <SelectItem value="image">Изображение</SelectItem>
                  <SelectItem value="mixed">Комбинированный</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(form.contentType === 'text' || form.contentType === 'mixed') && (
              <div>
                <Label className="flex items-center gap-2"><Type className="w-4 h-4" /> Контент (текст)</Label>
                <Textarea
                  value={form.contentText}
                  onChange={e => setForm(f => ({ ...f, contentText: e.target.value }))}
                  placeholder="Подробный текст урока: структура, шаги, советы..."
                  className="min-h-[140px]"
                />
              </div>
            )}

            {(form.contentType === 'video' || form.contentType === 'mixed') && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Video className="w-4 h-4" /> Видео URL</Label>
                <Input
                  value={form.videoUrl}
                  onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {form.videoUrl.trim() && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <iframe
                      src={toEmbedVideoUrl(form.videoUrl)}
                      title="video-preview"
                      className="w-full h-56"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}

            {(form.contentType === 'image' || form.contentType === 'mixed') && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Изображение URL</Label>
                <Input
                  value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://.../image.png"
                />
                {form.imageUrl.trim() && (
                  <div className="rounded-lg border border-border overflow-hidden bg-secondary/20">
                    <img src={form.imageUrl} alt="preview" className="w-full max-h-56 object-cover" />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch checked={form.locked} onCheckedChange={v => setForm(f => ({ ...f, locked: v }))} />
              <Label>Заблокирован по умолчанию</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button onClick={handleSave} disabled={!form.title.trim()}>{editId ? 'Сохранить' : 'Создать'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLearning;
