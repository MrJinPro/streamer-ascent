import React, { useEffect, useState } from 'react';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { Key, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Permission { id: string; key: string; description_ru: string | null; description_en: string | null; }
interface Role { id: string; name: string; slug: string; visibility: string; tier: string; }
interface RolePermission { role_id: string; permission_id: string; }

const AdminPermissions: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePerms, setRolePerms] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: perms }, { data: rls }, { data: rp }] = await Promise.all([
        (supabasePublic as any).from('permissions').select('*').order('key'),
        (supabasePublic as any).from('roles').select('*').order('tier'),
        (supabasePublic as any).from('role_permissions').select('*'),
      ]);
      if (perms) setPermissions(perms);
      if (rls) setRoles(rls);
      if (rp) setRolePerms(rp);
      setLoading(false);
    };
    void fetchAll();
  }, []);

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const group = p.key.split('.')[0];
    (acc[group] = acc[group] || []).push(p);
    return acc;
  }, {});

  const hasRP = (rId: string, pId: string) => rolePerms.some(rp => rp.role_id === rId && rp.permission_id === pId);

  const toggle = async (rId: string, pId: string) => {
    if (hasRP(rId, pId)) {
      const { error } = await (supabasePublic as any).from('role_permissions').delete().eq('role_id', rId).eq('permission_id', pId);
      if (error) { toast.error(error.message); return; }
      setRolePerms(prev => prev.filter(rp => !(rp.role_id === rId && rp.permission_id === pId)));
    } else {
      const { error } = await (supabasePublic as any).from('role_permissions').insert({ role_id: rId, permission_id: pId });
      if (error) { toast.error(error.message); return; }
      setRolePerms(prev => [...prev, { role_id: rId, permission_id: pId }]);
    }
  };

  if (loading) return <p className="text-muted-foreground p-4">Загрузка...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><Key className="w-5 h-5" /><h3 className="text-lg font-semibold">Матрица разрешений</h3></div>
      <div className="rounded-xl glass border border-border overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-secondary/50 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground min-w-[200px]">Permission</th>
              {roles.map(r => (
                <th key={r.id} className="px-2 py-2 text-center font-medium text-muted-foreground min-w-[80px] max-w-[100px]">
                  <div className="truncate" title={r.name}>{r.name}</div>
                  <div className="text-[10px] opacity-60">{r.tier}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([group, perms]) => (
              <React.Fragment key={group}>
                <tr className="bg-secondary/30 cursor-pointer" onClick={() => setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))}>
                  <td colSpan={roles.length + 1} className="px-3 py-2 font-semibold text-sm">
                    <span className="flex items-center gap-1">
                      {expandedGroups[group] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      {group} <span className="text-muted-foreground font-normal ml-1">({perms.length})</span>
                    </span>
                  </td>
                </tr>
                {expandedGroups[group] && perms.map(perm => (
                  <tr key={perm.id} className="border-t border-border/50 hover:bg-secondary/20">
                    <td className="px-3 py-1.5">
                      <div className="font-mono text-xs">{perm.key}</div>
                      <div className="text-[10px] text-muted-foreground">{perm.description_ru}</div>
                    </td>
                    {roles.map(role => (
                      <td key={role.id} className="text-center px-2 py-1.5">
                        <button onClick={() => toggle(role.id, perm.id)} className={cn(
                          "w-6 h-6 rounded border inline-flex items-center justify-center transition-colors",
                          hasRP(role.id, perm.id) ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary/50"
                        )}>
                          {hasRP(role.id, perm.id) && <Check className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPermissions;
