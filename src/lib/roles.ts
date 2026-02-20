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

const SUPER_ADMIN_EMAILS = ['dev@mrjin.pro'];

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) {
    return false;
  }

  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
};

export const getRoleLabel = (role?: string | null): string => {
  if (!role) {
    return 'Участник';
  }

  return ROLE_LABELS[role] ?? role;
};

export const canAccessAdminSettings = (role?: string | null, email?: string | null): boolean => {
  return role === 'owner' || role === 'admin' || isSuperAdminEmail(email);
};
