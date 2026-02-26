import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Users, TrendingUp, Shield, Gift, Headphones } from 'lucide-react';
import logo from '@/assets/novaboost-logo.png';
import mockAgency from '@/assets/mock-agency.jpg';

const features = [
  { icon: Users, title: 'Команда менторов', desc: 'Персональный куратор и доступ к сообществу опытных стримеров.' },
  { icon: TrendingUp, title: 'Стратегия роста', desc: 'Индивидуальный план развития, цели и метрики для отслеживания прогресса.' },
  { icon: Gift, title: 'Бесплатные инструменты', desc: 'Все приложения экосистемы (Mobile, Desktop) — бесплатно для стримеров агентства.' },
  { icon: Shield, title: 'Прозрачные условия', desc: 'Процент и условия фиксируются в оферте. Свобода контента, без ограничений.' },
  { icon: Headphones, title: 'Поддержка 24/7', desc: 'Техническая поддержка и помощь с настройкой инструментов в любое время.' },
  { icon: Building2, title: 'Масштабирование', desc: 'Выходите на новый уровень: коллаборации, рекламодатели, медийность.' },
];

const steps = [
  { step: 1, title: 'Подайте заявку', desc: 'Заполните анкету — мы свяжемся с вами в течение 24 часов.' },
  { step: 2, title: 'Пройдите обучение', desc: 'Изучите базовые курсы в Academy и получите сертификат.' },
  { step: 3, title: 'Получите инструменты', desc: 'Доступ к Mobile, Desktop и Tools — бесплатно и навсегда.' },
  { step: 4, title: 'Растите с нами', desc: 'Стримьте, выполняйте задачи, растите в рейтинге и зарабатывайте.' },
];

const ProductAgency: React.FC = () => {
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
            <span className="font-semibold">NovaBoost Agency</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        <section className="py-14 md:py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs text-accent mb-5">
              <Building2 className="w-3.5 h-3.5" /> Агентство
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-tight max-w-3xl">
              Агентство, которое помогает расти
            </h1>
            <p className="mt-5 text-muted-foreground text-base md:text-lg max-w-2xl">
              NovaBoost Agency — мы обучаем, развиваем и поддерживаем стримеров. Прозрачные условия,
              свобода в контенте и все инструменты экосистемы бесплатно.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to="/auth?tab=application" className="h-12 px-6 rounded-xl bg-accent text-accent-foreground inline-flex items-center justify-center font-medium">
                Подать заявку
              </Link>
              <Link to="/documents/agency-offer" className="h-12 px-6 rounded-xl border border-border bg-secondary/60 inline-flex items-center justify-center font-medium">
                Оферта агентства
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-3xl overflow-hidden border border-border mb-12">
            <img src={mockAgency} alt="NovaBoost Agency скриншот" className="w-full" loading="lazy" />
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-border bg-card/70 p-5 hover-lift">
                <f.icon className="w-5 h-5 text-accent" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-6">Как начать</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map(s => (
              <div key={s.step} className="rounded-2xl border border-border p-5 bg-card/60">
                <p className="text-sm font-semibold text-primary">Шаг {s.step}</p>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
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

export default ProductAgency;
