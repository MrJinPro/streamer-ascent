import React, { useState } from 'react';
import type { Task } from '@/types/app-data';
import { Plus, Pencil, Trash2, ListTodo, Calendar, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAppData } from '@/contexts/AppDataContext';

const typeLabels = { daily: 'Ежедневное', weekly: 'Недельное', challenge: 'Челлендж' };
const typeStyles = {
  daily: 'bg-primary/20 text-primary',
  weekly: 'bg-accent/20 text-accent',
  challenge: 'bg-nova-purple/20 text-nova-purple',
};

type FormData = {
  title: string;
  description: string;
  type: Task['type'];
  xpReward: number;
  maxProgress: number;
  deadline?: string;
};

const emptyForm: FormData = { title: '', description: '', type: 'daily', xpReward: 100, maxProgress: 1 };

const AdminTasks: React.FC = () => {
  const { tasks: items, updateContent } = useAppData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (t: Task) => {
    setEditId(t.id);
    setForm({ title: t.title, description: t.description, type: t.type, xpReward: t.xpReward, maxProgress: t.maxProgress, deadline: t.deadline });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (editId) {
      const nextItems = items.map(t => t.id === editId ? { ...t, ...form, dueDate: form.deadline } : t);
      await updateContent('tasks', nextItems);
      toast({ title: 'Задание обновлено' });
    } else {
      const newItem: Task = {
        id: Date.now().toString(),
        ...form,
        progress: 0,
        completed: false,
        status: 'pending',
        dueDate: form.deadline,
      };
      const nextItems = [...items, newItem];
      await updateContent('tasks', nextItems);
      toast({ title: 'Задание создано' });
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const nextItems = items.filter(t => t.id !== id);
    await updateContent('tasks', nextItems);
    setDeleteConfirm(null);
    toast({ title: 'Задание удалено' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Управление заданиями</h3>
          <span className="text-sm text-muted-foreground">({items.length})</span>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Добавить
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Задание</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Тип</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">XP</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Прогресс</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Дедлайн</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-1 text-xs font-medium rounded-full", typeStyles[t.type])}>
                    {typeLabels[t.type]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-accent font-medium text-sm">
                    <Zap className="w-3.5 h-3.5" /> +{t.xpReward}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{t.progress} / {t.maxProgress}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {t.deadline ? new Date(t.deadline).toLocaleDateString('ru-RU') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="w-4 h-4" /></Button>
                    {deleteConfirm === t.id ? (
                      <div className="flex items-center gap-1">
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(t.id)}>Да</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Нет</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
            <DialogTitle>{editId ? 'Редактировать задание' : 'Новое задание'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Название задания" />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Условия выполнения" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Тип</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>XP награда</Label>
                <Input type="number" value={form.xpReward} onChange={e => setForm(f => ({ ...f, xpReward: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Макс. прогресс</Label>
                <Input type="number" value={form.maxProgress} onChange={e => setForm(f => ({ ...f, maxProgress: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <Label>Дедлайн (необязательно)</Label>
              <Input type="date" value={form.deadline || ''} onChange={e => setForm(f => ({ ...f, deadline: e.target.value || undefined }))} />
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

export default AdminTasks;
