import React, { useEffect, useState } from 'react';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { UserPlus, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  slug: string;
  visibility: 'public' | 'internal';
  tier: string;
}

interface UserRoleRow {
  role_id: string;
  user_id: string;
}

interface UserRoleAssignProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

const UserRoleAssign: React.FC<UserRoleAssignProps> = ({ userId, userName, onClose }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: allRoles }, { data: assigned }] = await Promise.all([
        supabasePublic.from('roles' as any).select('*').order('tier'),
        supabasePublic.from('user_roles' as any).select('role_id').eq('user_id', userId),
      ]);
      if (allRoles) setRoles(allRoles as any);
      if (assigned) setUserRoles((assigned as any[]).map((r: any) => r.role_id));
      setLoading(false);
    };
    void fetch();
  }, [userId]);

  const toggleRole = async (roleId: string) => {
    const has = userRoles.includes(roleId);
    if (has) {
      const { error } = await (supabasePublic as any)
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId);
      if (error) { toast.error(error.message); return; }
      setUserRoles(prev => prev.filter(r => r !== roleId));
      // Audit log
      await (supabasePublic as any).from('audit_log').insert({
        actor_user_id: userId,
        action: 'role.removed',
        entity: 'user_roles',
        entity_id: userId,
        after_data: { role_id: roleId },
      });
      toast.success('Роль убрана');
    } else {
      const { error } = await (supabasePublic as any)
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleId, role: 'streamer' });
      if (error) { toast.error(error.message); return; }
      setUserRoles(prev => [...prev, roleId]);
      // Audit log
      await (supabasePublic as any).from('audit_log').insert({
        actor_user_id: userId,
        action: 'role.assigned',
        entity: 'user_roles',
        entity_id: userId,
        after_data: { role_id: roleId },
      });
      toast.success('Роль назначена');
    }
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl glass border border-border p-6 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Роли: {userName}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {roles.map(role => {
            const isAssigned = userRoles.includes(role.id);
            return (
              <button
                key={role.id}
                onClick={() => toggleRole(role.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                  isAssigned
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{role.name}</span>
                    <span className={cn(
                      "px-1.5 py-0.5 text-[10px] rounded-full",
                      role.visibility === 'public' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                    )}>
                      {role.visibility}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{role.tier}</span>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                  isAssigned ? "bg-primary border-primary text-primary-foreground" : "border-border"
                )}>
                  {isAssigned && <span className="text-xs">✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        <button onClick={onClose} className="w-full px-4 py-2 rounded-lg bg-secondary text-sm font-medium">
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default UserRoleAssign;
