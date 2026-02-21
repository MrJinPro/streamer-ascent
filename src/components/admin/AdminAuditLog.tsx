import React, { useEffect, useState } from 'react';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { ScrollText } from 'lucide-react';

interface AuditEntry {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  ip_address: string | null;
  created_at: string;
}

const AdminAuditLog: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabasePublic as any).from('audit_log').select('*').order('created_at', { ascending: false }).limit(100);
      if (data) setEntries(data);
      setLoading(false);
    };
    void load();
  }, []);

  if (loading) return <p className="text-muted-foreground p-4">Загрузка...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><ScrollText className="w-5 h-5" /><h3 className="text-lg font-semibold">Аудит-лог</h3></div>
      {entries.length === 0 ? (
        <div className="rounded-xl glass border border-border p-8 text-center"><p className="text-muted-foreground">Записей пока нет</p></div>
      ) : (
        <div className="rounded-xl glass border border-border overflow-hidden">
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {entries.map(e => (
              <div key={e.id} className="p-3 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{e.action}</span>
                  <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString('ru-RU')}</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {e.entity && <span>Entity: {e.entity}/{e.entity_id}</span>}
                  {e.actor_user_id && <span className="font-mono truncate max-w-[200px]">Actor: {e.actor_user_id}</span>}
                  {e.ip_address && <span>IP: {e.ip_address}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLog;
