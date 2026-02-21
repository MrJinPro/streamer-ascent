import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 bg-mesh pointer-events-none opacity-60" />
      <main className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>

        <h1 className="mt-4 text-2xl md:text-4xl font-display font-bold">Политика конфиденциальности NovaBoost</h1>

        <div className="mt-8 space-y-6 text-sm md:text-base leading-relaxed">
          <section><h2 className="font-semibold text-lg">1. Общие положения</h2><p>NovaBoost уважает конфиденциальность и защищает данные пользователей.</p></section>
          <section><h2 className="font-semibold text-lg">2. Какие данные собираются</h2><p>Могут собираться: имя, email, аккаунты стриминговых платформ, статистика активности, данные устройств, IP-адрес, взаимодействие с сервисами, финансовая информация.</p></section>
          <section><h2 className="font-semibold text-lg">3. Источники</h2><p>Данные могут поступать от пользователя, от платформ (например TikTok), из аналитических инструментов.</p></section>
          <section><h2 className="font-semibold text-lg">4. Цели обработки</h2><p>Данные используются для работы сервиса, аналитики, рекомендаций, улучшения продуктов, безопасности, поддержки и маркетинга.</p></section>
          <section><h2 className="font-semibold text-lg">5. AI и автоматизация</h2><p>Данные могут обрабатываться алгоритмами.</p></section>
          <section><h2 className="font-semibold text-lg">6. Передача данных</h2><p>Данные могут передаваться партнёрам, платёжным системам, облачным провайдерам, государственным органам при необходимости.</p></section>
          <section><h2 className="font-semibold text-lg">7. Международная передача</h2><p>Пользователь соглашается на обработку данных в разных странах.</p></section>
          <section><h2 className="font-semibold text-lg">8. Хранение</h2><p>Данные хранятся столько, сколько необходимо.</p></section>
          <section><h2 className="font-semibold text-lg">9. Защита</h2><p>NovaBoost применяет технические меры защиты.</p></section>
          <section><h2 className="font-semibold text-lg">10. Права пользователя</h2><p>Пользователь имеет право запросить доступ, исправить, удалить и ограничить обработку.</p></section>
          <section><h2 className="font-semibold text-lg">11. Cookies</h2><p>Используются для улучшения работы.</p></section>
          <section><h2 className="font-semibold text-lg">12. Изменения политики</h2><p>NovaBoost может обновлять политику.</p></section>
          <section><h2 className="font-semibold text-lg">13. Контакты</h2><p>support@novaboost.app</p></section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
