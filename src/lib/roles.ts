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
  agency_streamer: 'Стример Agency',
  streamer: 'Стример',
  // Extended slugs from the roles table
  system_owner: 'System Owner',
  architect: 'Architect',
  engineer: 'Engineer',
  agency_manager: 'Менеджер агентства',
  head_mentor: 'Главный наставник',
  mentor: 'Наставник',
  analyst: 'Аналитик',
  board: 'Board',
  investor_pro: 'Инвестор Pro',
  investor_viewer: 'Инвестор Viewer',
  nova_creator: 'Nova Creator',
  rising_star: 'Rising Star',
  verified: 'Verified',
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
  const normalized = String(role ?? '').toLowerCase();
  return (
    normalized === 'owner' ||
    normalized === 'admin' ||
    normalized === 'system_owner' ||
    normalized === 'architect' ||
    normalized === 'support' ||
    isSuperAdminEmail(email)
  );
};

const PRODUCT_STAFF_ROLES = new Set([
  'owner',
  'admin',
  'support',
  'developer',
  'senior_curator',
  'curator',
  'manager',
  'moderator',
  'architect',
  'system_owner',
  'engineer',
  'agency_manager',
  'head_mentor',
  'mentor',
  'analyst',
  'board',
  'investor_pro',
  'investor_viewer',
  'investor',
]);

// Public-tier roles that can access the streamer product
const PRODUCT_USER_ROLES = new Set(['streamer', 'agency_streamer', 'nova_creator', 'rising_star', 'verified']);

export const canAccessProduct = (role?: string | null, email?: string | null): boolean => {
  if (isSuperAdminEmail(email)) {
    return true;
  }

  const normalizedRole = String(role ?? '').toLowerCase();
  if (!normalizedRole) {
    return false;
  }

  return PRODUCT_USER_ROLES.has(normalizedRole) || PRODUCT_STAFF_ROLES.has(normalizedRole);
};

export const isAgencyMember = (role?: string | null): boolean => {
  const normalized = String(role ?? '').toLowerCase();
  return normalized === 'agency_streamer' || PRODUCT_STAFF_ROLES.has(normalized);
};
