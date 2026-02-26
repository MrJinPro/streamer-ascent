import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Video, Award, CheckCircle, Star, TrendingUp } from 'lucide-react';
import logo from '@/assets/novaboost-logo.png';
import mockAcademy from '@/assets/mock-academy.jpg';

const features = [
  { icon: Video, title: 'Видео-уроки', desc: 'Практические уроки от опытных стримеров с пошаговыми инструкциями.' },
  { icon: CheckCircle, title: 'Задания и практика', desc: 'После каждого урока — практическое задание для закрепления знаний.' },
  { icon: Award, title: 'Сертификаты', desc: 'Получайте XP и достижения за пройденные курсы.' },
  { icon: Star, title: 'Геймификация', desc: 'Уровни, рейтинг и соревнование с другими учениками.' },
  { icon: TrendingUp, title: 'Прогресс', desc: 'Трекер прогресса — видно сколько пройдено и сколько осталось.' },
  { icon: BookOpen, title: 'База знаний', desc: 'Статьи, гайды и чек-листы для стримеров любого уровня.' },
];

const ProductAcademy: React.FC = () => {
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
            <span className="font-semibold">NovaBoost Academy</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        <section className="py-14 md:py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-nova-gold/40 bg-nova-gold/10 px-3 py-1 text-xs text-nova-gold mb-5">
              <BookOpen className="w-3.5 h-3.5" /> Обучение
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-tight max-w-3xl">
              Учитесь стримить профессионально
            </h1>
            <p className="mt-5 text-muted-foreground text-base md:text-lg max-w-2xl">
              NovaBoost Academy — обучающая платформа с курсами, уроками и практическими заданиями.
              Часть экосистемы NovaBoost Tools — всё, что нужно для старта и роста.
            </p>
          </motion.div>
        </section>

        <section className="pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-3xl overflow-hidden border border-border mb-12">
            <img src={mockAcademy} alt="NovaBoost Academy скриншот" className="w-full" loading="lazy" />
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-border bg-card/70 p-5 hover-lift">
                <f.icon className="w-5 h-5 text-nova-gold" />
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

export default ProductAcademy;
