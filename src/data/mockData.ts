export type UserRole = 'streamer' | 'curator' | 'admin';

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streakDays: number;
  joinedDate: string;
  totalHours: number;
  completedTasks: number;
  achievements: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'challenge';
  xpReward: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
  deadline?: string;
}

export interface PathStep {
  id: string;
  title: string;
  description: string;
  status: 'locked' | 'in_progress' | 'completed';
  xpReward: number;
  order: number;
}

export interface GrowthPath {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  steps: PathStep[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  completed: boolean;
  locked: boolean;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  featured: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export interface StreamEvent {
  id: string;
  streamerId: string;
  streamerName: string;
  type: 'stream_start' | 'stream_end' | 'milestone' | 'achievement';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Current user (streamer)
export const currentUser: User = {
  id: '1',
  name: 'Алексей Стример',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  role: 'streamer',
  level: 12,
  xp: 2450,
  xpToNextLevel: 3000,
  streakDays: 7,
  joinedDate: '2024-08-15',
  totalHours: 156,
  completedTasks: 48,
  achievements: 15,
};

// All users for admin
export const allUsers: User[] = [
  currentUser,
  {
    id: '2',
    name: 'Мария Геймер',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    role: 'streamer',
    level: 8,
    xp: 1200,
    xpToNextLevel: 2000,
    streakDays: 3,
    joinedDate: '2024-09-01',
    totalHours: 89,
    completedTasks: 24,
    achievements: 8,
  },
  {
    id: '3',
    name: 'Дмитрий Плей',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dmitry',
    role: 'streamer',
    level: 15,
    xp: 4200,
    xpToNextLevel: 5000,
    streakDays: 14,
    joinedDate: '2024-06-20',
    totalHours: 234,
    completedTasks: 72,
    achievements: 22,
  },
  {
    id: '4',
    name: 'Анна Куратор',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
    role: 'curator',
    level: 20,
    xp: 8500,
    xpToNextLevel: 10000,
    streakDays: 30,
    joinedDate: '2024-03-10',
    totalHours: 450,
    completedTasks: 156,
    achievements: 35,
  },
];

export const achievements: Achievement[] = [
  {
    id: '1',
    title: 'Первый стрим',
    description: 'Провести свой первый стрим',
    icon: '🎬',
    rarity: 'common',
    unlocked: true,
    unlockedAt: '2024-08-16',
  },
  {
    id: '2',
    title: 'Неделя огня',
    description: '7 дней подряд выходить в эфир',
    icon: '🔥',
    rarity: 'rare',
    unlocked: true,
    unlockedAt: '2024-09-02',
  },
  {
    id: '3',
    title: 'Сотня часов',
    description: 'Провести 100 часов в эфире',
    icon: '⏰',
    rarity: 'epic',
    unlocked: true,
    unlockedAt: '2024-10-15',
  },
  {
    id: '4',
    title: 'Мастер слова',
    description: 'Пройти все уроки по общению',
    icon: '🎤',
    rarity: 'rare',
    unlocked: false,
    progress: 7,
    maxProgress: 10,
  },
  {
    id: '5',
    title: 'Легенда стрима',
    description: 'Достичь 50 уровня',
    icon: '👑',
    rarity: 'legendary',
    unlocked: false,
    progress: 12,
    maxProgress: 50,
  },
  {
    id: '6',
    title: 'Командный игрок',
    description: 'Провести 10 коллабораций',
    icon: '🤝',
    rarity: 'epic',
    unlocked: false,
    progress: 3,
    maxProgress: 10,
  },
];

export const tasks: Task[] = [
  {
    id: '1',
    title: 'Провести стрим',
    description: 'Провести стрим минимум 2 часа',
    type: 'daily',
    xpReward: 100,
    progress: 0,
    maxProgress: 1,
    completed: false,
  },
  {
    id: '2',
    title: 'Взаимодействие с чатом',
    description: 'Ответить на 50 сообщений в чате',
    type: 'daily',
    xpReward: 50,
    progress: 32,
    maxProgress: 50,
    completed: false,
  },
  {
    id: '3',
    title: 'Пройти урок',
    description: 'Пройти любой урок из раздела обучения',
    type: 'daily',
    xpReward: 75,
    progress: 1,
    maxProgress: 1,
    completed: true,
  },
  {
    id: '4',
    title: 'Недельный марафон',
    description: 'Провести 20 часов стримов за неделю',
    type: 'weekly',
    xpReward: 500,
    progress: 14,
    maxProgress: 20,
    completed: false,
    deadline: '2025-01-12',
  },
  {
    id: '5',
    title: 'Челлендж: Новый формат',
    description: 'Попробовать новый формат контента',
    type: 'challenge',
    xpReward: 300,
    progress: 0,
    maxProgress: 1,
    completed: false,
    deadline: '2025-01-15',
  },
];

export const growthPaths: GrowthPath[] = [
  {
    id: '1',
    title: 'Основы стриминга',
    description: 'Базовые навыки для начинающего стримера',
    icon: '🎮',
    progress: 100,
    steps: [
      { id: '1-1', title: 'Настройка OBS', description: 'Базовая настройка стриминг софта', status: 'completed', xpReward: 100, order: 1 },
      { id: '1-2', title: 'Первый эфир', description: 'Провести первый тестовый стрим', status: 'completed', xpReward: 150, order: 2 },
      { id: '1-3', title: 'Работа с чатом', description: 'Научиться взаимодействовать с аудиторией', status: 'completed', xpReward: 200, order: 3 },
    ],
  },
  {
    id: '2',
    title: 'Развитие канала',
    description: 'Стратегии роста и привлечения аудитории',
    icon: '📈',
    progress: 60,
    steps: [
      { id: '2-1', title: 'Брендинг', description: 'Создание уникального стиля', status: 'completed', xpReward: 200, order: 1 },
      { id: '2-2', title: 'Расписание', description: 'Составление эффективного расписания', status: 'completed', xpReward: 150, order: 2 },
      { id: '2-3', title: 'Социальные сети', description: 'Продвижение в соц. сетях', status: 'in_progress', xpReward: 250, order: 3 },
      { id: '2-4', title: 'Коллаборации', description: 'Работа с другими стримерами', status: 'locked', xpReward: 300, order: 4 },
      { id: '2-5', title: 'Монетизация', description: 'Способы заработка', status: 'locked', xpReward: 400, order: 5 },
    ],
  },
  {
    id: '3',
    title: 'Мастерство контента',
    description: 'Продвинутые техники создания контента',
    icon: '🎬',
    progress: 20,
    steps: [
      { id: '3-1', title: 'Сторителлинг', description: 'Искусство рассказывания историй', status: 'completed', xpReward: 300, order: 1 },
      { id: '3-2', title: 'Импровизация', description: 'Работа без сценария', status: 'in_progress', xpReward: 350, order: 2 },
      { id: '3-3', title: 'Интерактив', description: 'Создание интерактивного контента', status: 'locked', xpReward: 400, order: 3 },
      { id: '3-4', title: 'Хайлайты', description: 'Создание лучших моментов', status: 'locked', xpReward: 350, order: 4 },
      { id: '3-5', title: 'Мультиплатформа', description: 'Работа на нескольких площадках', status: 'locked', xpReward: 500, order: 5 },
    ],
  },
];

export const lessons: Lesson[] = [
  { id: '1', title: 'Введение в стриминг', description: 'Основы работы стримера', duration: '15 мин', category: 'Основы', completed: true, locked: false },
  { id: '2', title: 'Настройка оборудования', description: 'Камера, микрофон, освещение', duration: '25 мин', category: 'Основы', completed: true, locked: false },
  { id: '3', title: 'Работа с OBS Studio', description: 'Полный гайд по OBS', duration: '40 мин', category: 'Технологии', completed: true, locked: false },
  { id: '4', title: 'Психология зрителя', description: 'Понимание вашей аудитории', duration: '30 мин', category: 'Коммуникация', completed: false, locked: false },
  { id: '5', title: 'Монетизация канала', description: 'Способы заработка на стримах', duration: '35 мин', category: 'Бизнес', completed: false, locked: false },
  { id: '6', title: 'Продвинутый нетворкинг', description: 'Связи в индустрии', duration: '45 мин', category: 'Бизнес', completed: false, locked: true },
];

export const articles: Article[] = [
  { id: '1', title: 'Как выбрать идеальную нишу для стриминга', excerpt: 'Разбираем популярные направления и находим вашу уникальность', category: 'Стратегия', readTime: '5 мин', date: '2025-01-08', featured: true },
  { id: '2', title: '10 ошибок начинающих стримеров', excerpt: 'Избегайте типичных ловушек на старте карьеры', category: 'Советы', readTime: '7 мин', date: '2025-01-05', featured: false },
  { id: '3', title: 'Тренды стриминга 2025', excerpt: 'Что будет популярно в новом году', category: 'Тренды', readTime: '8 мин', date: '2025-01-03', featured: true },
  { id: '4', title: 'Как не выгореть на стримах', excerpt: 'Баланс между работой и отдыхом', category: 'Здоровье', readTime: '6 мин', date: '2024-12-28', featured: false },
  { id: '5', title: 'Создание комьюнити с нуля', excerpt: 'Шаг за шагом к преданной аудитории', category: 'Комьюнити', readTime: '10 мин', date: '2024-12-20', featured: false },
];

export const chatMessages: ChatMessage[] = [
  { id: '1', senderId: '4', senderName: 'Анна Куратор', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna', content: 'Привет! Как прошёл вчерашний стрим?', timestamp: '2025-01-09T10:30:00', isOwn: false },
  { id: '2', senderId: '1', senderName: 'Алексей Стример', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', content: 'Отлично! Было много зрителей, попробовал новый формат', timestamp: '2025-01-09T10:32:00', isOwn: true },
  { id: '3', senderId: '4', senderName: 'Анна Куратор', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna', content: 'Супер! Я видела, что метрики выросли. Давай обсудим следующие шаги?', timestamp: '2025-01-09T10:35:00', isOwn: false },
  { id: '4', senderId: '1', senderName: 'Алексей Стример', senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', content: 'Да, конечно! Когда удобно?', timestamp: '2025-01-09T10:36:00', isOwn: true },
];

export const streamEvents: StreamEvent[] = [
  { id: '1', streamerId: '1', streamerName: 'Алексей Стример', type: 'stream_end', description: 'Завершил стрим длительностью 4 часа', timestamp: '2025-01-08T22:00:00' },
  { id: '2', streamerId: '2', streamerName: 'Мария Геймер', type: 'milestone', description: 'Достигла 1000 подписчиков', timestamp: '2025-01-08T20:30:00' },
  { id: '3', streamerId: '3', streamerName: 'Дмитрий Плей', type: 'achievement', description: 'Получил достижение "Марафонец"', timestamp: '2025-01-08T19:00:00' },
  { id: '4', streamerId: '1', streamerName: 'Алексей Стример', type: 'stream_start', description: 'Начал стрим', timestamp: '2025-01-08T18:00:00' },
  { id: '5', streamerId: '2', streamerName: 'Мария Геймер', type: 'stream_end', description: 'Завершила стрим', timestamp: '2025-01-08T16:00:00' },
];
