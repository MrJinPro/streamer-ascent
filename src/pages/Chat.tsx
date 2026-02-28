import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send, Plus, ShieldCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import UserRoleBadges from '@/components/UserRoleBadges';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { toast } from '@/hooks/use-toast';
import { getRoleLabel } from '@/lib/roles';

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
  owner: 1,
  admin: 2,
  developer: 3,
  senior_curator: 4,
  manager: 5,
  curator: 6,
  moderator: 7,
  support: 8,
  investor: 9,
  streamer: 10,
};

const Chat: React.FC = () => {
  const { user, role } = useAuth();
  const { allUsers } = useAppData();
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
  const [createGroupMode, setCreateGroupMode] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [excludedForMessage, setExcludedForMessage] = useState<string[]>([]);
  const [profileUserIds, setProfileUserIds] = useState<Set<string>>(new Set());
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef(0);
  const previousThreadIdRef = useRef<string | null>(null);

  const currentRole = role ?? 'streamer';

  const membersByThread = useMemo(() => {
    const map: Record<string, ChatMember[]> = {};
    for (const member of members) {
      if (!map[member.thread_id]) map[member.thread_id] = [];
      map[member.thread_id].push(member);
    }
    return map;
  }, [members]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [threads, selectedThreadId],
  );

  const selectedThreadMembers = useMemo(
    () => (selectedThread ? (membersByThread[selectedThread.id] ?? []) : []),
    [membersByThread, selectedThread],
  );

  const selectedThreadMessages = useMemo(
    () => (selectedThread ? messages.filter((item) => item.thread_id === selectedThread.id) : []),
    [messages, selectedThread],
  );

  const detectIsAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceToBottom <= 48;
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
    if (atBottom) {
      setNewMessagesCount(0);
    }
  }, [detectIsAtBottom]);

  const threadsSorted = useMemo(
    () => [...threads].sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    }),
    [threads],
  );

  useEffect(() => {
    if (threadsSorted.length === 0) {
      return;
    }

    if (!selectedThreadId) {
      setSelectedThreadId(threadsSorted[0].id);
      return;
    }

    const stillExists = threadsSorted.some((thread) => thread.id === selectedThreadId);
    if (!stillExists) {
      setSelectedThreadId(threadsSorted[0].id);
    }
  }, [selectedThreadId, threadsSorted]);

  const potentialContacts = useMemo(() => {
    if (!user?.id) return [];

    const isProfileUser = (id: string) => profileUserIds.has(id);

    if (currentRole === 'curator') {
      const streamerIds = new Set<string>();
      for (const thread of threads) {
        const threadMembers = membersByThread[thread.id] ?? [];
        threadMembers.forEach((member) => {
          if (member.user_id !== user.id && (roleMap[member.user_id] ?? 'streamer') === 'streamer') {
            streamerIds.add(member.user_id);
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

  useEffect(() => {
    const loadProfileUserIds = async () => {
      const candidateIds = Array.from(new Set(allUsers.map((item) => item.id).filter(Boolean)));
      if (candidateIds.length === 0) {
        setProfileUserIds(new Set());
        return;
      }

      const { data } = await supabasePublic
        .from('profiles')
        .select('user_id')
        .in('user_id', candidateIds);

      const ids = new Set<string>((data ?? []).map((row: any) => row.user_id));
      setProfileUserIds(ids);
    };

    void loadProfileUserIds();
  }, [allUsers]);

  const getDisplayName = (userId: string) => {
    const profile = profilesMap[userId];
    return profile?.display_name ?? profile?.username ?? allUsers.find((item) => item.id === userId)?.name ?? 'Пользователь';
  };

  const getAvatar = (userId: string) => {
    const profile = profilesMap[userId];
    return profile?.avatar_url ?? allUsers.find((item) => item.id === userId)?.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
  };

  const getThreadTitle = (thread: ChatThread) => {
    if (thread.kind === 'group' || thread.kind === 'support') return thread.title ?? 'Группа';

    const threadMembers = membersByThread[thread.id] ?? [];
    const other = threadMembers.find((member) => member.user_id !== user?.id);
    if (!other) return 'Личный чат';
    return getDisplayName(other.user_id);
  };

  const getThreadAvatar = (thread: ChatThread) => {
    if (thread.kind === 'support') return 'https://api.dicebear.com/7.x/avataaars/svg?seed=Support';
    if (thread.kind === 'group') return 'https://api.dicebear.com/7.x/avataaars/svg?seed=Group';

    const threadMembers = membersByThread[thread.id] ?? [];
    const other = threadMembers.find((member) => member.user_id !== user?.id);
    return other ? getAvatar(other.user_id) : 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
  };

  const getOwnMessageStatus = (messageId: string) => {
    const ownReceipts = receipts.filter((receipt) => receipt.message_id === messageId);
    if (ownReceipts.length === 0) return 'Отправлено';
    if (ownReceipts.every((receipt) => receipt.read_at)) return 'Прочитано';
    if (ownReceipts.every((receipt) => receipt.delivered_at)) return 'Доставлено';
    return 'Отправлено';
  };

  const loadUnread = async () => {
    const { data, error } = await (supabasePublic as any).rpc('chat_get_unread_counts');
    if (error) return;

    const nextMap: Record<string, number> = {};
    for (const row of data ?? []) {
      nextMap[row.thread_id] = Number(row.unread_count ?? 0);
    }
    setUnreadMap(nextMap);
  };

  const loadThreads = async (options?: { silent?: boolean }) => {
    if (!user?.id) return;
    const isSilent = options?.silent ?? false;

    if (!isSilent) {
      setLoading(true);
    }

    await (supabasePublic as any).rpc('chat_sync_support_memberships', { p_user_id: user.id });

    const { data: myMemberships, error: myMembershipsError } = await supabasePublic
      .from('chat_thread_members')
      .select('thread_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (myMembershipsError) {
      toast({ title: 'Не удалось загрузить чаты', description: myMembershipsError.message, variant: 'destructive' });
      if (!isSilent) {
        setLoading(false);
      }
      return;
    }

    const threadIds = (myMemberships ?? []).map((item) => item.thread_id);
    if (threadIds.length === 0) {
      setThreads([]);
      setMembers([]);
      setMessages([]);
      setReceipts([]);
      if (!isSilent) {
        setLoading(false);
      }
      return;
    }

    const [{ data: threadRows, error: threadError }, { data: memberRows, error: memberError }] = await Promise.all([
      supabasePublic
        .from('chat_threads')
        .select('id,kind,title,last_message_text,last_message_at,created_by')
        .in('id', threadIds),
      supabasePublic
        .from('chat_thread_members')
        .select('thread_id,user_id,member_role,is_active,last_read_at')
        .in('thread_id', threadIds)
        .eq('is_active', true),
    ]);

    if (threadError || memberError) {
      toast({ title: 'Не удалось загрузить переписки', description: threadError?.message ?? memberError?.message, variant: 'destructive' });
      if (!isSilent) {
        setLoading(false);
      }
      return;
    }

    const userIds = Array.from(new Set((memberRows ?? []).map((item) => item.user_id)));
    const [{ data: profileRows }, { data: roleRows }] = await Promise.all([
      supabasePublic
        .from('profiles')
        .select('user_id,display_name,username,avatar_url,is_online')
        .in('user_id', userIds),
      supabasePublic
        .from('user_roles')
        .select('user_id,role')
        .in('user_id', userIds),
    ]);

    const nextProfilesMap = (profileRows ?? []).reduce<Record<string, UserProfile>>((acc, item: any) => {
      acc[item.user_id] = item;
      return acc;
    }, {});

    const nextRoleMap = (roleRows ?? []).reduce<Record<string, string>>((acc, item: any) => {
      const current = acc[item.user_id];
      if (!current || (rolePriority[item.role] ?? 99) < (rolePriority[current] ?? 99)) {
        acc[item.user_id] = item.role;
      }
      return acc;
    }, {});

    setThreads((threadRows ?? []) as ChatThread[]);
    setMembers((memberRows ?? []) as ChatMember[]);
    setProfilesMap(nextProfilesMap);
    setRoleMap(nextRoleMap);

    if (!selectedThreadId && threadRows && threadRows.length > 0) {
      const sorted = [...threadRows].sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      });
      setSelectedThreadId(sorted[0].id);
    }

    await loadUnread();
    if (!isSilent) {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    const { data: messageRows, error: messageError } = await supabasePublic
      .from('chat_messages_internal')
      .select('id,thread_id,sender_user_id,message_text,excluded_user_ids,created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(500);

    if (messageError) {
      toast({ title: 'Не удалось загрузить сообщения', description: messageError.message, variant: 'destructive' });
      return;
    }

    setMessages((messageRows ?? []) as ChatMessage[]);

    const messageIds = (messageRows ?? []).map((item) => item.id);
    if (messageIds.length === 0) {
      setReceipts([]);
      return;
    }

    const { data: receiptRows } = await supabasePublic
      .from('chat_message_receipts')
      .select('message_id,recipient_user_id,delivered_at,read_at')
      .in('message_id', messageIds);

    setReceipts((receiptRows ?? []) as ChatReceipt[]);
  };

  const markSelectedThreadRead = async (threadId: string) => {
    await (supabasePublic as any).rpc('chat_mark_thread_read', { p_thread_id: threadId });
    await loadUnread();
  };

  const openSupportThread = async () => {
    const { data, error } = await (supabasePublic as any).rpc('chat_get_or_create_support_thread');
    if (error) {
      toast({ title: 'Не удалось открыть техподдержку', description: error.message, variant: 'destructive' });
      return;
    }
    const threadId = Array.isArray(data) ? data[0] : data;
    await loadThreads({ silent: true });
    if (threadId) setSelectedThreadId(threadId);
  };

  const openDirect = async (targetUserId: string) => {
    const { data, error } = await (supabasePublic as any).rpc('chat_get_or_create_direct_thread', {
      p_target_user_id: targetUserId,
    });

    if (error) {
      const errorText = String(error.message ?? '').toLowerCase();
      const description = errorText.includes('target_user_not_found') || errorText.includes('target_profile_not_found')
        ? 'Пользователь недоступен для чата: профиль не найден.'
        : error.message;

      toast({ title: 'Не удалось открыть диалог', description, variant: 'destructive' });
      return;
    }

    const threadId = Array.isArray(data) ? data[0] : data;
    await loadThreads({ silent: true });
    if (threadId) setSelectedThreadId(threadId);
  };

  const createGroup = async () => {
    if (!groupTitle.trim()) {
      toast({ title: 'Название группы обязательно', variant: 'destructive' });
      return;
    }

    const { data, error } = await (supabasePublic as any).rpc('chat_create_group', {
      p_title: groupTitle.trim(),
      p_member_ids: groupMemberIds,
    });

    if (error) {
      toast({ title: 'Не удалось создать группу', description: error.message, variant: 'destructive' });
      return;
    }

    setCreateGroupMode(false);
    setGroupTitle('');
    setGroupMemberIds([]);
    const threadId = Array.isArray(data) ? data[0] : data;
    await loadThreads({ silent: true });
    if (threadId) setSelectedThreadId(threadId);
  };

  const sendMessage = async () => {
    if (!selectedThread || !message.trim()) return;

    const excluded = selectedThread.kind === 'group' ? excludedForMessage : [];

    const { error } = await (supabasePublic as any).rpc('chat_send_message', {
      p_thread_id: selectedThread.id,
      p_text: message.trim(),
      p_excluded_user_ids: excluded,
    });

    if (error) {
      toast({ title: 'Не удалось отправить сообщение', description: error.message, variant: 'destructive' });
      return;
    }

    setMessage('');
    setExcludedForMessage([]);
    await Promise.all([loadThreads({ silent: true }), loadMessages(selectedThread.id)]);
  };

  useEffect(() => {
    void loadThreads();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedThreadId) return;
    void loadMessages(selectedThreadId);
    void markSelectedThreadRead(selectedThreadId);
    setExcludedForMessage([]);
    setNewMessagesCount(0);
  }, [selectedThreadId]);

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
    if (delta <= 0) {
      previousMessageCountRef.current = currentCount;
      return;
    }

    const atBottomNow = detectIsAtBottom();
    if (atBottomNow) {
      requestAnimationFrame(() => scrollToBottom('smooth'));
    } else {
      setNewMessagesCount((prev) => prev + delta);
    }

    previousMessageCountRef.current = currentCount;
  }, [detectIsAtBottom, scrollToBottom, selectedThread?.id, selectedThreadMessages.length]);

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

    return () => {
      void supabasePublic.removeChannel(channel);
    };
  }, [user?.id, selectedThreadId]);

  if (!user) {
    return (
      <div className="rounded-xl glass border border-border p-6 text-sm text-muted-foreground">
        Необходимо войти в систему, чтобы пользоваться чатом.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl glass border border-border p-6 text-sm text-muted-foreground">
        Загрузка чатов...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4 animate-fade-in">
      {/* Conversations List */}
      <div className="w-96 flex flex-col rounded-xl glass border border-border overflow-hidden">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold">Чаты</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCreateGroupMode(prev => !prev)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Создать группу"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => void openSupportThread()}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title="Написать в техподдержку"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          </div>

          {createGroupMode && (
            <div className="rounded-lg border border-border p-3 space-y-2 bg-secondary/30">
              <input
                value={groupTitle}
                onChange={(event) => setGroupTitle(event.target.value)}
                placeholder="Название группы"
                className="w-full px-3 py-2 rounded-md bg-background border border-border"
              />
              <div className="max-h-32 overflow-y-auto space-y-1">
                {potentialContacts.map((contact) => (
                  <label key={contact.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={groupMemberIds.includes(contact.id)}
                      onChange={(event) => {
                        setGroupMemberIds((prev) =>
                          event.target.checked
                            ? [...prev, contact.id]
                            : prev.filter((id) => id !== contact.id),
                        );
                      }}
                    />
                    <span>{contact.name}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => void createGroup()}
                className="w-full px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
              >
                Создать группу
              </button>
            </div>
          )}

          <div className="rounded-lg border border-border p-2 bg-secondary/20 max-h-32 overflow-y-auto">
            <p className="text-xs text-muted-foreground mb-2">Быстрые контакты</p>
            <div className="space-y-1">
              {potentialContacts.slice(0, 8).map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => void openDirect(contact.id)}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-secondary text-sm"
                >
                  {contact.name} <span className="text-xs text-muted-foreground">({getRoleLabel(contact.role)})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {threadsSorted.map((thread) => {
            const unread = unreadMap[thread.id] ?? 0;

            return (
              <button
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 text-left transition-colors',
                  selectedThreadId === thread.id ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-secondary/50',
                )}
              >
                <div className="relative">
                  <img src={getThreadAvatar(thread)} alt={getThreadTitle(thread)} className="w-12 h-12 rounded-full" />
                  {(thread.kind === 'group' || thread.kind === 'support') && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center">
                      <Users className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">{getThreadTitle(thread)}</p>
                    {unread > 0 && (
                      <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                        {unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{thread.last_message_text ?? 'Нет сообщений'}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col rounded-xl glass border border-border overflow-hidden">
        {!selectedThread ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Выберите чат слева или создайте новый.
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <img src={getThreadAvatar(selectedThread)} alt={getThreadTitle(selectedThread)} className="w-10 h-10 rounded-full" />
              <div>
                <p className="font-medium">{getThreadTitle(selectedThread)}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedThread.kind === 'support'
                    ? 'Канал техподдержки'
                    : selectedThread.kind === 'group'
                      ? `Участников: ${selectedThreadMembers.length}`
                      : 'Личный диалог'}
                </p>
              </div>
            </div>

            {selectedThread.kind === 'group' && (
              <div className="px-4 py-3 border-b border-border bg-secondary/20">
                <p className="text-xs text-muted-foreground mb-2">Отправить всем, кроме:</p>
                <div className="flex flex-wrap gap-3">
                  {selectedThreadMembers
                    .filter((member) => member.user_id !== user.id)
                    .map((member) => (
                      <label key={member.user_id} className="text-xs flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={excludedForMessage.includes(member.user_id)}
                          onChange={(event) => {
                            setExcludedForMessage((prev) =>
                              event.target.checked
                                ? [...prev, member.user_id]
                                : prev.filter((id) => id !== member.user_id),
                            );
                          }}
                        />
                        <span>{getDisplayName(member.user_id)}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="relative flex-1">
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="h-full overflow-y-auto p-4 space-y-4"
              >
              {selectedThreadMessages.map((msg) => {
                const isOwn = msg.sender_user_id === user.id;
                const status = isOwn ? getOwnMessageStatus(msg.id) : null;

                return (
                  <div key={msg.id} className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
                    {!isOwn && (
                      <img src={getAvatar(msg.sender_user_id)} alt={getDisplayName(msg.sender_user_id)} className="w-8 h-8 rounded-full" />
                    )}
                    <div className="max-w-[75%]">
                      {!isOwn && (
                        <div className="flex items-center gap-1.5 mb-0.5 ml-1">
                          <span className="text-xs font-medium">{getDisplayName(msg.sender_user_id)}</span>
                          <UserRoleBadges userId={msg.sender_user_id} showInternal />
                        </div>
                      )}

                      <div
                        className={cn(
                          'p-3 rounded-2xl',
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-secondary text-foreground rounded-bl-sm',
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>
                        <p className={cn('text-[10px] mt-1', isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                          {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          {isOwn && status ? ` • ${status}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {selectedThreadMessages.length === 0 && (
                <div className="text-sm text-muted-foreground">Сообщений пока нет. Напишите первым.</div>
              )}
              </div>

              {!isAtBottom && newMessagesCount > 0 && (
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={() => scrollToBottom('smooth')}
                    className="px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-md hover:bg-primary/90 transition-colors"
                  >
                    К новым сообщениям ({newMessagesCount})
                  </button>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Напишите сообщение..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                />
                <button
                  onClick={() => void sendMessage()}
                  className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
