import React, { useState } from 'react';
import { allUsers, streamEvents } from '@/data/mockData';
import { Users, Activity, Settings, Shield, Search, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'events' | 'settings'>('users');

  const tabs = [
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'events', label: 'События', icon: Activity },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  const roleStyles = {
    streamer: 'bg-primary/20 text-primary',
    curator: 'bg-accent/20 text-accent',
    admin: 'bg-nova-purple/20 text-nova-purple',
  };

  const roleLabels = {
    streamer: 'Стример',
    curator: 'Куратор',
    admin: 'Админ',
  };

  const eventTypeStyles = {
    stream_start: 'bg-success/20 text-success',
    stream_end: 'bg-muted text-muted-foreground',
    milestone: 'bg-accent/20 text-accent',
    achievement: 'bg-nova-purple/20 text-nova-purple',
  };

  const eventTypeLabels = {
    stream_start: 'Начало стрима',
    stream_end: 'Конец стрима',
    milestone: 'Milestone',
    achievement: 'Достижение',
  };

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
          <p className="text-sm text-muted-foreground">Кураторов</p>
          <p className="text-2xl font-bold">{allUsers.filter(u => u.role === 'curator').length}</p>
        </div>
        <div className="p-4 rounded-xl glass border border-border">
          <p className="text-sm text-muted-foreground">Активных сегодня</p>
          <p className="text-2xl font-bold text-success">3</p>
        </div>
        <div className="p-4 rounded-xl glass border border-border">
          <p className="text-sm text-muted-foreground">События за сутки</p>
          <p className="text-2xl font-bold text-primary">{streamEvents.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-secondary w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
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
      {activeTab === 'users' && (
        <div className="rounded-xl glass border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск пользователей..."
                className="pl-9 pr-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none w-64"
              />
            </div>
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Добавить пользователя
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Пользователь</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Роль</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Уровень</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Streak</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Часов</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
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
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      roleStyles[user.role]
                    )}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{user.level}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      🔥 {user.streakDays}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">{user.totalHours}ч</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="rounded-xl glass border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Последние события</h3>
          </div>
          <div className="divide-y divide-border">
            {streamEvents.map((event) => (
              <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-full",
                      eventTypeStyles[event.type]
                    )}>
                      {eventTypeLabels[event.type]}
                    </span>
                    <span className="text-sm font-medium">{event.streamerName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(event.timestamp).toLocaleString('ru-RU', { 
                    day: 'numeric', 
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="rounded-xl glass border border-border p-6">
          <h3 className="font-semibold mb-4">Настройки системы</h3>
          <p className="text-muted-foreground">Раздел настроек находится в разработке...</p>
        </div>
      )}
    </div>
  );
};

export default Admin;
