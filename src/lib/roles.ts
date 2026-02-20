export const ROLE_LABELS: Record<string, string> = {
  owner: 'Владелец',
  admin: 'Админ',
  developer: 'Разработчик',
  senior_curator: 'Старший куратор',
  curator: 'Куратор',
  manager: 'Менеджер',
  moderator: 'Модератор',
  support: 'Поддержка',
  investor: 'Инвестор',
  streamer: 'Стример',
};

export const getRoleLabel = (role?: string | null): string => {
  if (!role) {
    return 'Участник';
  }

  return ROLE_LABELS[role] ?? role;
};

export const canAccessAdminSettings = (role?: string | null): boolean => {
  return role === 'owner' || role === 'admin';
};
