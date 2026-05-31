
## 1. База данных (одна миграция)

### Академия
- `academy_blocks.block_type` enum + добавить значения: `html`, `heading`, `quote`, `file`, `divider`.
- `academy_blocks.content` (jsonb) — расширить схему: поддержка `body` (markdown), `html` (raw, санитизированный на клиенте через DOMPurify), `font`, `align`, `color`, `url`, `caption`.
- `academy_rewards` — уже есть, расширим `reward_type` доменом: `xp`, `diamonds`, `badge` (achievement_id), `unlock_lesson`, `unlock_course`. Несколько наград на урок поддерживается уже сейчас.
- RPC `academy_award_xp` обновим: после выдачи XP проходить по `academy_rewards` урока и выдавать diamonds (через `monthly_progress`), вешать `achievement_unlocks` для badge, помечать `unlocks` в новой таблице `academy_unlocks (user_id, lesson_id|course_id)`.
- Новая таблица `academy_unlocks` для разблокировок (RLS: self read, admin write через RPC).

### Поддержка
- `support_categories` (id, slug, title, description, sort, is_active) — admin write, all auth read.
- `support_tickets` (id, user_id, category_id, subject, status['open','in_progress','resolved','closed'], priority, assigned_to, created_at, updated_at, source['ai_escalation','direct']).
- `support_messages` (id, ticket_id, sender_user_id|null, sender_kind['user','ai','staff','system'], body, created_at).
- RLS: владелец читает/пишет свой тикет; admin/staff видят все; AI пишет через service_role в edge function.

Сидим базовые категории: «Апелляция», «Доступ к трансляциям», «Другие проблемы авторов», «Управление деятельностью авторов», «Расчёты с агентством», «Другие проблемы агентства».

## 2. Edge Functions

- `support-ai-chat` (новая): принимает `ticket_id?`, `message`. Если тикета нет — создаёт «AI-сессию» (ticket с source=ai_escalation, статус open, без category). Сохраняет user msg, вызывает Lovable AI Gateway с системным промптом «ты тех-поддержка NovaBoost», возвращает ответ, сохраняет AI msg. Контекст: последние 20 сообщений + материалы академии (top-k по ключевым словам из таблиц `academy_courses/lessons/blocks`).
- `support-escalate` (новая): меняет ticket source/assigned, требует `category_id` + краткое описание, шлёт системное сообщение «передано менеджеру», уведомление через `notifications` (если есть) или просто оставляет в чате.
- `ai-coach-chat` (существующий): добавить в системный контекст выгрузку академии (заголовки курсов/уроков + summary), чтобы наставник опирался на материалы.

## 3. Админка (`src/components/admin/AdminAcademy.tsx` + новые)

Полная переработка:
- Список курсов с действиями: Редактировать, Опубликовать/Скрыть (toggle `is_published`), Удалить (с подтверждением, каскадно через RPC `academy_delete_course`).
- Внутри курса — список уроков с такими же действиями + порядок (drag/up-down).
- Редактор урока: вкладки **Блочный редактор** и **HTML-режим**:
  - Блочный: добавление/удаление/сортировка блоков всех типов (text, html, heading, image, gallery, video, quote, file, divider, checklist, quiz, cta, reward, task). Для текста — textarea с подсказкой о Markdown, поля шрифта/цвета/выравнивания.
  - HTML: одно textarea, при сохранении создаёт/обновляет один блок `block_type='html'`.
- Панель наград урока: чипы XP/Diamonds/Badge(выбор из achievements)/Unlock(выбор урока/курса).
- Безопасность: HTML рендерится через DOMPurify (whitelist тегов, без `<script>`, без `on*`).

## 4. Страница обучения (`src/pages/Learning.tsx`)

- Новая отрисовка `html` блока через DOMPurify + `prose` стили.
- Блок `heading/quote/divider/file` отрисовываются по типам.
- Карточка награды показывает все awards урока (xp + diamonds + badge + unlock).
- После завершения — показ полученных наград.

## 5. AI Тех-поддержка UI

Новый компонент `SupportWidget` (или страница `/support`):
- Кнопка «Обращение в службу поддержки» открывает диалог с чатом AI.
- В диалоге: сообщения AI + пользователь, инпут, кнопка «Связаться с человеком» → форма (Категория + краткое описание) → вызывает `support-escalate`, после чего тикет уходит менеджеру (отображается в админке отдельным разделом, не в этом плане — добавим базовый список).
- Базовый просмотр тикетов в админке (`AdminSupportTickets`): список, фильтр по статусу, открытие чата, ответ от имени staff.

## 6. AI Наставник — корм

- `ai-coach-chat` грузит в system message список опубликованных курсов/уроков (title + summary + reward_meta) и краткие выдержки блоков типа text/html (первые ~2000 симв). Лимит 8000 токенов контекста, обрезаем.
- Та же выгрузка для `support-ai-chat`.

## Технические заметки

- Все мутации — через RLS + RPC где нужно (admin actions).
- HTML санитизация на клиенте через `dompurify` (новая зависимость).
- Сортировка блоков/уроков — drag через `@dnd-kit` (уже в проекте? проверю; если нет — кнопки ↑↓).
- Все edge functions с CORS, верификацией JWT, валидацией Zod.

Подтверди план — приступаю к миграции, потом коду.
