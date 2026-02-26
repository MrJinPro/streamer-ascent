import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Users,
  TrendingUp,
  Shield,
  Gift,
  Headphones,
  Target,
  Rocket,
  Brain,
  Smartphone,
  Monitor,
  Wrench,
  BarChart3,
  Handshake,
  GraduationCap,
} from 'lucide-react';
import logo from '@/assets/novaboost-logo.png';
import mockAgency from '@/assets/mock-agency.jpg';

const features = [
  {
    icon: Users,
    title: 'Персональный куратор',
    desc: 'Наставник помогает со стратегией эфиров, аналитикой, контентом, доходом и работой с аудиторией.',
  },
  {
    icon: GraduationCap,
    title: 'Обучение в Academy',
    desc: 'Психология стриминга, удержание, подарки, триггеры, личный бренд и масштабирование.',
  },
  {
    icon: Wrench,
    title: 'Собственные технологии',
    desc: 'Доступ к NovaBoost Mobile, Desktop и Tools с автоматизацией, аналитикой и AI-коучем.',
  },
  {
    icon: BarChart3,
    title: 'Рост дохода',
    desc: 'Работаем с монетизацией, ARPU, ядром донатеров, удержанием и конкурентными эфирами.',
  },
  {
    icon: Shield,
    title: 'Прозрачность и честность',
    desc: 'Вы видите статистику, результаты и прогресс. Никаких скрытых комиссий.',
  },
  {
    icon: Rocket,
    title: 'Масштабирование карьеры',
    desc: 'Помогаем выйти на бренды, интеграции, партнерства и усиление личного медийного бренда.',
  },
];

const steps = [
  { step: 1, title: 'Оставьте заявку', desc: 'Заполните форму и расскажите о вашем текущем уровне и целях.' },
  { step: 2, title: 'Пройдите onboarding', desc: 'Анализ профиля, стартовый план развития и обучение под ваш формат.' },
  { step: 3, title: 'Получите доступ к экосистеме', desc: 'Подключаем инструменты NovaBoost и закрепляем куратора.' },
  { step: 4, title: 'Запускайте рост', desc: 'Регулярные эфиры, аналитика, сопровождение и увеличение дохода.' },
];

const approach = ['личность', 'характер', 'стиль общения', 'сильные стороны', 'аудиторию'];

const principles = ['Долгосрочность', 'Честность', 'Профессионализм', 'Инновации', 'Комьюнити'];

const audiences = [
  {
    title: 'Для новичков',
    points: ['быстрый старт', 'понятная система', 'обучение с нуля'],
  },
  {
    title: 'Для средних стримеров',
    points: ['рост дохода', 'персональная стратегия', 'стабильность и дисциплина'],
  },
  {
    title: 'Для профессионалов',
    points: ['масштабирование', 'медийный бренд', 'партнерства и интеграции'],
  },
];

const ecosystem = [
  {
    icon: Smartphone,
    title: 'NovaBoost Mobile',
    points: ['интерактивные подарки', 'уникальные оверлеи', 'TTS и эффекты', 'автоматизация эфиров'],
  },
  {
    icon: Monitor,
    title: 'NovaBoost Desktop',
    points: ['профессиональная аналитика', 'управление стримами', 'сценарии эфиров', 'автоматизация процессов'],
  },
  {
    icon: Brain,
    title: 'NovaBoost Tools',
    points: ['геймификация', 'задания', 'достижения', 'мотивация и AI-коуч'],
  },
];

const faq = [
  {
    q: 'Как выйти из агентства NovaBoost?',
    a: 'Вы можете выйти в любой момент согласно правилам TikTok. Мы не удерживаем стримеров искусственно и помогаем корректно оформить выход.',
  },
  {
    q: 'Какой процент берет NovaBoost?',
    a: 'NovaBoost не забирает процент с ваших подарков. Доход агентства формируется из партнерской программы TikTok.',
  },
  {
    q: 'Почему агентству выгодно работать без процента?',
    a: 'Чем выше ваши результаты в TikTok, тем сильнее поддержка платформы для агентства. Поэтому наши цели полностью совпадают с вашим ростом.',
  },
  {
    q: 'Подходит ли агентство новичкам?',
    a: 'Да. Мы обучаем с нуля: как вести эфир, удерживать зрителей, вызывать эмоции и работать с подарками.',
  },
  {
    q: 'Можно ли совмещать агентство с работой или учебой?',
    a: 'Да. Вы сами выбираете график, а мы помогаем выстроить комфортный режим и постепенно увеличивать доход.',
  },
  {
    q: 'Есть ли требования к стримерам?',
    a: 'Главное — желание развиваться. Мы ценим дисциплину, стабильность и готовность учиться.',
  },
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
              NovaBoost Agency — продюсерский центр нового поколения для LIVE-стримеров TikTok
            </h1>
            <p className="mt-5 text-muted-foreground text-base md:text-lg max-w-2xl">
              NovaBoost Agency — это полноценная экосистема роста, заработка и медийности для стримеров.
              Мы объединяем технологии, стратегию и сильную команду, чтобы помочь каждому выйти на новый
              уровень дохода и стабильности.
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

          <div className="grid lg:grid-cols-2 gap-4 mb-12">
            <div className="rounded-2xl border border-border bg-card/70 p-6">
              <h2 className="text-xl font-semibold">Почему мы создали NovaBoost</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Мы сами прошли путь стриминга и видели, как многие агентства привлекают первым бонусом,
                а затем оставляют стримера без стратегии и роста. NovaBoost появился, чтобы это изменить.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Мы строим долгосрочную систему: стабильный доход, развитие личности, профессиональный рост
                и масштабирование карьеры.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card/70 p-6">
              <h2 className="text-xl font-semibold">Наша миссия</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Создать сильное международное комьюнити стримеров, которые зарабатывают, развиваются и
                становятся медийными.
              </p>
              <h3 className="mt-4 font-semibold">Наши принципы</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {principles.map((item) => (
                  <span key={item} className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-6 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">Наш подход</h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-3xl">
              Мы не работаем по шаблону. Каждый стример — это отдельный проект. Перед стартом мы анализируем:
            </p>
            <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {approach.map((item) => (
                <div key={item} className="rounded-xl border border-border bg-background/40 px-4 py-3 text-sm">
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              На основе этого формируется индивидуальная стратегия развития.
            </p>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-6">Что вы получаете в NovaBoost</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-border bg-card/70 p-5 hover-lift">
                <f.icon className="w-5 h-5 text-accent" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-6">Экосистема технологий</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {ecosystem.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card/70 p-5">
                <item.icon className="w-5 h-5 text-accent" />
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {item.points.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-6">Для кого подходит NovaBoost</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {audiences.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-card/70 p-5">
                <h3 className="font-semibold">{item.title}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {item.points.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
              </div>
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

          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 mt-12 mb-12">
            <h2 className="text-2xl font-bold">Почему сейчас — лучшее время</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              TikTok LIVE растет, конкуренция усиливается, и технологии уже определяют лидеров.
              Те, кто начнут сейчас, займут сильные позиции в новой волне.
            </p>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-6">Часто задаваемые вопросы</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {faq.map((item) => (
              <div key={item.q} className="rounded-2xl border border-border bg-card/70 p-5">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card/80 p-6 md:p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">NovaBoost — долгосрочный выбор</h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-3xl mx-auto">
              Мы строим карьеру стримера, а не быстрый заработок. Наша цель — сильный бренд,
              стабильный доход и масштаб в долгую.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth?tab=application"
                className="h-12 px-6 rounded-xl bg-accent text-accent-foreground inline-flex items-center justify-center font-medium"
              >
                Оставить заявку
              </Link>
              <Link
                to="/documents/agency-offer"
                className="h-12 px-6 rounded-xl border border-border bg-secondary/60 inline-flex items-center justify-center font-medium"
              >
                Изучить оферту
              </Link>
            </div>
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
