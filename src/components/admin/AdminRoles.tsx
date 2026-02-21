import React, { useEffect, useState } from 'react';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { Shield, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  slug: string;
  visibility: 'public' | 'internal';
  description_ru: string | null;
  description_en: string | null;
  is_system_role: boolean;
  tier: string;
  created_at: string;
}

const TIER_LABELS: Record<string, string> = {
  tier_0: 'Tier 0 — Public User',
  tier_1: 'Tier 1 — Staff Limited',
  tier_2: 'Tier 2 — Staff Manager',
  tier_3: 'Tier 3 — Admin',
  tier_4: 'Tier 4 — System Owner',
};

const AdminRoles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', visibility: 'public' as 'public' | 'internal',
    description_ru: '', description_en: '', tier: 'tier_0',
  });

  const fetchRoles = async () => {
    const { data } = await (supabasePublic as any).from('roles').select('*').order('tier');
    if (data) setRoles(data);
    setLoading(false);
  };

  useEffect(() => { void fetchRoles(); }, []);

  const resetForm = () => {
    setForm({ name: '', slug: '', visibility: 'public', description_ru: '', description_en: '', tier: 'tier_0' });
    setEditing(null);
    setCreating(false);
  };

  const handleSave = async () => {
    if (editing) {
      const { error } = await (supabasePublic as any).from('roles').update({
        name: form.name, description_ru: form.description_ru,
        description_en: form.description_en, visibility: form.visibility, tier: form.tier,
      }).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Роль обновлена');
    } else {
      const { error } = await (supabasePublic as any).from('roles').insert({
        name: form.name, slug: form.slug, visibility: form.visibility,
        description_ru: form.description_ru, description_en: form.description_en, tier: form.tier,
      });
      if (error) { toast.error(error.message); return; }
      toast.success('Роль создана');
    }
    resetForm();
    void fetchRoles();
  };

  const handleDelete = async (role: Role) => {
    if (role.is_system_role) { toast.error('Системную роль нельзя удалить'); return; }
    const { error } = await (supabasePublic as any).from('roles').delete().eq('id', role.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Роль удалена');
    void fetchRoles();
  };

  const startEdit = (role: Role) => {
    setEditing(role);
    setCreating(true);
    setForm({
      name: role.name, slug: role.slug, visibility: role.visibility,
      description_ru: role.description_ru ?? '', description_en: role.description_en ?? '', tier: role.tier,
    });
  };

  if (loading) return <p className="text-muted-foreground p-4">Загрузка...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Shield className="w-5 h-5" /> Роли</h3>
        {!creating && (
          <button onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Новая роль
          </button>
        )}
      </div>

      {creating && (
        <div className="p-4 rounded-xl glass border border-border space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Название" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Slug (латиница)" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} disabled={!!editing} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Textarea placeholder="Описание RU" value={form.description_ru} onChange={e => setForm(f => ({ ...f, description_ru: e.target.value }))} rows={2} />
            <Textarea placeholder="Description EN" value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} rows={2} />
          </div>
          <div className="flex gap-3">
            <select value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value as any }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm">
              <option value="public">Public</option>
              <option value="internal">Internal</option>
            </select>
            <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm">
              {Object.entries(TIER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">{editing ? 'Сохранить' : 'Создать'}</button>
            <button onClick={resetForm} className="px-4 py-2 rounded-lg bg-secondary text-sm">Отмена</button>
          </div>
        </div>
      )}

      <div className="rounded-xl glass border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Роль</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Slug</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Видимость</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Tier</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Описание</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {roles.map(role => (
              <tr key={role.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3 font-medium">{role.name}{role.is_system_role && <span className="ml-2 text-xs text-muted-foreground">🔒</span>}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{role.slug}</td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full",
                    role.visibility === 'public' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground')}>
                    {role.visibility === 'public' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}{role.visibility}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{TIER_LABELS[role.tier] ?? role.tier}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate" title={role.description_ru ?? ''}>{role.description_ru}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => startEdit(role)} className="p-2 rounded-lg hover:bg-secondary"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                    {!role.is_system_role && <button onClick={() => handleDelete(role)} className="p-2 rounded-lg hover:bg-destructive/20"><Trash2 className="w-4 h-4 text-destructive" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRoles;
