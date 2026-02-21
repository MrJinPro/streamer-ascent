import React, { useEffect, useState } from 'react';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncLog {
  id: string;
  user_id: string;
  status: string;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

const statusStyles: Record<string, string> = {
  success: 'bg-success/20 text-success',
  failed: 'bg-destructive/20 text-destructive',
  running: 'bg-primary/20 text-primary',
  pending: 'bg-muted text-muted-foreground',
};

const AdminTikTokSyncLogs: React.FC = () => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabasePublic as any).from('tiktok_sync_logs').select('*').order('started_at', { ascending: false }).limit(100);
      if (data) setLogs(data);
      setLoading(false);
    };
    void load();
  }, []);

  if (loading) return <p className="text-muted-foreground p-4">Загрузка...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><RefreshCw className="w-5 h-5" /><h3 className="text-lg font-semibold">TikTok Sync Logs</h3></div>
      {logs.length === 0 ? (
        <div className="rounded-xl glass border border-border p-8 text-center"><p className="text-muted-foreground">Логов синхронизации пока нет</p></div>
      ) : (
        <div className="rounded-xl glass border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">User ID</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Статус</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Начало</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Конец</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Ошибка</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono text-xs truncate max-w-[150px]">{log.user_id}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", statusStyles[log.status] ?? '')}>{log.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(log.started_at).toLocaleString('ru-RU')}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{log.finished_at ? new Date(log.finished_at).toLocaleString('ru-RU') : '—'}</td>
                  <td className="px-4 py-3 text-xs text-destructive truncate max-w-[200px]">{log.error ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTikTokSyncLogs;
