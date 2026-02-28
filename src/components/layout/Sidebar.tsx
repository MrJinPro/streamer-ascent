import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Trophy, 
  ListTodo, 
  GraduationCap, 
  BookOpen, 
  MessageSquare, 
  Bell,
  Sparkles, 
  Settings,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessAdminSettings, getRoleLabel } from '@/lib/roles';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import type { Task } from '@/types/app-data';
import { getSeasonKey, getTaskPeriod, getTaskPeriodKey } from '@/lib/progressionEconomy';
import logo from '@/assets/novaboost-logo.png';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
  isNew?: boolean;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: TrendingUp, label: 'Прогресс', href: '/progress' },
  { icon: Trophy, label: 'Достижения', href: '/achievements' },
  { icon: ListTodo, label: 'Задачи', href: '/tasks' },
  { icon: GraduationCap, label: 'Обучение', href: '/learning' },
  { icon: BookOpen, label: 'Статьи', href: '/articles' },
  { icon: MessageSquare, label: 'Чат', href: '/chat' },
  { icon: Bell, label: 'Уведомления', href: '/notifications' },
  { icon: Sparkles, label: 'AI Наставник', href: '/ai-coach', isNew: true },
  { icon: Trophy, label: 'Рейтинг', href: '/ranking' },
];

const adminNavItems: NavItem[] = [
  { icon: Settings, label: 'Админ панель', href: '/admin' },
];

type UserTaskProgressLite = {
  task_id: string;
  period: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  period_key: string;
  season_key: string;
  progress: number;
  max_progress: number;
  completed: boolean;
};

interface SidebarContentProps {
  onNavigate?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ onNavigate }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { signOut, role, user } = useAuth();
  const { currentUser, tasks } = useAppData();
  const [pendingTasksCount, setPendingTasksCount] = React.useState(() =>
    tasks.filter((task) => task.status !== 'completed' && !task.completed).length,
  );
  const [chatUnreadTotal, setChatUnreadTotal] = React.useState(0);
  const [notificationsUnreadTotal, setNotificationsUnreadTotal] = React.useState(0);
  const [aiCoachUnreadTotal, setAiCoachUnreadTotal] = React.useState(0);
  const xpPercent = (currentUser.xp / currentUser.xpToNextLevel) * 100;
  const effectiveRole = role ?? currentUser.role;
  const authDisplayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split('@')[0];
  const displayName = authDisplayName ?? currentUser.name;
  const authAvatar =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined);
  const displayAvatar = authAvatar ?? currentUser.avatar;

  const getPendingTasksCountFromItems = React.useCallback((items: Task[]) => {
    return items.filter((task) => task.status !== 'completed' && !task.completed).length;
  }, []);

  const loadPendingTasksCount = React.useCallback(async () => {
    if (!user?.id) {
      setPendingTasksCount(getPendingTasksCountFromItems(tasks));
      return;
    }

    const now = new Date();
    const currentSeasonKey = getSeasonKey(now);

    const [{ data: tasksRow, error: tasksError }, { data: taskProgressRows, error: progressError }] = await Promise.all([
      supabasePublic.from('app_content').select('payload').eq('key', 'tasks').maybeSingle(),
      (supabasePublic as any)
        .from('user_task_progress')
        .select('task_id,period,period_key,season_key,progress,max_progress,completed')
        .eq('user_id', user.id)
        .eq('season_key', currentSeasonKey),
    ]);

    if (tasksError || progressError) {
      setPendingTasksCount(getPendingTasksCountFromItems(tasks));
      return;
    }

    const sourceTasks = (tasksRow?.payload as Task[] | null) ?? tasks;
    const progressByCompositeKey = ((taskProgressRows ?? []) as UserTaskProgressLite[]).reduce<Record<string, UserTaskProgressLite>>(
      (acc, row) => {
        const key = `${row.task_id}:${row.period}:${row.period_key}:${row.season_key}`;
        acc[key] = row;
        return acc;
      },
      {},
    );

    let pendingCount = 0;
    for (const task of sourceTasks) {
      const period = getTaskPeriod(task);
      const periodKey = getTaskPeriodKey(period, now);
      const compositeKey = `${task.id}:${period}:${periodKey}:${currentSeasonKey}`;
      const row = progressByCompositeKey[compositeKey];

      const isCompleted = row ? Boolean(row.completed) : Boolean(task.completed || task.status === 'completed');
      if (!isCompleted) {
        pendingCount += 1;
      }
    }

    setPendingTasksCount(pendingCount);
  }, [getPendingTasksCountFromItems, tasks, user?.id]);

  const loadChatUnreadTotal = React.useCallback(async () => {
    if (!user?.id) {
      setChatUnreadTotal(0);
      return;
    }

    const { data, error } = await (supabasePublic as any).rpc('chat_get_unread_counts');
    if (error) {
      return;
    }

    const total = (data ?? []).reduce((sum: number, row: { unread_count?: number }) => {
      return sum + Number(row.unread_count ?? 0);
    }, 0);

    setChatUnreadTotal(total);
  }, [user?.id]);

  const loadAiCoachUnreadTotal = React.useCallback(async () => {
    if (!user?.id) {
      setAiCoachUnreadTotal(0);
      return;
    }

    const { data, error } = await (supabasePublic as any).rpc('ai_list_auto_advices', {
      p_user_id: user.id,
      p_only_unread: true,
      p_limit: 100,
    });

    if (error) {
      return;
    }

    setAiCoachUnreadTotal((data ?? []).length);
  }, [user?.id]);

  const loadNotificationsUnreadTotal = React.useCallback(async () => {
    if (!user?.id) {
      setNotificationsUnreadTotal(0);
      return;
    }

    const { data, error } = await (supabasePublic as any).rpc('ai_notifications_unread_count', {
      p_user_id: user.id,
    });

    if (error) {
      return;
    }

    setNotificationsUnreadTotal(Number(data ?? 0));
  }, [user?.id]);

  React.useEffect(() => {
    setPendingTasksCount(getPendingTasksCountFromItems(tasks));
  }, [getPendingTasksCountFromItems, tasks]);

  React.useEffect(() => {
    void loadPendingTasksCount();
  }, [loadPendingTasksCount]);

  React.useEffect(() => {
    void loadChatUnreadTotal();
  }, [loadChatUnreadTotal]);

  React.useEffect(() => {
    void loadAiCoachUnreadTotal();
  }, [loadAiCoachUnreadTotal]);

  React.useEffect(() => {
    void loadNotificationsUnreadTotal();
  }, [loadNotificationsUnreadTotal]);

  React.useEffect(() => {
    if (!user?.id) {
      return;
    }

    const tasksChannel = supabasePublic
      .channel(`sidebar-task-badges-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_content', filter: 'key=eq.tasks' },
        () => {
          void loadPendingTasksCount();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_task_progress', filter: `user_id=eq.${user.id}` },
        () => {
          void loadPendingTasksCount();
        },
      )
      .subscribe();

    const chatChannel = supabasePublic
      .channel(`sidebar-chat-badges-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages_internal' }, () => {
        void loadChatUnreadTotal();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_message_receipts' }, () => {
        void loadChatUnreadTotal();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_thread_members' }, () => {
        void loadChatUnreadTotal();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_thread_members' }, () => {
        void loadChatUnreadTotal();
      })
      .subscribe();

    const aiCoachChannel = supabasePublic
      .channel(`sidebar-ai-coach-badges-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_coach_auto_advices', filter: `user_id=eq.${user.id}` },
        () => {
          void loadAiCoachUnreadTotal();
        },
      )
      .subscribe();

    const notificationsChannel = supabasePublic
      .channel(`sidebar-notifications-badges-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_coach_auto_advices', filter: `user_id=eq.${user.id}` },
        () => {
          void loadNotificationsUnreadTotal();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_coach_live_alerts', filter: `user_id=eq.${user.id}` },
        () => {
          void loadNotificationsUnreadTotal();
        },
      )
      .subscribe();

    return () => {
      void supabasePublic.removeChannel(tasksChannel);
      void supabasePublic.removeChannel(chatChannel);
      void supabasePublic.removeChannel(aiCoachChannel);
      void supabasePublic.removeChannel(notificationsChannel);
    };
  }, [loadAiCoachUnreadTotal, loadChatUnreadTotal, loadNotificationsUnreadTotal, loadPendingTasksCount, user?.id]);

  const getItemBadge = React.useCallback(
    (item: NavItem) => {
      if (item.href === '/tasks') {
        return pendingTasksCount > 0 ? pendingTasksCount : undefined;
      }

      if (item.href === '/chat') {
        return chatUnreadTotal > 0 ? chatUnreadTotal : undefined;
      }

      if (item.href === '/ai-coach') {
        return aiCoachUnreadTotal > 0 ? aiCoachUnreadTotal : undefined;
      }

      if (item.href === '/notifications') {
        return notificationsUnreadTotal > 0 ? notificationsUnreadTotal : undefined;
      }

      return item.badge;
    },
    [aiCoachUnreadTotal, chatUnreadTotal, notificationsUnreadTotal, pendingTasksCount],
  );

  return (
    <>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />
      
      {/* Logo */}
      <div className="relative flex items-center gap-3 px-5 py-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-primary rounded-xl blur-lg opacity-50" />
          <div className="relative w-11 h-11 rounded-xl bg-gradient-primary p-0.5">
            <div className="w-full h-full rounded-[10px] bg-sidebar flex items-center justify-center overflow-hidden">
              <img src={logo} alt="NovaBoost" className="w-8 h-8 object-contain" />
            </div>
          </div>
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">NovaBoost</h1>
          <p className="text-xs text-muted-foreground font-medium">Tools</p>
        </div>
      </div>

      {/* User Card */}
      <div className="relative px-3 py-3">
        <NavLink
          to="/profile"
          onClick={onNavigate}
          className={cn(
            'glass-card block p-3 space-y-3 transition-colors',
            location.pathname === '/profile' || location.pathname.startsWith('/profile/')
              ? 'ring-1 ring-primary/40 bg-primary/5'
              : 'hover:bg-secondary/40'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-full blur-md opacity-40" />
              <img 
                src={displayAvatar} 
                alt={displayName} 
                className="relative w-11 h-11 rounded-full ring-2 ring-primary/30 object-cover"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success border-2 border-sidebar" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{getRoleLabel(effectiveRole)}</p>
            </div>
          </div>
          
          {/* Level progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary">Уровень {currentUser.level}</span>
              <span className="text-muted-foreground">{currentUser.xp}/{currentUser.xpToNextLevel} XP</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out progress-glow"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-semibold">{currentUser.streakDays}</span>
              <span className="text-xs text-muted-foreground">дней</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-nova-gold" />
              <span className="text-sm font-semibold">{currentUser.achievements}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg">⏱️</span>
              <span className="text-sm font-semibold">{currentUser.totalHours}h</span>
            </div>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          const itemBadge = getItemBadge(item);
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative",
                isActive 
                  ? "bg-gradient-primary text-white shadow-lg glow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white/50" />
              )}
              
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-200",
                !isActive && "group-hover:scale-110"
              )} />
              <span className="flex-1">{item.label}</span>
              
              {itemBadge && (
                <span className={cn(
                  "flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full",
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "bg-accent text-accent-foreground"
                )}>
                  {itemBadge > 99 ? '99+' : itemBadge}
                </span>
              )}
              
              {item.isNew && !itemBadge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-gradient-cyan text-white">
                  New
                </span>
              )}
              
              {!isActive && (
                <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              )}
            </NavLink>
          );
        })}

        {canAccessAdminSettings(effectiveRole, user?.email) && (
          <>
            <div className="h-px bg-border my-3" />
            {adminNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-gradient-primary text-white shadow-lg glow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    !isActive && "group-hover:scale-110"
                  )} />
                  <span className="flex-1">{item.label}</span>
                  {!isActive && (
                    <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  )}
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="relative px-3 py-3 space-y-1 border-t border-border/50">
        <button
          onClick={toggleTheme}
          className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 transition-transform duration-200 group-hover:rotate-45" />
          ) : (
            <Moon className="w-5 h-5 transition-transform duration-200 group-hover:-rotate-12" />
          )}
          <span className="flex-1 text-left">{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
        </button>
        <button
          onClick={() => {
            void signOut();
          }}
          className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span className="flex-1 text-left">Выйти</span>
        </button>
      </div>
    </>
  );
};

const Sidebar: React.FC = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(false);

  // Mobile sidebar with Sheet
  if (isMobile) {
    return (
      <>
        {/* Mobile header */}
        <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-sidebar/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-primary p-0.5">
              <div className="w-full h-full rounded-[10px] bg-sidebar flex items-center justify-center overflow-hidden">
                <img src={logo} alt="NovaBoost" className="w-7 h-7 object-contain" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight">NovaBoost</h1>
            </div>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-sidebar/95 backdrop-blur-xl border-r border-border/50">
              <div className="h-full flex flex-col">
                <SidebarContent onNavigate={() => setIsOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {/* Spacer for fixed header */}
        <div className="h-16" />
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex flex-col bg-sidebar/80 backdrop-blur-xl border-r border-border/50">
      <SidebarContent />
    </aside>
  );
};

export default Sidebar;
