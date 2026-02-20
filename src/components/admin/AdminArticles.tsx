import React, { useState } from 'react';
import { articles as initialArticles, Article } from '@/data/mockData';
import { Plus, Pencil, Trash2, BookOpen, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

type FormData = {
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  featured: boolean;
};

const emptyForm: FormData = { title: '', excerpt: '', category: 'Советы', readTime: '5 мин', featured: false };

const AdminArticles: React.FC = () => {
  const [items, setItems] = useState<Article[]>(initialArticles);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (a: Article) => {
    setEditId(a.id);
    setForm({ title: a.title, excerpt: a.excerpt, category: a.category, readTime: a.readTime, featured: a.featured });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (editId) {
      setItems(prev => prev.map(a => a.id === editId ? { ...a, ...form } : a));
      toast({ title: 'Статья обновлена' });
    } else {
      const newItem: Article = {
        id: Date.now().toString(),
        ...form,
        date: new Date().toISOString().split('T')[0],
      };
      setItems(prev => [...prev, newItem]);
      toast({ title: 'Статья создана' });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(a => a.id !== id));
    setDeleteConfirm(null);
    toast({ title: 'Статья удалена' });
  };

  const toggleFeatured = (id: string) => {
    setItems(prev => prev.map(a => a.id === id ? { ...a, featured: !a.featured } : a));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Управление статьями</h3>
          <span className="text-sm text-muted-foreground">({items.length})</span>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Добавить
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 rounded-xl border border-border bg-secondary/30">
          <p className="text-sm text-muted-foreground">Всего статей</p>
          <p className="text-xl font-bold">{items.length}</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-secondary/30">
          <p className="text-sm text-muted-foreground">Избранные</p>
          <p className="text-xl font-bold text-accent">{items.filter(a => a.featured).length}</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-secondary/30">
          <p className="text-sm text-muted-foreground">Категории</p>
          <p className="text-xl font-bold">{new Set(items.map(a => a.category)).size}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Статья</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Категория</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Время чтения</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Дата</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Избранное</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{a.excerpt}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-secondary text-foreground">{a.category}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" /> {a.readTime}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(a.date).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleFeatured(a.id)}>
                    <Star className={cn("w-5 h-5 transition-colors", a.featured ? "text-accent fill-accent" : "text-muted-foreground")} />
                  </button>
                </td>
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
            <DialogTitle>{editId ? 'Редактировать статью' : 'Новая статья'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Заголовок</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Заголовок статьи" />
            </div>
            <div>
              <Label>Описание / Отрывок</Label>
              <Textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Краткое описание" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Категория</Label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="напр. Советы" />
              </div>
              <div>
                <Label>Время чтения</Label>
                <Input value={form.readTime} onChange={e => setForm(f => ({ ...f, readTime: e.target.value }))} placeholder="напр. 5 мин" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.featured} onCheckedChange={v => setForm(f => ({ ...f, featured: v }))} />
              <Label>Избранная статья</Label>
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

export default AdminArticles;
