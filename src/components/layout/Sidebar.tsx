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
  Sparkles, 
  Settings,
  Moon,
  Sun,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { currentUser } from '@/data/mockData';
import logo from '@/assets/novaboost-logo.png';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
  isNew?: boolean;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: TrendingUp, label: 'Прогресс', href: '/progress' },
  { icon: Trophy, label: 'Достижения', href: '/achievements' },
  { icon: ListTodo, label: 'Задачи', href: '/tasks', badge: 3 },
  { icon: GraduationCap, label: 'Обучение', href: '/learning' },
  { icon: BookOpen, label: 'Статьи', href: '/articles' },
  { icon: MessageSquare, label: 'Чат', href: '/chat', badge: 2 },
  { icon: Sparkles, label: 'AI Наставник', href: '/ai-coach', isNew: true },
];

const adminNavItems: NavItem[] = [
  { icon: Settings, label: 'Админ панель', href: '/admin' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const xpPercent = (currentUser.xp / currentUser.xpToNextLevel) * 100;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex flex-col bg-sidebar/80 backdrop-blur-xl border-r border-border/50">
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
        <div className="glass-card p-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-full blur-md opacity-40" />
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="relative w-11 h-11 rounded-full ring-2 ring-primary/30 object-cover"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success border-2 border-sidebar" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser.role === 'streamer' ? 'Стример' : currentUser.role}</p>
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
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.href}
              to={item.href}
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
              
              {item.badge && (
                <span className={cn(
                  "flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full",
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "bg-accent text-accent-foreground"
                )}>
                  {item.badge}
                </span>
              )}
              
              {item.isNew && !item.badge && (
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

        {currentUser.role === 'admin' && (
          <>
            <div className="h-px bg-border my-3" />
            {adminNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
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
        <button className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200">
          <LogOut className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span className="flex-1 text-left">Выйти</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
