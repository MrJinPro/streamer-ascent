import React, { useEffect, useState } from 'react';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface RoleInfo {
  name: string;
  slug: string;
  visibility: 'public' | 'internal';
  description_ru: string | null;
}

/**
 * Shows a user's public roles as badges with tooltips.
 * If showInternal is true, also shows internal role badges (for chat/staff context).
 */
const UserRoleBadges: React.FC<{
  userId: string;
  showInternal?: boolean;
  className?: string;
}> = ({ userId, showInternal = false, className }) => {
  const [roles, setRoles] = useState<RoleInfo[]>([]);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      const { data } = await (supabasePublic as any)
        .from('user_roles')
        .select('role_id, roles:role_id(name, slug, visibility, description_ru)')
        .eq('user_id', userId);

      if (data) {
        const mapped = (data as any[])
          .map((d: any) => d.roles)
          .filter(Boolean)
          .filter((r: RoleInfo) => showInternal || r.visibility === 'public');
        setRoles(mapped);
      }
    };
    void fetch();
  }, [userId, showInternal]);

  if (roles.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {roles.map((role) => (
        <Tooltip key={role.slug}>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 cursor-default",
                role.visibility === 'internal'
                  ? "border-accent/50 text-accent bg-accent/10"
                  : "border-primary/50 text-primary bg-primary/10"
              )}
            >
              {role.name}
            </Badge>
          </TooltipTrigger>
          {role.description_ru && (
            <TooltipContent side="top" className="max-w-[200px] text-xs">
              {role.description_ru}
            </TooltipContent>
          )}
        </Tooltip>
      ))}
    </div>
  );
};

export default UserRoleBadges;
