import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfUse: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 bg-mesh pointer-events-none opacity-60" />
      <main className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>

        <h1 className="mt-4 text-2xl md:text-4xl font-display font-bold">Условия использования NovaBoost</h1>

        <div className="mt-8 space-y-6 text-sm md:text-base leading-relaxed">
          <section><h2 className="font-semibold text-lg">1. Общие положения</h2><p>1.1. Настоящие Условия регулируют использование платформы, сервисов и продуктов NovaBoost (далее — «Платформа»).</p><p>1.2. Платформа включает веб-сайт, мобильные приложения, программное обеспечение, аналитические инструменты, образовательные материалы, коммуникационные сервисы и иные продукты экосистемы NovaBoost.</p><p>1.3. Используя Платформу, пользователь подтверждает согласие с настоящими Условиями.</p><p>1.4. Если пользователь не согласен с Условиями, он обязан прекратить использование.</p></section>
          <section><h2 className="font-semibold text-lg">2. Пользователи</h2><p>2.1. Пользователем может быть физическое или юридическое лицо.</p><p>2.2. Пользователь обязуется предоставлять достоверную информацию.</p><p>2.3. Пользователь несёт ответственность за безопасность аккаунта.</p></section>
          <section><h2 className="font-semibold text-lg">3. Описание услуг</h2><p>NovaBoost предоставляет инструменты аналитики и автоматизации, образовательные материалы, консультации и поддержку, программные решения, партнёрские программы, коммуникационные функции, AI-сервисы и рекомендации.</p></section>
          <section><h2 className="font-semibold text-lg">4. Независимость пользователей</h2><p>4.1. Пользователи не являются сотрудниками NovaBoost.</p><p>4.2. Платформа не регулирует рабочий график, место работы или формат деятельности.</p></section>
          <section><h2 className="font-semibold text-lg">5. Интеллектуальная собственность</h2><p>5.1. Все материалы, дизайн, алгоритмы, программный код и бренд NovaBoost защищены.</p><p>5.2. Запрещено копирование, распространение, декомпиляция и обратная разработка.</p></section>
          <section><h2 className="font-semibold text-lg">6. Ограничения</h2><p>Пользователь обязуется соблюдать правила платформ (TikTok и др.), не использовать мошеннические методы, не нарушать законодательство и не причинять вред репутации NovaBoost.</p></section>
          <section><h2 className="font-semibold text-lg">7. Контент</h2><p>7.1. Пользователь несёт ответственность за свой контент.</p><p>7.2. NovaBoost вправе удалять контент, нарушающий правила.</p></section>
          <section><h2 className="font-semibold text-lg">8. AI и аналитика</h2><p>8.1. Платформа может использовать автоматизированные алгоритмы.</p><p>8.2. Рекомендации не являются гарантией дохода.</p></section>
          <section><h2 className="font-semibold text-lg">9. Изменения</h2><p>NovaBoost вправе изменять функциональность и условия.</p></section>
          <section><h2 className="font-semibold text-lg">10. Ограничение ответственности</h2><p>NovaBoost не гарантирует доход, доступность платформ и отсутствие ошибок.</p></section>
          <section><h2 className="font-semibold text-lg">11. Блокировка</h2><p>Платформа может ограничить доступ при нарушениях.</p></section>
          <section><h2 className="font-semibold text-lg">12. Прекращение использования</h2><p>Пользователь может прекратить использование в любое время.</p></section>
          <section><h2 className="font-semibold text-lg">13. Применимое право</h2><p>Определяется юрисдикцией компании.</p></section>
        </div>
      </main>
    </div>
  );
};

export default TermsOfUse;
