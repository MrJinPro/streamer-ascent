import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, Music, Bell, Mic, Heart, Settings, Smartphone, Sparkles } from 'lucide-react';
import logo from '@/assets/novaboost-logo.png';
import mockMobile from '@/assets/mock-mobile.jpg';

const features = [
  { icon: Volume2, title: 'Озвучка чата', desc: 'Каждое сообщение в чате озвучивается с настраиваемыми голосами и скоростью.' },
  { icon: Music, title: 'Музыка подарков', desc: 'Назначьте уникальную мелодию каждому подарку — ваш эфир станет ярче и веселее.' },
  { icon: Bell, title: 'Алерты подписок', desc: 'Кастомные звуковые уведомления при новой подписке, лайке или шере.' },
  { icon: Heart, title: 'VIP приветствия', desc: 'Персональная озвучка для избранных гостей вашего эфира.' },
  { icon: Mic, title: 'TTS озвучка', desc: 'Text-to-speech с выбором языка, тембра и эмоций.' },
  { icon: Settings, title: 'Полная кастомизация', desc: 'Настройте каждый звук, громкость и условия срабатывания.' },
];

const ProductMobile: React.FC = () => {
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
            <span className="font-semibold">NovaBoost Mobile</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        <section className="py-14 md:py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary mb-5">
              <Smartphone className="w-3.5 h-3.5" /> Android & iOS
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-tight max-w-3xl">
              Озвучивайте эфир прямо с телефона
            </h1>
            <p className="mt-5 text-muted-foreground text-base md:text-lg max-w-2xl">
              NovaBoost Mobile — мобильное приложение для озвучки чата, подарков, подписок и приветствий.
              Кастомизируйте каждый звук и сделайте ваши стримы незабываемыми.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to="/auth?tab=application" className="h-12 px-6 rounded-xl bg-primary text-primary-foreground inline-flex items-center justify-center font-medium">
                Подать заявку
              </Link>
            </div>
          </motion.div>
        </section>

        <section className="pb-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-2 lg:order-1">
              <div className="grid sm:grid-cols-2 gap-4">
                {features.map((f, i) => (
                  <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-border bg-card/70 p-5 hover-lift">
                    <f.icon className="w-5 h-5 text-primary" />
                    <h3 className="mt-3 font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="order-1 lg:order-2 flex justify-center">
              <div className="relative max-w-[280px] rounded-3xl overflow-hidden border border-border shadow-lg">
                <img src={mockMobile} alt="NovaBoost Mobile скриншот" className="w-full" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="pb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Ключевые сценарии</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: 'Озвучка подарков музыкой', desc: 'Каждому подарку — своя мелодия. Зрители будут дарить ради звука!' },
              { title: 'Приветствие VIP зрителей', desc: 'Добавьте избранных гостей — при входе в эфир они услышат персональное приветствие.' },
              { title: 'Настройка по событиям', desc: 'Подписка, лайк, шер, подарок — на каждое событие свой уникальный звук.' },
            ].map(item => (
              <div key={item.title} className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                <Sparkles className="w-5 h-5 text-primary mb-3" />
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
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

export default ProductMobile;
