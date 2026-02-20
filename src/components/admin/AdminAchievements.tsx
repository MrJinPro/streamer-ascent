import React, { useState } from 'react';
import type { Achievement } from '@/types/app-data';
import { Plus, Pencil, Trash2, Trophy, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAppData } from '@/contexts/AppDataContext';

const rarityLabels = { common: 'Обычное', rare: 'Редкое', epic: 'Эпическое', legendary: 'Легендарное' };
const categoryLabels = { diamonds: 'Алмазы', stream: 'Стримы', community: 'Комьюнити', special: 'Особые' };
const rarityStyles = {
  common: 'bg-muted-foreground/20 text-muted-foreground',
  rare: 'bg-primary/20 text-primary',
  epic: 'bg-nova-purple/20 text-nova-purple',
  legendary: 'bg-accent/20 text-accent',
};

type FormData = {
  title: string;
  description: string;
  icon: string;
  rarity: Achievement['rarity'];
  category: Achievement['category'];
  maxProgress?: number;
  reward?: string;
};

const emptyForm: FormData = { title: '', description: '', icon: '🏆', rarity: 'common', category: 'stream' };

const AdminAchievements: React.FC = () => {
  const { achievements: items, updateContent } = useAppData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (a: Achievement) => {
    setEditId(a.id);
    setForm({ title: a.title, description: a.description, icon: a.icon, rarity: a.rarity, category: a.category, maxProgress: a.maxProgress, reward: a.reward });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    let nextItems: Achievement[];

    if (editId) {
      nextItems = items.map(a => a.id === editId ? { ...a, ...form } : a);
      await updateContent('achievements', nextItems);
      toast({ title: 'Достижение обновлено' });
    } else {
      const newItem: Achievement = {
        id: Date.now().toString(),
        ...form,
        unlocked: false,
        progress: 0,
        maxProgress: form.maxProgress || 1,
      };
      nextItems = [...items, newItem];
      await updateContent('achievements', nextItems);
      toast({ title: 'Достижение создано' });
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const nextItems = items.filter(a => a.id !== id);
    await updateContent('achievements', nextItems);
    setDeleteConfirm(null);
    toast({ title: 'Достижение удалено' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-lg">Управление достижениями</h3>
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
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Достижение</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Редкость</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Категория</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Прогресс</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Награда</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{a.icon}</span>
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-1 text-xs font-medium rounded-full", rarityStyles[a.rarity])}>
                    {rarityLabels[a.rarity]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{categoryLabels[a.category]}</td>
                <td className="px-4 py-3 text-sm">{a.maxProgress ? `0 / ${a.maxProgress}` : '—'}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{a.reward || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                    {deleteConfirm === a.id ? (
                      <div className="flex items-center gap-1">
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(a.id)}>Да</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>Нет</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
            <DialogTitle>{editId ? 'Редактировать достижение' : 'Новое достижение'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-[80px_1fr] gap-4">
              <div>
                <Label>Иконка</Label>
                <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="text-center text-2xl" />
              </div>
              <div>
                <Label>Название</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Название достижения" />
              </div>
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Условие получения" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Редкость</Label>
                <Select value={form.rarity} onValueChange={v => setForm(f => ({ ...f, rarity: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(rarityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Категория</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Макс. прогресс</Label>
                <Input type="number" value={form.maxProgress || ''} onChange={e => setForm(f => ({ ...f, maxProgress: Number(e.target.value) || undefined }))} placeholder="напр. 100" />
              </div>
              <div>
                <Label>Награда</Label>
                <Input value={form.reward || ''} onChange={e => setForm(f => ({ ...f, reward: e.target.value || undefined }))} placeholder="Название награды" />
              </div>
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

export default AdminAchievements;
