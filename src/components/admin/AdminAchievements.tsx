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
  rewardType: 'none' | 'xp' | 'gift' | 'custom';
  rewardXpAmount?: number;
  rewardGiftId?: string;
  rewardGiftName?: string;
  rewardCustomLabel?: string;
};

const emptyForm: FormData = {
  title: '',
  description: '',
  icon: '🏆',
  rarity: 'common',
  category: 'stream',
  rewardType: 'none',
};

const mapRewardToForm = (reward?: Achievement['reward']) => {
  if (!reward) {
    return {
      rewardType: 'none' as const,
      rewardXpAmount: undefined,
      rewardGiftId: undefined,
      rewardGiftName: undefined,
      rewardCustomLabel: undefined,
    };
  }

  if (typeof reward === 'string') {
    return {
      rewardType: 'custom' as const,
      rewardXpAmount: undefined,
      rewardGiftId: undefined,
      rewardGiftName: undefined,
      rewardCustomLabel: reward,
    };
  }

  if (reward.type === 'xp') {
    return {
      rewardType: 'xp' as const,
      rewardXpAmount: reward.xpAmount,
      rewardGiftId: undefined,
      rewardGiftName: undefined,
      rewardCustomLabel: undefined,
    };
  }

  if (reward.type === 'gift') {
    return {
      rewardType: 'gift' as const,
      rewardXpAmount: undefined,
      rewardGiftId: reward.giftId,
      rewardGiftName: reward.giftName,
      rewardCustomLabel: undefined,
    };
  }

  return {
    rewardType: 'custom' as const,
    rewardXpAmount: undefined,
    rewardGiftId: undefined,
    rewardGiftName: undefined,
    rewardCustomLabel: reward.label,
  };
};

const buildRewardFromForm = (form: FormData): Achievement['reward'] | undefined => {
  if (form.rewardType === 'none') {
    return undefined;
  }

  if (form.rewardType === 'xp') {
    if (!form.rewardXpAmount || form.rewardXpAmount <= 0) {
      return undefined;
    }
    return {
      type: 'xp',
      xpAmount: form.rewardXpAmount,
    };
  }

  if (form.rewardType === 'gift') {
    if (!form.rewardGiftId?.trim() || !form.rewardGiftName?.trim()) {
      return undefined;
    }
    return {
      type: 'gift',
      giftId: form.rewardGiftId.trim(),
      giftName: form.rewardGiftName.trim(),
    };
  }

  if (!form.rewardCustomLabel?.trim()) {
    return undefined;
  }

  return {
    type: 'custom',
    label: form.rewardCustomLabel.trim(),
  };
};

const formatReward = (reward?: Achievement['reward']): string => {
  if (!reward) return '—';
  if (typeof reward === 'string') return reward;
  if (reward.type === 'xp') return `XP: +${reward.xpAmount}`;
  if (reward.type === 'gift') return `Подарок: ${reward.giftName} (${reward.giftId})`;
  return reward.label;
};

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
    setForm({
      title: a.title,
      description: a.description,
      icon: a.icon,
      rarity: a.rarity,
      category: a.category,
      maxProgress: a.maxProgress,
      ...mapRewardToForm(a.reward),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    let nextItems: Achievement[];

    try {
      if (editId) {
        const reward = buildRewardFromForm(form);
        nextItems = items.map(a => a.id === editId ? {
          ...a,
          title: form.title,
          description: form.description,
          icon: form.icon,
          rarity: form.rarity,
          category: form.category,
          maxProgress: form.maxProgress,
          reward,
        } : a);
        await updateContent('achievements', nextItems);
        toast({ title: 'Достижение обновлено' });
      } else {
        const reward = buildRewardFromForm(form);
        const newItem: Achievement = {
          id: Date.now().toString(),
          title: form.title,
          description: form.description,
          icon: form.icon,
          rarity: form.rarity,
          category: form.category,
          reward,
          unlocked: false,
          progress: 0,
          maxProgress: form.maxProgress || 1,
        };
        nextItems = [...items, newItem];
        await updateContent('achievements', nextItems);
        toast({ title: 'Достижение создано' });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Не удалось сохранить достижение',
        description: error instanceof Error ? error.message : 'Ошибка записи в базу данных',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const nextItems = items.filter(a => a.id !== id);
      await updateContent('achievements', nextItems);
      setDeleteConfirm(null);
      toast({ title: 'Достижение удалено' });
    } catch (error) {
      toast({
        title: 'Не удалось удалить достижение',
        description: error instanceof Error ? error.message : 'Ошибка записи в базу данных',
        variant: 'destructive',
      });
    }
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
                <td className="px-4 py-3 text-sm text-muted-foreground">{formatReward(a.reward)}</td>
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
                <Label>Тип награды</Label>
                <Select value={form.rewardType} onValueChange={v => setForm(f => ({ ...f, rewardType: v as FormData['rewardType'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без награды</SelectItem>
                    <SelectItem value="xp">XP (опыт)</SelectItem>
                    <SelectItem value="gift">Подарок</SelectItem>
                    <SelectItem value="custom">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.rewardType === 'xp' && (
              <div>
                <Label>Количество XP</Label>
                <Input
                  type="number"
                  value={form.rewardXpAmount || ''}
                  onChange={e => setForm(f => ({ ...f, rewardXpAmount: Number(e.target.value) || undefined }))}
                  placeholder="напр. 500"
                />
              </div>
            )}
            {form.rewardType === 'gift' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID подарка</Label>
                  <Input
                    value={form.rewardGiftId || ''}
                    onChange={e => setForm(f => ({ ...f, rewardGiftId: e.target.value || undefined }))}
                    placeholder="напр. gift_101"
                  />
                </div>
                <div>
                  <Label>Название подарка</Label>
                  <Input
                    value={form.rewardGiftName || ''}
                    onChange={e => setForm(f => ({ ...f, rewardGiftName: e.target.value || undefined }))}
                    placeholder="напр. Львенок"
                  />
                </div>
              </div>
            )}
            {form.rewardType === 'custom' && (
              <div>
                <Label>Описание награды</Label>
                <Input
                  value={form.rewardCustomLabel || ''}
                  onChange={e => setForm(f => ({ ...f, rewardCustomLabel: e.target.value || undefined }))}
                  placeholder="напр. Специальный бейдж"
                />
              </div>
            )}
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
