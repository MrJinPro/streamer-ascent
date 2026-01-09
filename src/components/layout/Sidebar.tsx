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
  Bot, 
  Settings,
  Moon,
  Sun,
  LogOut
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
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: TrendingUp, label: 'Progress', href: '/progress' },
  { icon: Trophy, label: 'Achievements', href: '/achievements' },
  { icon: ListTodo, label: 'Tasks', href: '/tasks' },
  { icon: GraduationCap, label: 'Learning', href: '/learning' },
  { icon: BookOpen, label: 'Articles', href: '/articles' },
  { icon: MessageSquare, label: 'Chat', href: '/chat', badge: 2 },
  { icon: Bot, label: 'AI Coach', href: '/ai-coach' },
];

const adminNavItems: NavItem[] = [
  { icon: Settings, label: 'Admin', href: '/admin' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <img src={logo} alt="NovaBoost" className="w-10 h-10 object-contain" />
        <div>
          <h1 className="font-display font-bold text-lg text-foreground">NovaBoost</h1>
          <p className="text-xs text-muted-foreground">Tools</p>
        </div>
      </div>

      {/* User Card */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-10 h-10 rounded-full ring-2 ring-primary/30"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{currentUser.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Lvl {currentUser.level}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-cosmic rounded-full transition-all duration-500"
                  style={{ width: `${(currentUser.xp / currentUser.xpToNextLevel) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-primary text-primary-foreground shadow-glow" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-accent text-accent-foreground">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        {currentUser.role === 'admin' && (
          <>
            <div className="h-px bg-border my-4" />
            {adminNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-glow" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
