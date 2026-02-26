import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Layers, Bot, Target, TrendingUp, LineChart, Trophy, Zap } from 'lucide-react';
import logo from '@/assets/novaboost-logo.png';
import mockTools from '@/assets/mock-tools.jpg';

const features = [
  { icon: Target, title: 'Персональные задачи', desc: 'Дневные и недельные цели, адаптированные под ваш уровень и прогресс.' },
  { icon: Bot, title: 'AI Коуч', desc: 'Искусственный интеллект анализирует ваши эфиры и даёт персональные советы.' },
  { icon: LineChart, title: 'Аналитика стримов', desc: 'Глубокая аналитика: зрители, донаты, динамика роста, метрики эфиров.' },
  { icon: TrendingUp, title: 'XP и уровни', desc: 'Система прокачки навыков — выполняйте задачи и растите в рейтинге.' },
  { icon: Trophy, title: 'Достижения', desc: 'Значки, награды и статусы за выполнение целей и прохождение обучения.' },
  { icon: Zap, title: 'Автоматизация', desc: 'Сценарии, шаблоны и авто-задачи — без ручных действий.' },
];

const ProductTools: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 bg-mesh pointer-events-none opacity-70" />

      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="NovaBoost" className="w-8 h-8" />
            <span className="font-semibold">NovaBoost Tools</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        <section className="py-14 md:py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary mb-5">
              <Layers className="w-3.5 h-3.5" /> Только для агентства
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-tight max-w-3xl">
              Панель управления для стримеров агентства
            </h1>
            <p className="mt-5 text-muted-foreground text-base md:text-lg max-w-2xl">
              NovaBoost Tools — веб-приложение для стримеров нашего агентства. Автоматический анализ эфиров,
              AI-коуч с персональными советами, задачи, прогресс и достижения — всё в одном месте.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to="/auth?tab=application" className="h-12 px-6 rounded-xl bg-primary text-primary-foreground inline-flex items-center justify-center font-medium">
                Подать заявку в агентство
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-3xl overflow-hidden border border-border mb-12">
            <img src={mockTools} alt="NovaBoost Tools скриншот" className="w-full" loading="lazy" />
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-border bg-card/70 p-5 hover-lift">
                <f.icon className="w-5 h-5 text-primary" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} NovaBoost. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default ProductTools;
