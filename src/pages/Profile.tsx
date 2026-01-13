import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Diamond, 
  Flame, 
  Clock, 
  Trophy, 
  Target,
  TrendingUp,
  Calendar,
  Award,
  Star,
  Zap,
  Gift
} from 'lucide-react';
import { currentUser, allUsers, checkpoints, achievements as allAchievements } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnimatedBackground from '@/components/dashboard/AnimatedBackground';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Generate mock data for charts
const generateDiamondHistory = () => {
  const data = [];
  let total = 0;
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dailyDiamonds = Math.floor(2000 + Math.random() * 8000);
    total += dailyDiamonds;
    data.push({
      date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      diamonds: dailyDiamonds,
      total: total
    });
  }
  return data;
};

const generateStreamHistory = () => {
  const data = [];
  for (let i = 7; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('ru-RU', { weekday: 'short' }),
      hours: Math.floor(Math.random() * 6) + 1,
      viewers: Math.floor(Math.random() * 500) + 100
    });
  }
  return data;
};

const diamondHistory = generateDiamondHistory();
const streamHistory = generateStreamHistory();

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--nova-gold))', 'hsl(var(--nova-cyan))'];

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get user by ID or show current user
  const user = userId 
    ? allUsers.find(u => u.id === userId) || currentUser 
    : currentUser;

  const levelProgress = (user.stats.currentLevel / user.stats.maxLevel) * 100;
  const xpProgress = (user.xp / user.xpToNextLevel) * 100;

  // Stats for pie chart
  const activityData = [
    { name: 'Стримы', value: user.totalHours },
    { name: 'Задачи', value: user.completedTasks },
    { name: 'Достижения', value: user.achievements * 5 }
  ];

  // User achievements (mock - take first few from allAchievements)
  const userAchievements = allAchievements.filter(a => a.unlocked).slice(0, 6);

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      
      <div className="relative z-10 space-y-6 animate-fade-in">
        {/* Back button */}
        <Link 
          to="/ranking" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к рейтингу</span>
        </Link>

        {/* Profile Header */}
        <div className="glass-card p-6 md:p-8 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-primary opacity-20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-accent opacity-15 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-50 animate-pulse-glow" />
              <img 
                src={user.avatar} 
                alt={user.name}
                className="relative w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 ring-primary/30 object-cover"
              />
              {user.isOnline && (
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-success rounded-full border-4 border-background" />
              )}
              <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-primary rounded-full text-xs font-bold text-white">
                #{user.stats.rank}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
                  {user.isOnline && (
                    <Badge variant="outline" className="border-success text-success">
                      <span className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse" />
                      В сети
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {user.role === 'streamer' ? 'Стример' : user.role === 'curator' ? 'Куратор' : 'Админ'} • 
                  Присоединился {new Date(user.joinedDate).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Diamond className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{user.stats.diamondsTotal.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Всего алмазов</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{user.streakDays}</p>
                    <p className="text-xs text-muted-foreground">Дней подряд</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-nova-gold/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-nova-gold" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{user.achievements}</p>
                    <p className="text-xs text-muted-foreground">Достижений</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-nova-cyan/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-nova-cyan" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{user.totalHours}ч</p>
                    <p className="text-xs text-muted-foreground">В эфире</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Level Badge */}
            <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
              <div className="text-4xl font-bold text-gradient">{user.stats.currentLevel}</div>
              <div className="text-xs text-muted-foreground font-medium">УРОВЕНЬ</div>
              <Progress value={levelProgress} className="w-24 h-2" />
              <div className="text-xs text-muted-foreground">{user.stats.currentLevel}/{user.stats.maxLevel}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card p-1 w-full md:w-auto grid grid-cols-3 md:inline-flex">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Обзор</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Статистика</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Достижения</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Diamond Progress & Checkpoints */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Diamond Chart */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Diamond className="w-5 h-5 text-primary" />
                    Накопление алмазов
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={diamondHistory}>
                        <defs>
                          <linearGradient id="diamondGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={10}
                          tickLine={false}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                          }}
                          formatter={(value: number) => [`${value.toLocaleString()} 💎`, 'Алмазы']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="diamonds" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          fill="url(#diamondGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Checkpoints Progress */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-accent" />
                    Чекпоинты подарков
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {checkpoints.map((checkpoint, index) => {
                    const isReached = user.stats.diamondsTotal >= checkpoint.diamondsRequired;
                    const progress = Math.min(100, (user.stats.diamondsTotal / checkpoint.diamondsRequired) * 100);
                    
                    return (
                      <div 
                        key={checkpoint.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isReached 
                            ? 'bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30' 
                            : 'bg-secondary/30 border-border/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{checkpoint.rewardIcon}</span>
                            <div>
                              <p className="font-semibold">{checkpoint.rewardName}</p>
                              <p className="text-xs text-muted-foreground">
                                {checkpoint.diamondsRequired.toLocaleString()} алмазов
                              </p>
                            </div>
                          </div>
                          {isReached ? (
                            <Badge className="bg-gradient-primary text-white">
                              <Star className="w-3 h-3 mr-1" /> Достигнуто
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {Math.floor(progress)}%
                            </span>
                          )}
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Stream History */}
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-nova-cyan" />
                  Активность за неделю
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={streamHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px'
                        }}
                        formatter={(value: number, name: string) => [
                          name === 'hours' ? `${value} ч` : `${value} зрителей`,
                          name === 'hours' ? 'Часы стрима' : 'Пик зрителей'
                        ]}
                      />
                      <Bar 
                        dataKey="hours" 
                        fill="hsl(var(--primary))" 
                        radius={[8, 8, 0, 0]}
                        name="hours"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat Cards */}
              <Card className="glass-card border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Diamond className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{user.stats.diamondsToday.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Сегодня</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-card border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                      <TrendingUp className="w-7 h-7 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{user.stats.diamonds30Days.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">За 30 дней</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-nova-gold/10 flex items-center justify-center">
                      <Target className="w-7 h-7 text-nova-gold" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{user.completedTasks}</p>
                      <p className="text-sm text-muted-foreground">Заданий</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-nova-cyan/10 flex items-center justify-center">
                      <Zap className="w-7 h-7 text-nova-cyan" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{user.xp.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Опыта XP</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle>Распределение активности</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {activityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {activityData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* XP Progress */}
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle>Прогресс уровня</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
                    <div className="text-5xl font-bold text-gradient mb-2">{user.level}</div>
                    <div className="text-muted-foreground">Текущий уровень</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">До следующего уровня</span>
                      <span className="font-semibold">{user.xp} / {user.xpToNextLevel} XP</span>
                    </div>
                    <Progress value={xpProgress} className="h-3" />
                    <p className="text-xs text-muted-foreground text-center">
                      Осталось {(user.xpToNextLevel - user.xp).toLocaleString()} XP
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-secondary/50 text-center">
                      <p className="text-lg font-bold">{Math.floor(user.xp / user.completedTasks || 0)}</p>
                      <p className="text-xs text-muted-foreground">XP за задачу</p>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary/50 text-center">
                      <p className="text-lg font-bold">{Math.ceil((user.xpToNextLevel - user.xp) / 50)}</p>
                      <p className="text-xs text-muted-foreground">Заданий до уровня</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Достижения</h2>
                <p className="text-muted-foreground">
                  Разблокировано {user.achievements} из {allAchievements.length}
                </p>
              </div>
              <Link 
                to="/achievements" 
                className="text-primary hover:underline text-sm font-medium"
              >
                Все достижения →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userAchievements.map((achievement) => (
                <Card 
                  key={achievement.id} 
                  className={`glass-card border-0 hover-lift ${
                    achievement.rarity === 'legendary' ? 'ring-2 ring-nova-gold/50' :
                    achievement.rarity === 'epic' ? 'ring-2 ring-primary/50' : ''
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`text-4xl p-3 rounded-xl ${
                        achievement.rarity === 'legendary' ? 'bg-nova-gold/20' :
                        achievement.rarity === 'epic' ? 'bg-primary/20' :
                        achievement.rarity === 'rare' ? 'bg-nova-cyan/20' :
                        'bg-secondary/50'
                      }`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{achievement.title}</h3>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              achievement.rarity === 'legendary' ? 'border-nova-gold text-nova-gold' :
                              achievement.rarity === 'epic' ? 'border-primary text-primary' :
                              achievement.rarity === 'rare' ? 'border-nova-cyan text-nova-cyan' :
                              'border-muted-foreground'
                            }`}
                          >
                            {achievement.rarity === 'legendary' ? 'Легендарное' :
                             achievement.rarity === 'epic' ? 'Эпическое' :
                             achievement.rarity === 'rare' ? 'Редкое' : 'Обычное'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        {achievement.unlockedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Получено: {new Date(achievement.unlockedAt).toLocaleDateString('ru-RU')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
