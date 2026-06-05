import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Printer } from 'lucide-react';
import {
  OFFER_ACTIVITY_LEVELS,
  OFFER_DIAMOND_LEVELS,
  OFFER_DOWNLOAD_URL,
  OFFER_PUBLISHED_LABEL,
  OFFER_SECTIONS,
  OFFER_VERSION,
} from '@/data/agencyOffer';

const AgencyOffer: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 bg-mesh pointer-events-none opacity-60" />

      <main className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> На главную
          </Link>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <a
              href={OFFER_DOWNLOAD_URL}
              download
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Download className="w-4 h-4" /> Скачать .docx
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-secondary/40 hover:bg-secondary transition-colors"
            >
              <Printer className="w-4 h-4" /> Печать / PDF
            </button>
          </div>
        </div>

        <header className="mt-6 rounded-2xl border border-border bg-card/40 backdrop-blur p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <FileText className="w-4 h-4 text-primary" /> Публичный договор-оферта
          </div>
          <h1 className="mt-3 text-2xl md:text-4xl font-display font-bold leading-tight">
            Договор-оферта о сотрудничестве со стримерами<br className="hidden md:block" /> платформы NovaBoost Agency
          </h1>
          <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
              <div className="text-xs text-muted-foreground">Редакция</div>
              <div className="font-semibold">№{OFFER_VERSION}</div>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
              <div className="text-xs text-muted-foreground">Дата публикации</div>
              <div className="font-semibold">{OFFER_PUBLISHED_LABEL}</div>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
              <div className="text-xs text-muted-foreground">Язык документа</div>
              <div className="font-semibold">Русский</div>
            </div>
          </div>
        </header>

        {/* Table of contents */}
        <nav className="mt-6 rounded-xl border border-border bg-card/30 p-4 md:p-5 print:hidden">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Содержание</div>
          <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {OFFER_SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-foreground/80 hover:text-primary transition-colors">
                  {s.title}
                </a>
              </li>
            ))}
            <li>
              <a href="#tables" className="text-foreground/80 hover:text-primary transition-colors">
                Таблицы уровней и формула бонуса
              </a>
            </li>
          </ol>
        </nav>

        {/* Body */}
        <article className="mt-8 academy-reader print:academy-reader">
          {OFFER_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-20 mb-8">
              <h2 className="!mb-4">{section.title}</h2>
              {section.paragraphs?.map((p, i) => (
                <p key={`p-${i}`}>{p}</p>
              ))}
              {section.lists?.map((list, li) => (
                <div key={`l-${li}`}>
                  {list.lead && <p className="!mb-2">{list.lead}</p>}
                  <ul>
                    {list.items.map((it, ii) => (
                      <li key={ii}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}

          <section id="tables" className="scroll-mt-20 mb-8">
            <h2>Таблицы уровней и формула бонуса</h2>

            <h3>Таблица уровней по Алмазам</h3>
            <table>
              <thead>
                <tr>
                  <th>Уровень</th>
                  <th>Алмазы за месяц</th>
                  <th>Ставка бонуса</th>
                </tr>
              </thead>
              <tbody>
                {OFFER_DIAMOND_LEVELS.map((r) => (
                  <tr key={r.level}>
                    <td>{r.level}</td>
                    <td>{r.diamonds}</td>
                    <td>{r.bonus}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>Таблица уровней активности</h3>
            <table>
              <thead>
                <tr>
                  <th>Уровень</th>
                  <th>Действительные дни</th>
                  <th>Часы эфиров</th>
                </tr>
              </thead>
              <tbody>
                {OFFER_ACTIVITY_LEVELS.map((r) => (
                  <tr key={r.level}>
                    <td>{r.level}</td>
                    <td>{r.days}</td>
                    <td>{r.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>Формула расчёта бонуса</h3>
            <p>
              Итоговый уровень бонуса определяется как наименьший уровень между уровнем по Алмазам и уровнем по Активности.
              Если уровень по Алмазам выше уровня по Активности, выплата производится по уровню Активности.
              Если уровень по Активности выше уровня по Алмазам, выплата производится по уровню Алмазов.
            </p>
            <blockquote>
              Пример: 300 000 Алмазов соответствуют Уровню 4. При активности 8 дней и 20 часов Стример соответствует Уровню 1 активности.
              Итоговый бонус рассчитывается по Уровню 1.
            </blockquote>
          </section>
        </article>

        <footer className="mt-12 mb-6 text-xs text-muted-foreground text-center">
          Редакция №{OFFER_VERSION}. Дата публикации: {OFFER_PUBLISHED_LABEL}.
        </footer>
      </main>
    </div>
  );
};

export default AgencyOffer;
