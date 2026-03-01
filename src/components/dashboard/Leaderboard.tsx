import React from 'react';
import { Trophy, Crown, Medal, TrendingUp, Diamond, Flame, ChevronRight, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '@/contexts/AppDataContext';
import { getLeaderboard, formatDiamonds } from '@/data/appDataUtils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Leaderboard: React.FC = () => {
  const { allUsers, currentUser } = useAppData();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const leaderboard = getLeaderboard(allUsers).slice(0, 5);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'from-nova-gold/30 via-nova-gold/15 to-transparent',
          border: 'border-nova-gold/50',
          badge: 'bg-gradient-gold',
          glow: 'shadow-[0_0_20px_rgba(255,215,0,0.3)]',
          icon: Crown,
          iconColor: 'text-nova-gold',
        };
      case 2:
        return {
          bg: 'from-slate-300/20 via-slate-300/10 to-transparent',
          border: 'border-slate-300/40',
          badge: 'bg-gradient-to-br from-slate-300 to-slate-400',
          glow: '',
          icon: Medal,
          iconColor: 'text-slate-300',
        };
      case 3:
        return {
          bg: 'from-amber-600/20 via-amber-600/10 to-transparent',
          border: 'border-amber-600/40',
          badge: 'bg-gradient-to-br from-amber-600 to-amber-700',
          glow: '',
          icon: Medal,
          iconColor: 'text-amber-600',
        };
      default:
        return {
          bg: 'from-muted/30 to-transparent',
          border: 'border-border/50',
          badge: 'bg-muted',
          glow: '',
          icon: null,
          iconColor: 'text-muted-foreground',
        };
    }
  };

  return (
    <div className="glass-card p-4 md:p-6 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-nova-gold/10 rounded-full blur-3xl" />
      
      <div className="relative space-y-4 md:space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
              <Trophy className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold">Рейтинг</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Топ стримеров</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="hidden sm:flex text-xs text-muted-foreground hover:text-foreground gap-1">
            Все <ChevronRight className="w-3 h-3" />
          </Button>
        </div>

        {/* Leaderboard list */}
        <div className="space-y-2 md:space-y-3">
          {leaderboard.map((user, index) => {
            const rank = index + 1;
            const style = getRankStyle(rank);
            const isCurrentUser = user.id === currentUser.id;

            return (
              <div
                key={user.id}
                className={cn(
                  "relative flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-xl border bg-gradient-to-r transition-all duration-200 cursor-pointer group",
                  style.bg, style.border, style.glow,
                  isCurrentUser && "ring-2 ring-primary/50"
                )}
              >
                {/* Rank badge */}
                <div className={cn(
                  "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs md:text-sm flex-shrink-0",
                  style.badge
                )}>
                  {rank <= 3 && style.icon ? (
                    <style.icon className="w-3 h-3 md:w-4 md:h-4" />
                  ) : (
                    rank
                  )}
                </div>

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-border bg-muted"
                  />
                  {user.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full bg-success border-2 border-background" />
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 md:gap-2">
                    <p className={cn(
                      "font-semibold text-sm truncate",
                      isCurrentUser && "text-primary"
                    )}>
                      {user.name.split(' ')[0]}
                    </p>
                    {isCurrentUser && (
                      <span className="text-[9px] md:text-[10px] px-1 py-0.5 rounded bg-primary/20 text-primary font-medium">
                        Вы
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-accent" />
                      {user.streakDays}д
                    </span>
                    <span>Ур. {user.stats.currentLevel}</span>
                  </div>
                </div>

                {/* Diamonds */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 md:gap-1.5">
                    <span className={cn("font-bold text-sm md:text-base", style.iconColor)}>
                      {formatDiamonds(user.stats.monthlyDiamonds)}
                    </span>
                    <Diamond className={cn("w-3 h-3 md:w-4 md:h-4", style.iconColor)} />
                  </div>
                  {user.stats.diamondsToday > 0 && (
                    <div className="hidden sm:flex items-center gap-1 text-success text-xs justify-end">
                      <TrendingUp className="w-3 h-3" />
                      +{formatDiamonds(user.stats.diamondsToday)}
                    </div>
                  )}
                </div>

                {/* Message button */}
                {authUser && authUser.id !== user.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/chat?dm=${user.id}`);
                    }}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Button>
                )}

                {/* Hover indicator */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full bg-gradient-primary transition-all duration-200 group-hover:h-8" />
              </div>
            );
          })}
        </div>

        {/* Current user position if not in top 5 */}
        {!leaderboard.find(u => u.id === currentUser.id) && (
          <div className="pt-3 md:pt-4 border-t border-border/50">
            <p className="text-[10px] md:text-xs text-muted-foreground mb-2">Ваша позиция</p>
            <div className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-xl border border-primary/30 bg-primary/5">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-muted flex items-center justify-center text-xs md:text-sm font-bold">
                {currentUser.stats.rank}
              </div>
              <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary text-sm truncate">{currentUser.name}</p>
              </div>
              <div className="flex items-center gap-1 md:gap-1.5">
                <span className="font-bold text-sm md:text-base">{formatDiamonds(currentUser.stats.monthlyDiamonds)}</span>
                <Diamond className="w-3 h-3 md:w-4 md:h-4 text-nova-cyan" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
