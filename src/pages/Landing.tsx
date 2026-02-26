import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bot,
  BookOpen,
  Building2,
  ChevronRight,
  Compass,
  Gem,
  HelpCircle,
  Layers,
  LineChart,
  Monitor,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import logo from '@/assets/novaboost-logo.png';
import mockMobile from '@/assets/mock-mobile.jpg';
import mockDesktop from '@/assets/mock-desktop.jpg';
import mockTools from '@/assets/mock-tools.jpg';
import mockAcademy from '@/assets/mock-academy.jpg';
import mockAgency from '@/assets/mock-agency.jpg';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/analytics';

const navItems = [
  { label: 'Экосистема', href: '#ecosystem' },
  { label: 'Возможности', href: '#features' },
  { label: 'Агентство', href: '#agency' },
  { label: 'Документы', href: '#docs' },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Landing: React.FC = () => {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsReady(true), 250);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    document.title = 'NovaBoost Tools — Экосистема для стримеров';
    const description = 'NovaBoost Tools: автоматизация, аналитика, агентство и AI для роста стримеров нового поколения.';
    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let element = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!element) { element = document.createElement('meta'); element.setAttribute(attr, name); document.head.appendChild(element); }
      element.setAttribute('content', content);
    };
    setMeta('description', description);
    setMeta('og:title', 'NovaBoost Tools — Экосистема для стримеров', 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('twitter:card', 'summary_large_image');
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = window.location.origin;
    const scriptId = 'novaboost-landing-schema';
    const oldScript = document.getElementById(scriptId);
    if (oldScript) oldScript.remove();
    const structuredData = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'NovaBoost Tools', applicationCategory: 'BusinessApplication', operatingSystem: 'Web, iOS, Android, Desktop', description, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } };
    const script = document.createElement('script'); script.id = scriptId; script.type = 'application/ld+json'; script.text = JSON.stringify(structuredData); document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);

  const ctaHref = user ? '/dashboard' : '/auth?tab=login';
  const ctaLabel = user ? 'Перейти в Dashboard' : 'Войти';

  const ecosystem = useMemo(() => [
    {
      title: 'NovaBoost Mobile',
      description: 'Озвучка чата, подарков, подписок и приветствий VIP-гостей прямо с телефона. Кастомная музыка на каждый подарок.',
      icon: Smartphone,
      href: '/products/mobile',
      color: 'text-primary',
      image: mockMobile,
      imageClass: 'max-w-[120px]',
    },
    {
      title: 'NovaBoost Desktop',
      description: 'Всё, что есть в Mobile + видео-анимации подарков, виджеты, оверлеи, алерты и визуальный редактор.',
      icon: Monitor,
      href: '/products/desktop',
      color: 'text-nova-cyan',
      image: mockDesktop,
      imageClass: 'w-full',
    },
    {
      title: 'NovaBoost Academy',
      description: 'Видео-уроки, практика, квизы и сертификаты. Геймификация обучения — XP, уровни и рейтинг.',
      icon: BookOpen,
      href: '/products/academy',
      color: 'text-nova-gold',
      image: mockAcademy,
      imageClass: 'w-full',
    },
    {
      title: 'NovaBoost Tools',
      description: 'Панель управления для стримеров агентства: аналитика, AI-коуч, задачи, прогресс и достижения.',
      icon: Layers,
      href: '/products/tools',
      color: 'text-primary',
      image: mockTools,
      imageClass: 'w-full',
    },
    {
      title: 'NovaBoost Agency',
      description: 'Обучаем, развиваем и поддерживаем. Прозрачные условия, свобода контента, бесплатные инструменты.',
      icon: Building2,
      href: '/products/agency',
      color: 'text-accent',
      image: mockAgency,
      imageClass: 'w-full',
    },
  ], []);

  const capabilities = [
    { icon: Zap, title: 'Автоматизация стримов', text: 'Сценарии, шаблоны и рутины без ручных действий.' },
    { icon: Target, title: 'Персональные задачи', text: 'Дневные и недельные цели под ваш уровень.' },
    { icon: TrendingUp, title: 'XP и прогресс', text: 'Прокачка навыков через систему уровней и достижений.' },
    { icon: Wallet, title: 'Донаты', text: 'Удобный контроль источников поддержки и динамики донатов.' },
    { icon: LineChart, title: 'Аналитика', text: 'Метрики стримов и рекомендации по улучшению.' },
    { icon: Bot, title: 'AI коуч', text: 'Подсказки в реальном времени и персональная стратегия.' },
  ];

  const faq = [
    { q: 'Какой процент агентства?', a: 'Процент зависит от формата сотрудничества и фиксируется в оферте до старта.' },
    { q: 'Можно ли выйти из агентства?', a: 'Да, по условиям договора с прозрачной процедурой завершения сотрудничества.' },
    { q: 'Насколько безопасны данные?', a: 'Мы храним только необходимые данные и применяем role-based доступ.' },
    { q: 'Как происходят выплаты?', a: 'Выплаты идут по согласованному графику и фиксируются в личном кабинете.' },
    { q: 'Приложения бесплатны?', a: 'Mobile и Desktop бесплатны для стримеров агентства. Tools доступен только участникам агентства.' },
    { q: 'Нужен ли опыт стриминга?', a: 'Нет. Academy и AI-коуч помогут вам с нуля до профессионала.' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 bg-mesh pointer-events-none opacity-70" />
      <div className="fixed -top-40 right-0 w-[28rem] h-[28rem] bg-primary/20 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 left-0 w-[26rem] h-[26rem] bg-nova-cyan/20 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="NovaBoost" className="w-8 h-8" loading="lazy" />
            <div className="font-semibold tracking-tight">NovaBoost Tools</div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            {navItems.map(item => (
              <a key={item.href} href={item.href} className="hover:text-foreground transition-colors">{item.label}</a>
            ))}
          </nav>
          <Link
            to={ctaHref}
            onClick={() => trackEvent('landing_login_click', { authenticated: Boolean(user) })}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {ctaLabel}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 pt-14 md:pt-20 pb-16">
          {!isReady ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 w-3/4 bg-secondary rounded" />
              <div className="h-5 w-full bg-secondary rounded" />
              <div className="h-5 w-2/3 bg-secondary rounded" />
              <div className="h-12 w-52 bg-secondary rounded-xl" />
            </div>
          ) : (
            <motion.div initial="hidden" animate="show" variants={fadeIn} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary">
                <Gem className="w-3.5 h-3.5" /> Futuristic Creator Ecosystem
              </span>
              <h1 className="mt-5 text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-tight max-w-4xl">
                Экосистема для роста стримеров нового поколения
              </h1>
              <p className="mt-5 text-muted-foreground text-base md:text-lg max-w-2xl">
                Озвучка, анимации, аналитика, AI-коуч, обучение и агентство — всё в едином высокотехнологичном пространстве NovaBoost.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to={ctaHref}
                  onClick={() => trackEvent('landing_login_click', { authenticated: Boolean(user), source: 'hero' })}
                  className="h-12 px-6 rounded-xl bg-primary text-primary-foreground inline-flex items-center justify-center font-medium"
                >
                  {ctaLabel}
                </Link>
                <Link
                  to="/auth?tab=application"
                  onClick={() => trackEvent('landing_apply_click', { source: 'hero' })}
                  className="h-12 px-6 rounded-xl border border-border bg-secondary/60 inline-flex items-center justify-center font-medium"
                >
                  Подать заявку в агентство
                </Link>
              </div>
            </motion.div>
          )}
        </section>

        {/* Ecosystem — clickable cards */}
        <section id="ecosystem" className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Экосистема NovaBoost</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Пять продуктов, которые работают вместе — от мобильной озвучки до полноценного агентства.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ecosystem.map((item, i) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeIn}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  to={item.href}
                  className="group block rounded-2xl border border-border bg-card/70 overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-40 overflow-hidden bg-muted/30 flex items-center justify-center p-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className={`${item.imageClass} rounded-xl object-cover opacity-80 group-hover:opacity-100 transition-opacity`}
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <h3 className="font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:gap-2 transition-all">
                      Подробнее <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Возможности</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map(item => (
              <div key={item.title} className="rounded-2xl border border-border p-5 bg-card/60 hover-lift">
                <item.icon className="w-5 h-5 text-nova-cyan" />
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* For whom */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Для кого</h2>
          <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto snap-x pb-2">
            {[
              { title: 'Новички', text: 'Быстрый старт с Academy, базовые процессы и понятный рост от первого стрима.' },
              { title: 'Средний уровень', text: 'Систематизация через Tools, AI-коуч и масштабирование дохода.' },
              { title: 'Топ стримеры', text: 'Продвинутые инструменты Desktop, команда менторов и рост медийности.' },
            ].map(item => (
              <div key={item.title} className="min-w-[85%] md:min-w-0 snap-start rounded-2xl border border-border p-5 bg-card/60">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Agency CTA */}
        <section id="agency" className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <div className="rounded-3xl border border-primary/30 bg-primary/10 p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold">NovaBoost Agency</h2>
            <p className="mt-3 text-muted-foreground max-w-3xl">
              Прозрачные условия, свобода в контенте и стратегия для роста дохода. Вы получаете поддержку команды,
              бесплатные инструменты (Mobile, Desktop, Tools) и персональный план развития.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/products/agency"
                className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-primary-foreground font-medium"
              >
                Узнать больше
              </Link>
              <Link
                to="/auth?tab=application"
                onClick={() => trackEvent('landing_apply_click', { source: 'agency_section' })}
                className="inline-flex h-11 items-center rounded-xl border border-border px-5 font-medium"
              >
                Подать заявку
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Как это работает</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['Подать заявку', 'Пройти обучение', 'Получить инструменты', 'Расти и зарабатывать'].map((step, index) => (
              <div key={step} className="rounded-2xl border border-border p-5 bg-card/60">
                <p className="text-sm text-primary font-semibold">Шаг {index + 1}</p>
                <h3 className="mt-2 font-semibold">{step}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Gamification */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Геймификация</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[{ icon: Star, t: 'Уровни', d: 'Прокачивайте навыки и открывайте новые возможности.' }, { icon: Trophy, t: 'Достижения', d: 'Значки и награды за активность и результаты.' }, { icon: Compass, t: 'Сезоны', d: 'Сезонные челленджи с уникальными наградами.' }, { icon: TrendingUp, t: 'Рейтинг', d: 'Соревнуйтесь с другими стримерами агентства.' }].map(item => (
              <div key={item.t} className="rounded-2xl border border-border p-5 bg-card/60">
                <item.icon className="w-5 h-5 text-primary" />
                <p className="mt-3 font-semibold">{item.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* AI */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">AI-технологии</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { t: 'Персональный коуч', d: 'AI анализирует ваш прогресс и даёт конкретные советы по улучшению.' },
              { t: 'Анализ стримов', d: 'Автоматический разбор метрик: зрители, удержание, пик активности.' },
              { t: 'Авто-задачи', d: 'Ежедневные задачи генерируются на основе ваших слабых сторон.' },
            ].map(item => (
              <div key={item.t} className="rounded-2xl border border-border p-5 bg-card/60">
                <Bot className="w-5 h-5 text-nova-cyan" />
                <h3 className="mt-3 font-semibold">{item.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Documents */}
        <section id="docs" className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Документы</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Условия использования', href: '/documents/terms' },
              { label: 'Политика конфиденциальности', href: '/documents/privacy' },
              { label: 'Оферта агентства', href: '/documents/agency-offer' },
            ].map(item => (
              <Link key={item.label} to={item.href} className="rounded-xl border border-border p-5 bg-card/60 hover:border-primary/40 transition-colors">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <p className="mt-3 font-medium">{item.label}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">FAQ</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {faq.map(item => (
              <div key={item.q} className="rounded-2xl border border-border p-5 bg-card/60">
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold">{item.q}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border mt-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <p className="font-semibold">NovaBoost Tools</p>
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} NovaBoost. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <a href="https://t.me" target="_blank" rel="noreferrer">Telegram</a>
            <a href="mailto:hello@novaboost.tools">Email</a>
            <Link to="/documents/terms">Условия использования</Link>
            <Link to="/documents/privacy">Политика конфиденциальности</Link>
            <Link to="/documents/agency-offer">Оферта агентства</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
