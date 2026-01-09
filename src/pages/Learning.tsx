import React, { useState } from 'react';
import { lessons } from '@/data/mockData';
import { CheckCircle, Lock, Play, Clock, BookOpen, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const Learning: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(lessons.map(l => l.category)))];

  const filteredLessons = lessons.filter(l => {
    if (categoryFilter === 'all') return true;
    return l.category === categoryFilter;
  });

  const stats = {
    total: lessons.length,
    completed: lessons.filter(l => l.completed).length,
    available: lessons.filter(l => !l.locked && !l.completed).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Обучение</h1>
          <p className="text-muted-foreground mt-1">
            Структурированные уроки для развития навыков
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-bold text-primary">{stats.completed}</span>
          <span className="text-muted-foreground">/ {stats.total} уроков</span>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="p-6 rounded-xl glass border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">Общий прогресс</h3>
          <span className="text-sm text-muted-foreground">
            {Math.round((stats.completed / stats.total) * 100)}% завершено
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-cosmic rounded-full transition-all duration-700"
            style={{ width: `${(stats.completed / stats.total) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-sm">
          <span className="text-success">{stats.completed} пройдено</span>
          <span className="text-primary">{stats.available} доступно</span>
          <span className="text-muted-foreground">{stats.total - stats.completed - stats.available} заблокировано</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                categoryFilter === cat 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {cat === 'all' ? 'Все' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLessons.map((lesson) => (
          <div
            key={lesson.id}
            className={cn(
              "group p-5 rounded-xl border transition-all duration-300",
              lesson.completed 
                ? "bg-success/5 border-success/30" 
                : lesson.locked
                  ? "bg-muted/30 border-border opacity-60"
                  : "glass border-border hover:border-primary/30 hover:scale-[1.02]"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                lesson.completed 
                  ? "bg-success/20 text-success"
                  : "bg-secondary text-muted-foreground"
              )}>
                {lesson.category}
              </span>
              <div className={cn(
                "w-8 h-8 flex items-center justify-center rounded-full",
                lesson.completed 
                  ? "bg-success text-success-foreground"
                  : lesson.locked
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground group-hover:shadow-glow transition-all"
              )}>
                {lesson.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : lesson.locked ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </div>
            </div>

            <h3 className={cn(
              "font-medium mb-1",
              lesson.locked && "text-muted-foreground"
            )}>
              {lesson.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{lesson.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {lesson.duration}
              </div>
              {!lesson.locked && !lesson.completed && (
                <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  Начать →
                </button>
              )}
              {lesson.completed && (
                <span className="text-sm text-success">✓ Пройдено</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Learning;
