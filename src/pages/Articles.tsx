import React, { useState } from 'react';
import { articles } from '@/data/mockData';
import { Clock, Star, Filter, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const Articles: React.FC = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(articles.map(a => a.category)))];
  const featured = articles.filter(a => a.featured);
  
  const filteredArticles = articles.filter(a => {
    if (categoryFilter === 'all') return true;
    return a.category === categoryFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">База знаний</h1>
        <p className="text-muted-foreground mt-1">
          Статьи, советы и лучшие практики для стримеров
        </p>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featured.map((article) => (
            <div
              key={article.id}
              className="group relative p-6 rounded-xl bg-gradient-cosmic border border-primary/30 overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            >
              <div className="absolute top-4 right-4">
                <Star className="w-5 h-5 text-accent fill-accent" />
              </div>
              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary-foreground/20 text-primary-foreground mb-3">
                {article.category}
              </span>
              <h3 className="text-xl font-display font-semibold text-primary-foreground mb-2">
                {article.title}
              </h3>
              <p className="text-primary-foreground/80 text-sm mb-4">
                {article.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-primary-foreground/70">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {article.readTime}
                  </div>
                  <span>•</span>
                  <span>{new Date(article.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}

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

      {/* Articles List */}
      <div className="space-y-3">
        {filteredArticles.filter(a => !a.featured).map((article) => (
          <div
            key={article.id}
            className="group p-5 rounded-xl glass border border-border hover:border-primary/30 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-secondary text-muted-foreground">
                    {article.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {article.readTime}
                  </div>
                </div>
                <h3 className="font-medium group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{article.excerpt}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Articles;
