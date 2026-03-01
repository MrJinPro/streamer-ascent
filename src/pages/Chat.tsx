import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Send, Plus, Search, ShieldCheck, Users, Smile, Trash2,
  ArrowDown, MessageCircle, X, MoreVertical, UserPlus, Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import UserRoleBadges from '@/components/UserRoleBadges';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { toast } from '@/hooks/use-toast';
import { getRoleLabel } from '@/lib/roles';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

type ChatThreadKind = 'direct' | 'group' | 'support';

type ChatThread = {
  id: string;
  kind: ChatThreadKind;
  title: string | null;
  last_message_text: string | null;
  last_message_at: string | null;
  created_by: string | null;
};

type ChatMember = {
  thread_id: string;
  user_id: string;
  member_role: 'member' | 'admin';
  is_active: boolean;
  last_read_at: string | null;
};

type ChatMessage = {
  id: string;
  thread_id: string;
  sender_user_id: string;
  message_text: string;
  excluded_user_ids: string[];
  created_at: string;
};

type ChatReceipt = {
  message_id: string;
  recipient_user_id: string;
  delivered_at: string;
  read_at: string | null;
};

type UserProfile = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_online: boolean | null;
};

const rolePriority: Record<string, number> = {
  owner: 1, admin: 2, developer: 3, senior_curator: 4, manager: 5,
  curator: 6, moderator: 7, support: 8, investor: 9, streamer: 10,
};

const EMOJI_QUICK = ['👍', '❤️', '😂', '🔥', '😊', '🎉', '💎', '✨'];

const Chat: React.FC = () => {
  const { user, role } = useAuth();
  const { allUsers } = useAppData();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [receipts, setReceipts] = useState<ChatReceipt[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, UserProfile>>({});
  const [roleMap, setRoleMap] = useState<Record<string, string>>({});
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [excludedForMessage, setExcludedForMessage] = useState<string[]>([]);
  const [profileUserIds, setProfileUserIds] = useState<Set<string>>(new Set());
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [threadSearch, setThreadSearch] = useState('');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [newChatTab, setNewChatTab] = useState<'contact' | 'group'>('contact');
  const [groupTitle, setGroupTitle] = useState('');
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef(0);
  const previousThreadIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const currentRole = role ?? 'streamer';

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmojiPicker]);

  const membersByThread = useMemo(() => {
    const map: Record<string, ChatMember[]> = {};
    for (const member of members) {
      if (!map[member.thread_id]) map[member.thread_id] = [];
      map[member.thread_id].push(member);
    }
    return map;
  }, [members]);

  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) ?? null,
    [threads, selectedThreadId],
  );

  const selectedThreadMembers = useMemo(
    () => (selectedThread ? (membersByThread[selectedThread.id] ?? []) : []),
    [membersByThread, selectedThread],
  );

  const selectedThreadMessages = useMemo(
    () => (selectedThread ? messages.filter((m) => m.thread_id === selectedThread.id) : []),
    [messages, selectedThread],
  );

  const detectIsAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight <= 48;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
    setIsAtBottom(true);
    setNewMessagesCount(0);
  }, []);

  const handleMessagesScroll = useCallback(() => {
    const atBottom = detectIsAtBottom();
    setIsAtBottom(atBottom);
    if (atBottom) setNewMessagesCount(0);
  }, [detectIsAtBottom]);

  const threadsSorted = useMemo(
    () => [...threads].sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    }),
    [threads],
  );

  const filteredThreads = useMemo(() => {
    const needle = threadSearch.trim().toLowerCase();
    if (!needle) return threadsSorted;
    return threadsSorted.filter((t) => {
      const title = getThreadTitleRaw(t).toLowerCase();
      return title.includes(needle);
    });
  }, [threadSearch, threadsSorted]);

  useEffect(() => {
    if (threadsSorted.length === 0) return;
    if (!selectedThreadId) {
      setSelectedThreadId(threadsSorted[0].id);
      return;
    }
    const stillExists = threadsSorted.some((t) => t.id === selectedThreadId);
    if (!stillExists) setSelectedThreadId(threadsSorted[0].id);
  }, [selectedThreadId, threadsSorted]);

  const potentialContacts = useMemo(() => {
    if (!user?.id) return [];
    const isProfileUser = (id: string) => profileUserIds.has(id);

    if (currentRole === 'curator') {
      const streamerIds = new Set<string>();
      for (const thread of threads) {
        const tm = membersByThread[thread.id] ?? [];
        tm.forEach((m) => {
          if (m.user_id !== user.id && (roleMap[m.user_id] ?? 'streamer') === 'streamer') {
            streamerIds.add(m.user_id);
          }
        });
      }
      return allUsers.filter((u) => streamerIds.has(u.id) && isProfileUser(u.id));
    }

    if (currentRole === 'streamer') {
      return allUsers.filter((u) => u.id !== user.id && isProfileUser(u.id) && (u.role === 'streamer' || u.role === 'curator'));
    }

    return allUsers.filter((u) => u.id !== user.id && isProfileUser(u.id));
  }, [allUsers, currentRole, membersByThread, profileUserIds, roleMap, threads, user?.id]);

  const filteredNewChatContacts = useMemo(() => {
    const needle = newChatSearch.trim().toLowerCase();
    if (!needle) return potentialContacts;
    return potentialContacts.filter((c) => {
      const label = `${c.name} ${getRoleLabel(c.role)}`.toLowerCase();
      return label.includes(needle);
    });
  }, [newChatSearch, potentialContacts]);

  useEffect(() => {
    const loadProfileUserIds = async () => {
      const candidateIds = Array.from(new Set(allUsers.map((i) => i.id).filter(Boolean)));
      if (candidateIds.length === 0) { setProfileUserIds(new Set()); return; }
      const { data } = await supabasePublic.from('profiles').select('user_id').in('user_id', candidateIds);
      setProfileUserIds(new Set((data ?? []).map((r: any) => r.user_id)));
    };
    void loadProfileUserIds();
  }, [allUsers]);

  const getDisplayName = (userId: string) => {
    const profile = profilesMap[userId];
    return profile?.display_name ?? profile?.username ?? allUsers.find((i) => i.id === userId)?.name ?? 'Пользователь';
  };

  const getAvatar = (userId: string) => {
    const profile = profilesMap[userId];
    return profile?.avatar_url ?? allUsers.find((i) => i.id === userId)?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
  };

  function getThreadTitleRaw(thread: ChatThread) {
    if (thread.kind === 'group' || thread.kind === 'support') return thread.title ?? 'Группа';
    const tm = membersByThread[thread.id] ?? [];
    const other = tm.find((m) => m.user_id !== user?.id);
    if (!other) return 'Личный чат';
    return getDisplayName(other.user_id);
  }

  const getThreadAvatar = (thread: ChatThread) => {
    if (thread.kind === 'support') return 'https://api.dicebear.com/7.x/avataaars/svg?seed=Support';
    if (thread.kind === 'group') return 'https://api.dicebear.com/7.x/avataaars/svg?seed=Group';
    const tm = membersByThread[thread.id] ?? [];
    const other = tm.find((m) => m.user_id !== user?.id);
    return other ? getAvatar(other.user_id) : 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
  };

  const getOwnMessageStatus = (messageId: string) => {
    const r = receipts.filter((r) => r.message_id === messageId);
    if (r.length === 0) return '✓';
    if (r.every((r) => r.read_at)) return '✓✓';
    if (r.every((r) => r.delivered_at)) return '✓✓';
    return '✓';
  };

  const loadUnread = async () => {
    const { data } = await (supabasePublic as any).rpc('chat_get_unread_counts');
    const nextMap: Record<string, number> = {};
    for (const row of data ?? []) nextMap[row.thread_id] = Number(row.unread_count ?? 0);
    setUnreadMap(nextMap);
  };

  const loadThreads = async (options?: { silent?: boolean }) => {
    if (!user?.id) return;
    if (!options?.silent) setLoading(true);

    await (supabasePublic as any).rpc('chat_sync_support_memberships', { p_user_id: user.id });

    const { data: myMemberships, error: myMembershipsError } = await supabasePublic
      .from('chat_thread_members').select('thread_id').eq('user_id', user.id).eq('is_active', true);

    if (myMembershipsError) {
      toast({ title: 'Не удалось загрузить чаты', description: myMembershipsError.message, variant: 'destructive' });
      if (!options?.silent) setLoading(false);
      return;
    }

    const threadIds = (myMemberships ?? []).map((i) => i.thread_id);
    if (threadIds.length === 0) {
      if (!options?.silent) { setThreads([]); setMembers([]); setMessages([]); setReceipts([]); setLoading(false); }
      return;
    }

    const [{ data: threadRows }, { data: memberRows }] = await Promise.all([
      supabasePublic.from('chat_threads').select('id,kind,title,last_message_text,last_message_at,created_by').in('id', threadIds),
      supabasePublic.from('chat_thread_members').select('thread_id,user_id,member_role,is_active,last_read_at').in('thread_id', threadIds).eq('is_active', true),
    ]);

    const userIds = Array.from(new Set((memberRows ?? []).map((i) => i.user_id)));
    const [{ data: profileRows }, { data: roleRows }] = await Promise.all([
      supabasePublic.from('profiles').select('user_id,display_name,username,avatar_url,is_online').in('user_id', userIds),
      supabasePublic.from('user_roles').select('user_id,role').in('user_id', userIds),
    ]);

    setProfilesMap((profileRows ?? []).reduce<Record<string, UserProfile>>((acc, i: any) => { acc[i.user_id] = i; return acc; }, {}));
    setRoleMap((roleRows ?? []).reduce<Record<string, string>>((acc, i: any) => {
      if (!acc[i.user_id] || (rolePriority[i.role] ?? 99) < (rolePriority[acc[i.user_id]] ?? 99)) acc[i.user_id] = i.role;
      return acc;
    }, {}));
    setThreads((threadRows ?? []) as ChatThread[]);
    setMembers((memberRows ?? []) as ChatMember[]);

    if (!selectedThreadId && threadRows && threadRows.length > 0) {
      const sorted = [...threadRows].sort((a, b) => {
        const aT = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bT = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bT - aT;
      });
      setSelectedThreadId(sorted[0].id);
    }

    await loadUnread();
    if (!options?.silent) setLoading(false);
  };

  const loadMessages = async (threadId: string) => {
    const { data: messageRows } = await supabasePublic
      .from('chat_messages_internal')
      .select('id,thread_id,sender_user_id,message_text,excluded_user_ids,created_at')
      .eq('thread_id', threadId).order('created_at', { ascending: true }).limit(500);

    setMessages((messageRows ?? []) as ChatMessage[]);

    const messageIds = (messageRows ?? []).map((i) => i.id);
    if (messageIds.length === 0) { setReceipts([]); return; }

    const { data: receiptRows } = await supabasePublic
      .from('chat_message_receipts').select('message_id,recipient_user_id,delivered_at,read_at').in('message_id', messageIds);
    setReceipts((receiptRows ?? []) as ChatReceipt[]);
  };

  const markSelectedThreadRead = async (threadId: string) => {
    await (supabasePublic as any).rpc('chat_mark_thread_read', { p_thread_id: threadId });
    await loadUnread();
  };

  const openSupportThread = async () => {
    const { data, error } = await (supabasePublic as any).rpc('chat_get_or_create_support_thread');
    if (error) { toast({ title: 'Не удалось открыть техподдержку', description: error.message, variant: 'destructive' }); return; }
    const threadId = Array.isArray(data) ? data[0] : data;
    await loadThreads({ silent: true });
    if (threadId) { setSelectedThreadId(threadId); if (isMobile) setShowSidebar(false); }
  };

  const openDirect = async (targetUserId: string) => {
    const { data, error } = await (supabasePublic as any).rpc('chat_get_or_create_direct_thread', { p_target_user_id: targetUserId });
    if (error) {
      const errorText = String(error.message ?? '').toLowerCase();
      const desc = errorText.includes('target_user_not_found') || errorText.includes('target_profile_not_found')
        ? 'Пользователь недоступен для чата.' : error.message;
      toast({ title: 'Не удалось открыть диалог', description: desc, variant: 'destructive' });
      return;
    }
    const threadId = Array.isArray(data) ? data[0] : data;
    await loadThreads({ silent: true });
    if (threadId) { setSelectedThreadId(threadId); if (isMobile) setShowSidebar(false); }
    setShowNewChatDialog(false);
  };

  const createGroup = async () => {
    if (!groupTitle.trim()) { toast({ title: 'Введите название группы', variant: 'destructive' }); return; }
    const { data, error } = await (supabasePublic as any).rpc('chat_create_group', { p_title: groupTitle.trim(), p_member_ids: groupMemberIds });
    if (error) { toast({ title: 'Не удалось создать группу', description: error.message, variant: 'destructive' }); return; }
    setGroupTitle(''); setGroupMemberIds([]);
    const threadId = Array.isArray(data) ? data[0] : data;
    await loadThreads({ silent: true });
    if (threadId) { setSelectedThreadId(threadId); if (isMobile) setShowSidebar(false); }
    setShowNewChatDialog(false);
  };

  const deleteThread = async (threadId: string) => {
    // Leave thread (deactivate membership)
    const { error } = await supabasePublic
      .from('chat_thread_members')
      .update({ is_active: false })
      .eq('thread_id', threadId)
      .eq('user_id', user!.id);

    if (error) { toast({ title: 'Не удалось удалить чат', description: error.message, variant: 'destructive' }); return; }

    setDeletingThreadId(null);
    if (selectedThreadId === threadId) setSelectedThreadId(null);
    await loadThreads({ silent: true });
    toast({ title: 'Чат удалён' });
  };

  const sendMessage = async () => {
    if (!selectedThread || !message.trim()) return;
    const excluded = selectedThread.kind === 'group' ? excludedForMessage : [];
    const { error } = await (supabasePublic as any).rpc('chat_send_message', {
      p_thread_id: selectedThread.id, p_text: message.trim(), p_excluded_user_ids: excluded,
    });
    if (error) { toast({ title: 'Ошибка отправки', description: error.message, variant: 'destructive' }); return; }
    setMessage(''); setExcludedForMessage([]); setShowEmojiPicker(false);
    await Promise.all([loadThreads({ silent: true }), loadMessages(selectedThread.id)]);
  };

  const addEmoji = (emoji: any) => {
    setMessage((prev) => prev + (emoji.native ?? emoji));
    inputRef.current?.focus();
  };

  // Initial load
  useEffect(() => { void loadThreads(); }, [user?.id]);

  // Load messages on thread select
  useEffect(() => {
    if (!selectedThreadId) return;
    void loadMessages(selectedThreadId);
    void markSelectedThreadRead(selectedThreadId);
    setExcludedForMessage([]);
    setNewMessagesCount(0);
  }, [selectedThreadId]);

  // Auto-scroll on new messages
  useEffect(() => {
    const currentThreadId = selectedThread?.id ?? null;
    const currentCount = selectedThreadMessages.length;

    if (previousThreadIdRef.current !== currentThreadId) {
      previousThreadIdRef.current = currentThreadId;
      previousMessageCountRef.current = currentCount;
      requestAnimationFrame(() => scrollToBottom('auto'));
      return;
    }

    const delta = currentCount - previousMessageCountRef.current;
    if (delta <= 0) { previousMessageCountRef.current = currentCount; return; }

    if (detectIsAtBottom()) {
      requestAnimationFrame(() => scrollToBottom('smooth'));
    } else {
      setNewMessagesCount((prev) => prev + delta);
    }
    previousMessageCountRef.current = currentCount;
  }, [detectIsAtBottom, scrollToBottom, selectedThread?.id, selectedThreadMessages.length]);

  // Realtime
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabasePublic
      .channel(`internal-chat-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages_internal' }, () => {
        void loadThreads({ silent: true });
        if (selectedThreadId) void loadMessages(selectedThreadId);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_message_receipts' }, () => {
        void loadUnread();
        if (selectedThreadId) void loadMessages(selectedThreadId);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_thread_members' }, () => {
        void loadThreads({ silent: true });
      })
      .subscribe();
    return () => { void supabasePublic.removeChannel(channel); };
  }, [user?.id, selectedThreadId]);

  if (!user) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">Войдите, чтобы пользоваться мессенджером</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Загрузка чатов...
        </div>
      </div>
    );
  }

  const totalUnread = Object.values(unreadMap).reduce((sum, n) => sum + n, 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 172800000) return 'Вчера';
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  };

  const threadKindIcon = (kind: ChatThreadKind) => {
    if (kind === 'support') return <ShieldCheck className="w-3.5 h-3.5 text-nova-cyan" />;
    if (kind === 'group') return <Users className="w-3.5 h-3.5 text-muted-foreground" />;
    return null;
  };

  return (
    <div className="h-[calc(100vh-6rem)] min-h-0 flex rounded-xl overflow-hidden border border-border bg-card animate-fade-in">
      {/* === SIDEBAR === */}
      <div className={cn(
        'flex flex-col border-r border-border bg-card transition-all duration-200',
        isMobile
          ? showSidebar ? 'w-full absolute inset-0 z-30' : 'hidden'
          : 'w-80 lg:w-96 shrink-0'
      )}>
        {/* Sidebar Header */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg">Мессенджер</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setShowNewChatDialog(true)} title="Новый чат">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Support button — prominent */}
          <button
            onClick={() => void openSupportThread()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[hsl(var(--nova-cyan)/0.15)] to-[hsl(var(--nova-purple)/0.1)] border border-[hsl(var(--nova-cyan)/0.3)] hover:border-[hsl(var(--nova-cyan)/0.6)] transition-all group"
          >
            <div className="w-9 h-9 rounded-full bg-[hsl(var(--nova-cyan)/0.2)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5 text-[hsl(var(--nova-cyan))]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Техподдержка</p>
              <p className="text-xs text-muted-foreground">Написать в поддержку</p>
            </div>
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={threadSearch}
              onChange={(e) => setThreadSearch(e.target.value)}
              placeholder="Поиск чатов..."
              className="pl-9 h-9 bg-secondary/50 border-0"
            />
          </div>
        </div>

        {/* Thread list */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-2 pb-2">
            {filteredThreads.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {threadSearch ? 'Ничего не найдено' : 'Нет чатов. Начните новый!'}
              </div>
            )}
            {filteredThreads.map((thread) => {
              const unread = unreadMap[thread.id] ?? 0;
              const isSelected = selectedThreadId === thread.id;

              return (
                <div key={thread.id} className="group relative">
                  <button
                    onClick={() => { setSelectedThreadId(thread.id); if (isMobile) setShowSidebar(false); }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all',
                      isSelected
                        ? 'bg-primary/10 shadow-sm'
                        : 'hover:bg-secondary/60',
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="w-11 h-11">
                        <AvatarImage src={getThreadAvatar(thread)} />
                        <AvatarFallback>{getThreadTitleRaw(thread)[0]}</AvatarFallback>
                      </Avatar>
                      {thread.kind !== 'direct' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center">
                          {threadKindIcon(thread.kind)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn('text-sm truncate', unread > 0 ? 'font-bold' : 'font-medium')}>
                          {getThreadTitleRaw(thread)}
                        </p>
                        {thread.last_message_at && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatDate(thread.last_message_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn('text-xs truncate', unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                          {thread.last_message_text ?? 'Нет сообщений'}
                        </p>
                        {unread > 0 && (
                          <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Delete action */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-md hover:bg-secondary"><MoreVertical className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); setDeletingThreadId(thread.id); }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Удалить чат
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* === CHAT AREA === */}
      <div className={cn(
        'flex-1 min-h-0 flex flex-col',
        isMobile && showSidebar && 'hidden',
      )}>
        {!selectedThread ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 px-6">
            <MessageCircle className="w-20 h-20 text-muted-foreground/20" />
            <p className="text-center">Выберите чат или начните новую беседу</p>
            <Button variant="outline" onClick={() => setShowNewChatDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Новый чат
            </Button>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={() => setShowSidebar(true)} className="shrink-0">
                  <ArrowDown className="w-5 h-5 rotate-90" />
                </Button>
              )}
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarImage src={getThreadAvatar(selectedThread)} />
                <AvatarFallback>{getThreadTitleRaw(selectedThread)[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{getThreadTitleRaw(selectedThread)}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedThread.kind === 'support' ? '🛡️ Техподдержка'
                    : selectedThread.kind === 'group' ? `👥 ${selectedThreadMembers.length} участников`
                    : '💬 Личный диалог'}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setDeletingThreadId(selectedThread.id)} className="text-destructive focus:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" /> Удалить чат
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Excluded members for group */}
            {selectedThread.kind === 'group' && (
              <div className="px-4 py-2 border-b border-border bg-secondary/20">
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                    Исключить участников из сообщения
                  </summary>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedThreadMembers.filter((m) => m.user_id !== user.id).map((m) => (
                      <label key={m.user_id} className="flex items-center gap-1.5 text-xs bg-secondary px-2 py-1 rounded-full cursor-pointer">
                        <input
                          type="checkbox"
                          checked={excludedForMessage.includes(m.user_id)}
                          onChange={(e) => setExcludedForMessage((p) => e.target.checked ? [...p, m.user_id] : p.filter((id) => id !== m.user_id))}
                          className="w-3 h-3"
                        />
                        {getDisplayName(m.user_id)}
                      </label>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {/* Messages */}
            <div className="relative flex-1 min-h-0">
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="h-full overflow-y-auto px-4 py-4 space-y-3"
              >
                {selectedThreadMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <MessageCircle className="w-12 h-12 text-muted-foreground/20" />
                    <p className="text-sm">Нет сообщений. Напишите первым! 👋</p>
                  </div>
                )}

                {selectedThreadMessages.map((msg, idx) => {
                  const isOwn = msg.sender_user_id === user.id;
                  const status = isOwn ? getOwnMessageStatus(msg.id) : null;
                  const prevMsg = selectedThreadMessages[idx - 1];
                  const showSender = !isOwn && (!prevMsg || prevMsg.sender_user_id !== msg.sender_user_id);

                  return (
                    <div key={msg.id} className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
                      {!isOwn && showSender && (
                        <Avatar className="w-8 h-8 mt-5 shrink-0">
                          <AvatarImage src={getAvatar(msg.sender_user_id)} />
                          <AvatarFallback>{getDisplayName(msg.sender_user_id)[0]}</AvatarFallback>
                        </Avatar>
                      )}
                      {!isOwn && !showSender && <div className="w-8 shrink-0" />}

                      <div className={cn('max-w-[75%] min-w-[80px]', isOwn && 'items-end')}>
                        {showSender && (
                          <div className="flex items-center gap-1.5 mb-1 ml-1">
                            <span className="text-xs font-semibold">{getDisplayName(msg.sender_user_id)}</span>
                            <UserRoleBadges userId={msg.sender_user_id} showInternal />
                          </div>
                        )}

                        <div className={cn(
                          'px-3.5 py-2.5 rounded-2xl shadow-sm',
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-secondary text-foreground rounded-bl-md',
                        )}>
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.message_text}</p>
                          <div className={cn('flex items-center justify-end gap-1 mt-1', isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                            <span className="text-[10px]">
                              {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && <span className="text-[10px]">{status}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Scroll to bottom button */}
              {!isAtBottom && (
                <button
                  onClick={() => scrollToBottom('smooth')}
                  className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <ArrowDown className="w-5 h-5" />
                  {newMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                      {newMessagesCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur-sm">
              {/* Quick emoji row */}
              <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1">
                {EMOJI_QUICK.map((e) => (
                  <button
                    key={e}
                    onClick={() => addEmoji({ native: e })}
                    className="text-lg hover:scale-125 transition-transform px-1 shrink-0"
                  >
                    {e}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-2 relative">
                {/* Emoji picker */}
                <div className="relative" ref={emojiRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="shrink-0 h-10 w-10"
                  >
                    <Smile className="w-5 h-5" />
                  </Button>

                  {showEmojiPicker && (
                    <div className="absolute bottom-12 left-0 z-50">
                      <Picker
                        data={data}
                        onEmojiSelect={addEmoji}
                        theme="dark"
                        locale="ru"
                        previewPosition="none"
                        skinTonePosition="none"
                        maxFrequentRows={2}
                      />
                    </div>
                  )}
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
                  }}
                  placeholder="Написать сообщение..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-secondary border border-border/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all text-sm"
                />

                <Button
                  onClick={() => void sendMessage()}
                  size="icon"
                  disabled={!message.trim()}
                  className="shrink-0 h-10 w-10 rounded-full"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* === NEW CHAT DIALOG === */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Новая беседа</DialogTitle>
            <DialogDescription>Начните личный диалог или создайте группу</DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setNewChatTab('contact')}
              className={cn('flex-1 py-2.5 text-sm font-medium transition-colors border-b-2',
                newChatTab === 'contact' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <UserPlus className="w-4 h-4 inline mr-1.5" /> Контакт
            </button>
            <button
              onClick={() => setNewChatTab('group')}
              className={cn('flex-1 py-2.5 text-sm font-medium transition-colors border-b-2',
                newChatTab === 'group' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Hash className="w-4 h-4 inline mr-1.5" /> Группа
            </button>
          </div>

          {newChatTab === 'contact' ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={newChatSearch}
                  onChange={(e) => setNewChatSearch(e.target.value)}
                  placeholder="Поиск по имени или роли..."
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {filteredNewChatContacts.slice(0, 30).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => void openDirect(c.id)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                    >
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={c.avatar} />
                        <AvatarFallback>{c.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{getRoleLabel(c.role)}</p>
                      </div>
                    </button>
                  ))}
                  {filteredNewChatContacts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Контакты не найдены</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="Название группы"
              />
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {potentialContacts.slice(0, 30).map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={groupMemberIds.includes(c.id)}
                        onChange={(e) => setGroupMemberIds((p) => e.target.checked ? [...p, c.id] : p.filter((id) => id !== c.id))}
                        className="w-4 h-4 rounded"
                      />
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={c.avatar} />
                        <AvatarFallback>{c.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{c.name}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
              {groupMemberIds.length > 0 && (
                <p className="text-xs text-muted-foreground">Выбрано: {groupMemberIds.length}</p>
              )}
              <Button onClick={() => void createGroup()} className="w-full" disabled={!groupTitle.trim()}>
                Создать группу
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* === DELETE CONFIRMATION === */}
      <Dialog open={!!deletingThreadId} onOpenChange={() => setDeletingThreadId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить чат?</DialogTitle>
            <DialogDescription>
              Вы покинете этот чат. Сообщения останутся для других участников.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeletingThreadId(null)}>Отмена</Button>
            <Button variant="destructive" onClick={() => { if (deletingThreadId) void deleteThread(deletingThreadId); }}>
              Удалить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;
