import { useState, useMemo } from 'react';
import { 
  Trophy, Crown, Medal, Star, Flame, TrendingUp, TrendingDown, 
  Minus, Diamond, Clock, Users, Heart, ChevronUp, ChevronDown,
  Calendar, Filter, Search, Sparkles, Zap
} from 'lucide-react';
import { allUsers, currentUser, formatDiamonds, User } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Period = 'today' | 'week' | 'month' | 'all';
type SortBy = 'diamonds' | 'level' | 'streak' | 'hours';

const getLeaderboardByPeriod = (period: Period): User[] => {
  const streamers = allUsers.filter(user => user.role === 'streamer');
  
  switch (period) {
    case 'today':
      return [...streamers].sort((a, b) => b.stats.diamondsToday - a.stats.diamondsToday);
    case 'week':
      return [...streamers].sort((a, b) => (b.stats.diamonds30Days / 4) - (a.stats.diamonds30Days / 4));
    case 'month':
      return [...streamers].sort((a, b) => b.stats.diamonds30Days - a.stats.diamonds30Days);
    case 'all':
    default:
      return [...streamers].sort((a, b) => b.stats.diamondsTotal - a.stats.diamondsTotal);
  }
};

const Ranking = () => {
  const [period, setPeriod] = useState<Period>('month');
  const [sortBy, setSortBy] = useState<SortBy>('diamonds');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const leaderboard = useMemo(() => {
    let users = getLeaderboardByPeriod(period);
    
    if (searchQuery) {
      users = users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (sortBy !== 'diamonds') {
      users = [...users].sort((a, b) => {
        switch (sortBy) {
          case 'level':
            return b.level - a.level;
          case 'streak':
            return b.streakDays - a.streakDays;
          case 'hours':
            return b.totalHours - a.totalHours;
          default:
            return 0;
        }
      });
    }
    
    return users;
  }, [period, sortBy, searchQuery]);

  const getDiamondsForPeriod = (user: User) => {
    switch (period) {
      case 'today':
        return user.stats.diamondsToday;
      case 'week':
        return Math.floor(user.stats.diamonds30Days / 4);
      case 'month':
        return user.stats.diamonds30Days;
      case 'all':
      default:
        return user.stats.diamondsTotal;
    }
  };

  const getPositionChange = (user: User) => {
    // Simulated position change based on rank
    const baseChange = Math.floor(Math.random() * 5) - 2;
    return baseChange;
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-gradient-to-r from-yellow-500/30 via-amber-400/20 to-yellow-500/30',
          border: 'border-yellow-500/50',
          glow: 'shadow-[0_0_30px_rgba(234,179,8,0.3)]',
          badge: 'bg-gradient-to-r from-yellow-400 to-amber-500',
          icon: Crown,
          iconColor: 'text-yellow-400'
        };
      case 2:
        return {
          bg: 'bg-gradient-to-r from-slate-400/20 via-gray-300/10 to-slate-400/20',
          border: 'border-slate-400/50',
          glow: 'shadow-[0_0_20px_rgba(148,163,184,0.2)]',
          badge: 'bg-gradient-to-r from-slate-300 to-gray-400',
          icon: Medal,
          iconColor: 'text-slate-300'
        };
      case 3:
        return {
          bg: 'bg-gradient-to-r from-orange-600/20 via-amber-600/10 to-orange-600/20',
          border: 'border-orange-600/50',
          glow: 'shadow-[0_0_20px_rgba(234,88,12,0.2)]',
          badge: 'bg-gradient-to-r from-orange-500 to-amber-600',
          icon: Medal,
          iconColor: 'text-orange-400'
        };
      default:
        return {
          bg: 'bg-card/50',
          border: 'border-border/50',
          glow: '',
          badge: 'bg-muted',
          icon: Star,
          iconColor: 'text-muted-foreground'
        };
    }
  };

  const currentUserRank = useMemo(() => {
    return leaderboard.findIndex(u => u.id === currentUser.id) + 1;
  }, [leaderboard]);

  const openUserHistory = (user: User) => {
    setSelectedUser(user);
    setShowHistoryDialog(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
        
        {/* Floating orbs */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full blur-3xl opacity-20 animate-pulse"
            style={{
              width: `${150 + i * 50}px`,
              height: `${150 + i * 50}px`,
              background: i % 2 === 0 
                ? 'radial-gradient(circle, hsl(var(--primary)), transparent)'
                : 'radial-gradient(circle, hsl(var(--chart-1)), transparent)',
              left: `${10 + i * 20}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${4 + i}s`
            }}
          />
        ))}

        {/* Sparkle particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute w-1 h-1 bg-primary/60 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Trophy className="h-8 w-8 md:h-10 md:w-10 text-yellow-500 animate-pulse" />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-primary to-purple-500 bg-clip-text text-transparent">
              Рейтинг Агентства
            </h1>
            <Trophy className="h-8 w-8 md:h-10 md:w-10 text-yellow-500 animate-pulse" />
          </div>
          <p className="text-muted-foreground">
            Соревнуйся и становись лучшим стримером!
          </p>
        </div>

        {/* Current User Position Card */}
        {currentUserRank > 0 && (
          <Card className="p-4 md:p-6 bg-gradient-to-r from-primary/20 via-primary/10 to-purple-500/20 border-primary/30 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 p-1">
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    #{currentUserRank}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{currentUser.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Уровень {currentUser.level}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      {currentUser.streakDays} дней
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-2xl md:text-3xl font-bold text-primary">
                    <Diamond className="h-6 w-6" />
                    {formatDiamonds(getDiamondsForPeriod(currentUser))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {period === 'today' && 'Сегодня'}
                    {period === 'week' && 'За неделю'}
                    {period === 'month' && 'За месяц'}
                    {period === 'all' && 'Всего'}
                  </p>
                </div>
                
                {getPositionChange(currentUser) !== 0 && (
                  <div className={`flex items-center gap-1 ${
                    getPositionChange(currentUser) > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {getPositionChange(currentUser) > 0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    <span className="font-bold">{Math.abs(getPositionChange(currentUser))}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-4 w-full md:w-auto">
              <TabsTrigger value="today" className="text-xs md:text-sm">
                <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Сегодня
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs md:text-sm">
                Неделя
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs md:text-sm">
                Месяц
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs md:text-sm">
                Всё время
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Поиск стримера..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diamonds">Алмазы</SelectItem>
                <SelectItem value="level">Уровень</SelectItem>
                <SelectItem value="streak">Стрик</SelectItem>
                <SelectItem value="followers">Подписчики</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
          {leaderboard.slice(0, 3).map((user, index) => {
            const rank = index + 1;
            const style = getRankStyle(rank);
            const RankIcon = style.icon;
            const podiumOrder = rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3';
            const podiumHeight = rank === 1 ? 'pt-0' : rank === 2 ? 'pt-8' : 'pt-12';
            
            return (
              <div 
                key={user.id} 
                className={`${podiumOrder} ${podiumHeight} flex flex-col items-center`}
              >
                <Card 
                  className={`w-full p-3 md:p-4 ${style.bg} border ${style.border} ${style.glow} 
                    cursor-pointer hover:scale-105 transition-all duration-300`}
                  onClick={() => openUserHistory(user)}
                >
                  <div className="flex flex-col items-center gap-2 md:gap-3">
                    <div className="relative">
                      <div className={`w-14 h-14 md:w-20 md:h-20 rounded-full p-0.5 ${style.badge}`}>
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <div className={`absolute -top-2 -right-2 w-6 h-6 md:w-8 md:h-8 rounded-full ${style.badge} 
                        flex items-center justify-center shadow-lg`}>
                        <RankIcon className={`h-3 w-3 md:h-4 md:w-4 ${rank <= 3 ? 'text-white' : ''}`} />
                      </div>
                      {user.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    
                    <div className="text-center">
                      <h3 className="font-bold text-xs md:text-base truncate max-w-[80px] md:max-w-[120px]">
                        {user.name}
                      </h3>
                      <div className="flex items-center justify-center gap-1 text-primary">
                        <Diamond className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="font-bold text-xs md:text-sm">
                          {formatDiamonds(getDiamondsForPeriod(user))}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground">
                      <span>Lv.{user.level}</span>
                      <span className="flex items-center gap-0.5">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {user.streakDays}
                      </span>
                    </div>
                  </div>
                </Card>
                
                {/* Podium base */}
                <div className={`w-full h-8 md:h-12 mt-2 rounded-t-lg ${style.badge} 
                  flex items-center justify-center text-white font-bold text-lg md:text-2xl`}>
                  #{rank}
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Leaderboard */}
        <Card className="overflow-hidden bg-card/80 backdrop-blur">
          <div className="p-4 border-b border-border/50">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Полный рейтинг
              <Badge variant="secondary" className="ml-2">
                {leaderboard.length} стримеров
              </Badge>
            </h2>
          </div>
          
          <div className="divide-y divide-border/30">
            {leaderboard.slice(3).map((user, index) => {
              const rank = index + 4;
              const positionChange = getPositionChange(user);
              const isCurrentUser = user.id === currentUser.id;
              
              return (
                <div 
                  key={user.id}
                  className={`p-3 md:p-4 flex items-center gap-3 md:gap-4 hover:bg-accent/50 
                    transition-colors cursor-pointer ${isCurrentUser ? 'bg-primary/10' : ''}`}
                  onClick={() => openUserHistory(user)}
                >
                  {/* Rank */}
                  <div className="w-8 md:w-12 text-center">
                    <span className={`font-bold text-lg ${rank <= 10 ? 'text-primary' : 'text-muted-foreground'}`}>
                      #{rank}
                    </span>
                  </div>
                  
                  {/* Position change */}
                  <div className="w-8 flex justify-center">
                    {positionChange > 0 ? (
                      <div className="flex items-center text-green-500">
                        <ChevronUp className="h-4 w-4" />
                        <span className="text-xs">{positionChange}</span>
                      </div>
                    ) : positionChange < 0 ? (
                      <div className="flex items-center text-red-500">
                        <ChevronDown className="h-4 w-4" />
                        <span className="text-xs">{Math.abs(positionChange)}</span>
                      </div>
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Avatar */}
                  <div className="relative">
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                    />
                    {user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                        {user.name}
                      </h3>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-[10px]">Вы</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Lv.{user.level}</span>
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {user.streakDays} дней
                      </span>
                      <span className="hidden md:flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {formatDiamonds(user.completedTasks)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Diamonds */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <Diamond className="h-4 w-4" />
                      {formatDiamonds(getDiamondsForPeriod(user))}
                    </div>
                    <div className="text-xs text-muted-foreground hidden md:block">
                      {formatDiamonds(user.totalHours)}ч стримов
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="p-4 bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-yellow-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-500/20">
                <Crown className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Лидер месяца</p>
                <p className="font-bold truncate">{leaderboard[0]?.name || '-'}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-green-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Онлайн сейчас</p>
                <p className="font-bold">{leaderboard.filter(u => u.isOnline).length} стримеров</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/20">
                <Diamond className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Всего алмазов</p>
                <p className="font-bold">
                  {formatDiamonds(leaderboard.reduce((sum, u) => sum + u.stats.diamondsTotal, 0))}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/20">
                <Zap className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Средний уровень</p>
                <p className="font-bold">
                  {Math.round(leaderboard.reduce((sum, u) => sum + u.level, 0) / leaderboard.length)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* User History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedUser && (
                <>
                  <img 
                    src={selectedUser.avatar} 
                    alt={selectedUser.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <span>{selectedUser.name}</span>
                  <Badge variant="outline">Lv.{selectedUser.level}</Badge>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-primary/10 text-center">
                  <Diamond className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="font-bold">{formatDiamonds(selectedUser.stats.diamondsTotal)}</p>
                  <p className="text-xs text-muted-foreground">Всего алмазов</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10 text-center">
                  <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                  <p className="font-bold">{selectedUser.streakDays} дней</p>
                  <p className="text-xs text-muted-foreground">Стрик</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <p className="font-bold">{selectedUser.totalHours}ч</p>
                  <p className="text-xs text-muted-foreground">Стримов</p>
                </div>
                <div className="p-3 rounded-lg bg-pink-500/10 text-center">
                  <Heart className="h-5 w-5 mx-auto mb-1 text-pink-500" />
                  <p className="font-bold">{selectedUser.achievements}</p>
                  <p className="text-xs text-muted-foreground">Достижений</p>
                </div>
              </div>

              {/* Checkpoints */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Чекпоинты
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { diamonds: 50000, reached: selectedUser.stats.checkpoint1 },
                    { diamonds: 100000, reached: selectedUser.stats.checkpoint2 },
                    { diamonds: 300000, reached: selectedUser.stats.checkpoint3 }
                  ].map((checkpoint) => (
                    <Badge 
                      key={checkpoint.diamonds}
                      variant={checkpoint.reached ? "default" : "outline"}
                      className={checkpoint.reached ? 'bg-primary' : 'opacity-50'}
                    >
                      {formatDiamonds(checkpoint.diamonds)} {checkpoint.reached ? '✓' : ''}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Progress info */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Прогресс до следующего чекпоинта</span>
                  <span className="font-bold">{formatDiamonds(selectedUser.stats.monthlyDiamonds)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                    style={{ width: `${Math.min((selectedUser.stats.monthlyDiamonds / 50000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ranking;
