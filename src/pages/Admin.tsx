import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import type { User, StreamEvent } from '@/types/app-data';
import { Users, Activity, Settings, Shield, Search, Trophy, ListTodo, GraduationCap, BookOpen, Key, ScrollText, RefreshCw, UserPlus, Eye, Lock, Trash2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminAchievements from '@/components/admin/AdminAchievements';
import AdminTasks from '@/components/admin/AdminTasks';
import AdminArticles from '@/components/admin/AdminArticles';
import AdminReferralSettings from '@/components/admin/AdminReferralSettings';
import AdminAcademy from '@/components/admin/AdminAcademy';
import AdminRoles from '@/components/admin/AdminRoles';
import AdminPermissions from '@/components/admin/AdminPermissions';
import AdminAuditLog from '@/components/admin/AdminAuditLog';
import AdminTikTokSyncLogs from '@/components/admin/AdminTikTokSyncLogs';
import UserRoleAssign from '@/components/admin/UserRoleAssign';
import UserRoleBadges from '@/components/UserRoleBadges';
import { canAccessAdminSettings, getRoleLabel } from '@/lib/roles';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabasePublic } from '@/integrations/supabase/publicClient';

type TabId = 'users' | 'events' | 'achievements' | 'tasks' | 'academy' | 'articles' | 'roles' | 'permissions' | 'audit' | 'tiktok_sync' | 'settings';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('users');
  const { currentUser, allUsers, streamEvents } = useAppData();
  const { role, user } = useAuth();
  const effectiveRole = role ?? currentUser?.role;

  if (!canAccessAdminSettings(effectiveRole, user?.email)) {
    return (
      <div className="rounded-xl glass border border-border p-6">
        <h3 className="font-semibold mb-2">Доступ ограничен</h3>
        <p className="text-muted-foreground text-sm">Этот раздел доступен только владельцу, администратору или службе поддержки.</p>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'events', label: 'События', icon: Activity },
    { id: 'achievements', label: 'Достижения', icon: Trophy },
    { id: 'tasks', label: 'Задания', icon: ListTodo },
    { id: 'academy', label: 'Обучение (Academy)', icon: GraduationCap },
    { id: 'articles', label: 'Статьи', icon: BookOpen },
    { id: 'roles', label: 'Роли', icon: Shield },
    { id: 'permissions', label: 'Разрешения', icon: Key },
    { id: 'audit', label: 'Аудит', icon: ScrollText },
    { id: 'tiktok_sync', label: 'TikTok Sync', icon: RefreshCw },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-nova-purple/20">
            <Shield className="w-6 h-6 text-nova-purple" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Панель управления</h1>
            <p className="text-muted-foreground">Администрирование системы</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl glass border border-border">
          <p className="text-sm text-muted-foreground">Всего стримеров</p>
          <p className="text-2xl font-bold">{allUsers.filter(u => u.role === 'streamer').length}</p>
        </div>
        <div className="p-4 rounded-xl glass border border-border">
          <p className="text-sm text-muted-foreground">Всего пользователей</p>
          <p className="text-2xl font-bold">{allUsers.length}</p>
        </div>
        <div className="p-4 rounded-xl glass border border-border">
          <p className="text-sm text-muted-foreground">Активных сегодня</p>
          <p className="text-2xl font-bold text-success">{allUsers.filter(u => u.isOnline).length}</p>
        </div>
        <div className="p-4 rounded-xl glass border border-border">
          <p className="text-sm text-muted-foreground">События за сутки</p>
          <p className="text-2xl font-bold text-primary">{streamEvents.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-secondary overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'users' && <UsersTab users={allUsers} />}
      {activeTab === 'events' && <EventsTab events={streamEvents} />}
      {activeTab === 'achievements' && <AdminAchievements />}
      {activeTab === 'tasks' && <AdminTasks />}
      {activeTab === 'academy' && <AdminAcademy />}
      {activeTab === 'articles' && <AdminArticles />}
      {activeTab === 'roles' && <AdminRoles />}
      {activeTab === 'permissions' && <AdminPermissions />}
      {activeTab === 'audit' && <AdminAuditLog />}
      {activeTab === 'tiktok_sync' && <AdminTikTokSyncLogs />}
      {activeTab === 'settings' && <AdminReferralSettings />}
    </div>
  );
};

// ─── Users Tab ───────────────────────────────────────────────
const roleStyles: Record<string, string> = {
  owner: 'bg-nova-purple/20 text-nova-purple',
  admin: 'bg-nova-purple/20 text-nova-purple',
  architect: 'bg-nova-purple/20 text-nova-purple',
  system_owner: 'bg-nova-purple/20 text-nova-purple',
  developer: 'bg-accent/20 text-accent',
  engineer: 'bg-accent/20 text-accent',
  senior_curator: 'bg-primary/20 text-primary',
  head_mentor: 'bg-primary/20 text-primary',
  streamer: 'bg-primary/20 text-primary',
  curator: 'bg-accent/20 text-accent',
  mentor: 'bg-accent/20 text-accent',
  manager: 'bg-secondary text-secondary-foreground',
  agency_manager: 'bg-secondary text-secondary-foreground',
  moderator: 'bg-secondary text-secondary-foreground',
  support: 'bg-secondary text-secondary-foreground',
  analyst: 'bg-secondary text-secondary-foreground',
  investor: 'bg-secondary text-secondary-foreground',
};

const DEFAULT_ADMIN_REFERRAL_CODE = 'NOVA-2026';

const inviteRoleOptions: Array<{ slug: string; label: string }> = [
  { slug: 'streamer', label: 'Стример' },
  { slug: 'mentor', label: 'Ментор' },
  { slug: 'support', label: 'Поддержка' },
  { slug: 'moderator', label: 'Модератор' },
  { slug: 'agency_manager', label: 'Менеджер агентства' },
  { slug: 'analyst', label: 'Аналитик' },
];

type AdminDirectoryUser = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  is_online: boolean;
  source?: string[];
};

type AdminUserDetails = {
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    lastSignInAt: string | null;
    emailConfirmedAt: string | null;
    phoneConfirmedAt: string | null;
    bannedUntil: string | null;
  };
  profile: {
    display_name: string | null;
    username: string | null;
    country: string | null;
    language: string | null;
    telegram_username: string | null;
    onboarding_completed: boolean | null;
    onboarding_source: string | null;
  } | null;
  roles: Array<{ role: string | null; roles?: { slug?: string; name?: string } }>;
};

const toUserFromDirectory = (row: AdminDirectoryUser): User => ({
  id: row.id,
  name: row.name,
  avatar: row.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.id}`,
  role: 'streamer',
  level: 1,
  xp: 0,
  xpToNextLevel: 1000,
  streakDays: 0,
  joinedDate: row.created_at,
  totalHours: 0,
  completedTasks: 0,
  achievements: 0,
  isOnline: row.is_online,
  stats: {
    diamondsTotal: 0,
    diamonds30Days: 0,
    diamondsToday: 0,
    currentLevel: 1,
    maxLevel: 50,
    checkpoint1: false,
    checkpoint2: false,
    checkpoint3: false,
    checkpoint1Claimed: null,
    checkpoint2Claimed: null,
    checkpoint3Claimed: null,
    monthlyDiamonds: 0,
    rank: 0,
  },
});

const UsersTab: React.FC<{ users: User[] }> = ({ users }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryRows, setDirectoryRows] = useState<AdminDirectoryUser[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);
  const [roleAssignUser, setRoleAssignUser] = useState<{ id: string; name: string } | null>(null);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [details, setDetails] = useState<AdminUserDetails | null>(null);
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    username: '',
    country: '',
    language: '',
    telegramUsername: '',
    email: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleSlugs, setInviteRoleSlugs] = useState<string[]>(['streamer']);

  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [createRoleSlugs, setCreateRoleSlugs] = useState<string[]>(['streamer']);

  const loadDirectoryUsers = useCallback(async () => {
    const { data, error } = await supabasePublic.functions.invoke('admin-list-users', {
      body: {},
    });

    if (error || !data?.ok || !Array.isArray(data?.users)) {
      return;
    }

    const rows = data.users as AdminDirectoryUser[];
    setDirectoryRows(rows);
    setDirectoryUsers(rows.map(toUserFromDirectory));
  }, []);

  useEffect(() => {
    void loadDirectoryUsers();
  }, [loadDirectoryUsers]);

  const directoryById = useMemo(
    () => new Map(directoryRows.map((row) => [row.id, row])),
    [directoryRows],
  );

  const mergedUsers = useMemo(() => {
    const map = new Map<string, User>();

    users.forEach((item) => map.set(item.id, item));

    directoryUsers.forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });

    return Array.from(map.values());
  }, [directoryUsers, users]);

  const filtered = searchQuery
    ? mergedUsers.filter((u) => {
        const needle = searchQuery.toLowerCase();
        const email = directoryById.get(u.id)?.email?.toLowerCase() ?? '';
        return u.name.toLowerCase().includes(needle) || u.id.toLowerCase().includes(needle) || email.includes(needle);
      })
    : mergedUsers;

  const openDetails = async (selectedUser: User) => {
    setDetailsUser(selectedUser);
    setDetailsOpen(true);
    setDetailsLoading(true);

    const { data, error } = await supabasePublic.functions.invoke('admin-manage-user', {
      body: {
        action: 'get_details',
        userId: selectedUser.id,
      },
    });

    setDetailsLoading(false);

    if (error || !data?.ok) {
      const errorText = String(error?.message ?? data?.error ?? '').toLowerCase();
      const isMissingFunction = errorText.includes('404') || errorText.includes('not found') || errorText.includes('failed to fetch');
      toast({
        title: 'Не удалось загрузить данные пользователя',
        description: isMissingFunction
          ? 'Edge function admin-manage-user не задеплоена. Выполните деплой Supabase Functions.'
          : error?.message ?? data?.error ?? 'Неизвестная ошибка',
        variant: 'destructive',
      });
      return;
    }

    const payload = data as AdminUserDetails & { ok: boolean };
    setDetails(payload);
    setProfileForm({
      displayName: payload.profile?.display_name ?? '',
      username: payload.profile?.username ?? '',
      country: payload.profile?.country ?? '',
      language: payload.profile?.language ?? '',
      telegramUsername: payload.profile?.telegram_username ?? '',
      email: payload.user?.email ?? '',
    });
  };

  const saveProfile = async () => {
    if (!detailsUser) return;

    setDetailsSaving(true);
    const { data, error } = await supabasePublic.functions.invoke('admin-manage-user', {
      body: {
        action: 'update_profile',
        userId: detailsUser.id,
        displayName: profileForm.displayName,
        username: profileForm.username,
        country: profileForm.country,
        language: profileForm.language,
        telegramUsername: profileForm.telegramUsername,
        email: profileForm.email,
      },
    });
    setDetailsSaving(false);

    if (error || !data?.ok) {
      const errorText = String(error?.message ?? data?.error ?? '').toLowerCase();
      const isMissingFunction = errorText.includes('404') || errorText.includes('not found') || errorText.includes('failed to fetch');
      toast({
        title: 'Не удалось сохранить профиль',
        description: isMissingFunction
          ? 'Edge function admin-manage-user не задеплоена. Выполните деплой Supabase Functions.'
          : error?.message ?? data?.error ?? 'Неизвестная ошибка',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Профиль обновлён' });
    await Promise.all([loadDirectoryUsers(), openDetails(detailsUser)]);
  };

  const resetPassword = async () => {
    if (!detailsUser) return;
    if (newPassword.length < 8) {
      toast({ title: 'Пароль слишком короткий', description: 'Минимум 8 символов', variant: 'destructive' });
      return;
    }

    setPasswordUpdating(true);
    const { data, error } = await supabasePublic.functions.invoke('admin-manage-user', {
      body: {
        action: 'reset_password',
        userId: detailsUser.id,
        newPassword,
      },
    });
    setPasswordUpdating(false);

    if (error || !data?.ok) {
      const errorText = String(error?.message ?? data?.error ?? '').toLowerCase();
      const isMissingFunction = errorText.includes('404') || errorText.includes('not found') || errorText.includes('failed to fetch');
      toast({
        title: 'Не удалось сменить пароль',
        description: isMissingFunction
          ? 'Edge function admin-manage-user не задеплоена. Выполните деплой Supabase Functions.'
          : error?.message ?? data?.error ?? 'Неизвестная ошибка',
        variant: 'destructive',
      });
      return;
    }

    setNewPassword('');
    toast({ title: 'Пароль обновлён' });
  };

  const deleteUser = async () => {
    if (!detailsUser) return;

    if (deleteConfirmText !== detailsUser.id) {
      toast({
        title: 'Подтверждение не совпадает',
        description: 'Введите точный User ID для удаления',
        variant: 'destructive',
      });
      return;
    }

    setDeletingUser(true);
    const { data, error } = await supabasePublic.functions.invoke('admin-manage-user', {
      body: {
        action: 'delete_user',
        userId: detailsUser.id,
      },
    });
    setDeletingUser(false);

    if (error || !data?.ok) {
      const errorText = String(error?.message ?? data?.error ?? '').toLowerCase();
      const isMissingFunction = errorText.includes('404') || errorText.includes('not found') || errorText.includes('failed to fetch');
      toast({
        title: 'Не удалось удалить пользователя',
        description: isMissingFunction
          ? 'Edge function admin-manage-user не задеплоена. Выполните деплой Supabase Functions.'
          : error?.message ?? data?.error ?? 'Неизвестная ошибка',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Пользователь удалён' });
    setDetailsOpen(false);
    setDetailsUser(null);
    setDeleteConfirmText('');
    await loadDirectoryUsers();
  };

  const toggleInviteRole = (slug: string) => {
    setInviteRoleSlugs((prev) => {
      if (prev.includes(slug)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== slug);
      }
      return [...prev, slug];
    });
  };

  const toggleCreateRole = (slug: string) => {
    setCreateRoleSlugs((prev) => {
      if (prev.includes(slug)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== slug);
      }
      return [...prev, slug];
    });
  };

  const handleInvite = async () => {
    setInviteLoading(true);

    const { data, error } = await supabasePublic.functions.invoke('admin-invite-user', {
      body: {
        email: inviteEmail,
        referralCode: DEFAULT_ADMIN_REFERRAL_CODE,
        roleSlugs: inviteRoleSlugs,
      },
    });

    setInviteLoading(false);

    if (error || !data?.ok) {
      toast({
        title: 'Не удалось отправить invite',
        description: error?.message ?? data?.error ?? 'Неизвестная ошибка',
        variant: 'destructive',
      });
      return;
    }

    setInviteEmail('');
    setInviteRoleSlugs(['streamer']);
    setInviteOpen(false);

    if (data.inviteMailError) {
      if (data.inviteLink && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(data.inviteLink);
      }

      toast({
        title: 'Письмо не отправлено',
        description: data.inviteLink
          ? `Причина: ${data.inviteMailError}. Ссылка скопирована в буфер обмена.`
          : `Причина: ${data.inviteMailError}`,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Инвайт отправлен',
      description: data.inviteLink ? `Ссылка: ${data.inviteLink}` : 'Проверьте email приглашенного пользователя',
    });
  };

  const handleCreate = async () => {
    setCreateLoading(true);

    const { data, error } = await supabasePublic.functions.invoke('admin-create-user', {
      body: {
        email: createEmail,
        password: createPassword,
        displayName: createDisplayName,
        referralCode: DEFAULT_ADMIN_REFERRAL_CODE,
        roleSlugs: createRoleSlugs,
      },
    });

    setCreateLoading(false);

    if (error || !data?.ok) {
      toast({
        title: 'Не удалось создать пользователя',
        description: error?.message ?? data?.error ?? 'Неизвестная ошибка',
        variant: 'destructive',
      });
      return;
    }

    setCreateEmail('');
    setCreatePassword('');
    setCreateDisplayName('');
    setCreateRoleSlugs(['streamer']);
    setCreateOpen(false);
    await loadDirectoryUsers();

    toast({
      title: 'Пользователь создан',
      description: `User ID: ${data.userId}`,
    });
  };

  return (
    <>
      <div className="rounded-xl glass border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск пользователей..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none w-64"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Нажмите <span className="font-medium text-foreground">Управление</span>, чтобы открыть карточку пользователя (в т.ч. смена пароля и удаление).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setInviteOpen(true)}>Пригласить пользователя</Button>
            <Button onClick={() => setCreateOpen(true)}>Создать пользователя</Button>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Пользователь</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Осн. роль</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Все роли</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Вход</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Присоединился {new Date(user.joinedDate).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">{directoryById.get(user.id)?.email ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("px-2 py-1 text-xs font-medium rounded-full", roleStyles[user.role] ?? 'bg-secondary text-secondary-foreground')}>
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <UserRoleBadges userId={user.id} showInternal />
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm">
                    {directoryById.get(user.id)?.last_sign_in_at
                      ? new Date(directoryById.get(user.id)!.last_sign_in_at!).toLocaleString('ru-RU')
                      : 'Нет'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void openDetails(user)}
                      title="Управление пользователем"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Управление
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setRoleAssignUser({ id: user.id, name: user.name })}
                      title="Назначить роли"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Роли
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {roleAssignUser && (
        <UserRoleAssign
          userId={roleAssignUser.id}
          userName={roleAssignUser.name}
          onClose={() => setRoleAssignUser(null)}
        />
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Карточка пользователя</DialogTitle>
            <DialogDescription>
              Полное управление аккаунтом: данные профиля, пароль и удаление.
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="text-sm text-muted-foreground py-6">Загрузка...</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input value={profileForm.email} onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Отображаемое имя</Label>
                  <Input value={profileForm.displayName} onChange={(e) => setProfileForm((prev) => ({ ...prev, displayName: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Username</Label>
                  <Input value={profileForm.username} onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Telegram</Label>
                  <Input value={profileForm.telegramUsername} onChange={(e) => setProfileForm((prev) => ({ ...prev, telegramUsername: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Страна</Label>
                  <Input value={profileForm.country} onChange={(e) => setProfileForm((prev) => ({ ...prev, country: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Язык</Label>
                  <Input value={profileForm.language} onChange={(e) => setProfileForm((prev) => ({ ...prev, language: e.target.value }))} />
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 rounded-md border border-border p-3">
                <p>ID: {details?.user.id ?? detailsUser?.id ?? '—'}</p>
                <p>Создан: {details?.user.createdAt ? new Date(details.user.createdAt).toLocaleString('ru-RU') : '—'}</p>
                <p>Последний вход: {details?.user.lastSignInAt ? new Date(details.user.lastSignInAt).toLocaleString('ru-RU') : '—'}</p>
                <p>Email подтвержден: {details?.user.emailConfirmedAt ? 'Да' : 'Нет'}</p>
              </div>

              <div className="space-y-2 rounded-md border border-border p-3">
                <Label>Смена пароля</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Новый пароль (мин. 8 символов)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Button variant="outline" disabled={passwordUpdating} onClick={() => void resetPassword()}>
                    <Lock className="w-4 h-4 mr-1" />
                    Сменить
                  </Button>
                </div>
              </div>

              <div className="space-y-2 rounded-md border border-destructive/40 p-3">
                <Label>Удаление пользователя</Label>
                <p className="text-xs text-muted-foreground">Введите User ID для подтверждения удаления.</p>
                <div className="flex gap-2">
                  <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={detailsUser?.id ?? 'User ID'} />
                  <Button variant="destructive" disabled={deletingUser} onClick={() => void deleteUser()}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Удалить
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Закрыть</Button>
            <Button disabled={detailsSaving || detailsLoading} onClick={() => void saveProfile()}>
              <Save className="w-4 h-4 mr-1" />
              Сохранить профиль
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Пригласить пользователя</DialogTitle>
            <DialogDescription>Выберите роли и отправьте инвайт. Реферальный код применяется автоматически: NOVA-2026.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email</Label>
              <Input id="inviteEmail" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Роли</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border border-border p-3">
                {inviteRoleOptions.map((option) => (
                  <label key={option.slug} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inviteRoleSlugs.includes(option.slug)}
                      onChange={() => toggleInviteRole(option.slug)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviteLoading}>Отмена</Button>
            <Button onClick={() => void handleInvite()} disabled={inviteLoading || !inviteEmail.trim()}>Отправить приглашение</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать пользователя</DialogTitle>
            <DialogDescription>Создание пользователя с паролем. Реферальный код применяется автоматически: NOVA-2026.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="createEmail">Email</Label>
              <Input id="createEmail" type="email" value={createEmail} onChange={(event) => setCreateEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createPassword">Пароль</Label>
              <Input id="createPassword" type="password" value={createPassword} onChange={(event) => setCreatePassword(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="createName">Отображаемое имя</Label>
              <Input id="createName" value={createDisplayName} onChange={(event) => setCreateDisplayName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Роли</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border border-border p-3">
                {inviteRoleOptions.map((option) => (
                  <label key={option.slug} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createRoleSlugs.includes(option.slug)}
                      onChange={() => toggleCreateRole(option.slug)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createLoading}>Отмена</Button>
            <Button onClick={() => void handleCreate()} disabled={createLoading || !createEmail.trim() || createPassword.length < 8}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ─── Events Tab ──────────────────────────────────────────────
const eventTypeStyles: Record<string, string> = {
  stream_start: 'bg-success/20 text-success',
  stream_end: 'bg-muted text-muted-foreground',
  milestone: 'bg-accent/20 text-accent',
  achievement: 'bg-nova-purple/20 text-nova-purple',
};

const eventTypeLabels: Record<string, string> = {
  stream_start: 'Начало стрима',
  stream_end: 'Конец стрима',
  milestone: 'Milestone',
  achievement: 'Достижение',
};

const EventsTab: React.FC<{ events: StreamEvent[] }> = ({ events }) => (
  <div className="rounded-xl glass border border-border overflow-hidden">
    <div className="p-4 border-b border-border">
      <h3 className="font-semibold">Последние события</h3>
    </div>
    <div className="divide-y divide-border">
      {events.map((event) => (
        <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", eventTypeStyles[event.type])}>
                {eventTypeLabels[event.type]}
              </span>
              <span className="text-sm font-medium">{event.streamerName}</span>
            </div>
            <p className="text-sm text-muted-foreground">{event.description}</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(event.timestamp).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default Admin;
