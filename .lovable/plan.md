# Система пользователей, ролей и заявок Агентства

## Что не так сейчас (диагноз)

1. **«Доступ ограничен» после онбординга.** При создании пользователя в админке роль пишется только в `admin_invites.role_slugs`, а в `user_roles` попадает лишь во время `onboarding-complete`. Там есть две ошибки:
   - в `user_roles.role` (legacy enum) всегда жёстко ставится `'streamer'`, независимо от выбранной роли;
   - если в `admin_invites` для email нет записи (а она нужна и при ручном выборе роли в Онбординге), вставка ролей вообще не выполняется → у юзера нет ни одной строки в `user_roles` → `ensure_profile_access_data` возвращает `NULL` → срабатывает гейт `AccessRestricted`.
2. **«Менеджер агентства» в онбординге ничего не назначает.** Экран Онбординга вообще не отправляет выбранную роль на бэк — функция `onboarding-complete` её не принимает.
3. **Нет различия «стример Агентства» vs «обычный стример».** Сейчас и тот и тот — `streamer`. Нет ни slug-а, ни признака членства.
4. **Одобрение заявки Агентства = пустышка.** RPC `approve_agency_application` только создаёт реферальный код и меняет статус. Не создаётся аккаунт, не назначается роль, не уходит письмо.
5. **Админка заявок бедная** — нет деталей, истории, отказа с причиной, фильтров.
6. **Нет транзакционных писем** — только Supabase magic-link.

---

## Что строим

### 1. Чёткая таксономия ролей (две «полки»)
- **Public/user-роли** (видны в продукте):
  - `streamer` — обычный стример (зарегистрировался без агентства).
  - `agency_streamer` — стример NovaBoost Agency (новый slug, tier_0, visibility=public).
  - `nova_creator`, `rising_star`, `verified` — остаются «достижениями».
- **Staff-роли (internal):** `agency_manager, head_mentor, mentor, moderator, support, analyst, engineer, architect, system_owner, board, investor_pro, investor_viewer` — без изменений.
- Доступ к продукту (`canAccessProduct`) разрешён: всем staff + `streamer` + `agency_streamer`.
- Гейт «Доступ ограничен» переписать так, чтобы для `streamer` (не агентского) показывать лендинг, а не «Выйти из аккаунта».

### 2. Починка ролей и онбординга
- В функцию `onboarding-complete`:
  - принимать поле `roleSlug` от клиента (или брать из `admin_invites`);
  - корректно мапить slug → legacy `app_role` enum при вставке в `user_roles.role` (а не хардкод `'streamer'`);
  - всегда создавать минимум одну строку `user_roles` (по умолчанию `streamer`), чтобы гейт не блокировал.
- В `admin-create-user` и `admin-manage-user-role`: при создании сразу писать строку в `user_roles` (а не только в invite), чтобы пользователь получал доступ ещё до прохождения онбординга.
- `ensure_profile_access_data` (миграция): чинит `referral_code` (сейчас возвращает NULL), и роль определяется по приоритету slug-а (tier DESC), включая `agency_streamer`.
- В `app_role` enum добавить `agency_streamer`.

### 3. Полный flow одобрения заявки Агентства
Новая edge-функция **`agency-application-decide`** (`POST` от админа). При `action: 'approve'`:
1. Проверить permission `agency.applications.review`.
2. Создать пользователя через `auth.admin.createUser({ email, password_hash, email_confirm: true })` (пароль хешировался при подаче — переиспользуем `password_hash` через `admin.generateLink` + `updateUserById`, либо создаём с временным паролем и шлём magic-link).
3. Заполнить `profiles` (`full_name, username, tiktok_username, telegram, age, heard_about, agency_member=true`).
4. Привязать `inviter_referral_code` → запись в `agency_referral_usages`.
5. Вставить `user_roles` со slug `agency_streamer`.
6. Сгенерировать персональный реферальный код для нового стримера.
7. Обновить `agency_join_applications.status='approved', decided_by, decided_at, decision_note`.
8. Отправить письмо «Заявка одобрена» через **Resend** (новый секрет `RESEND_API_KEY`) со ссылкой на вход (magic-link) и кратким онбординг-гайдом.
9. Записать в `audit_log`.

При `action: 'reject'`: меняем статус на `rejected`, сохраняем `decision_note`, шлём письмо с причиной отказа.

### 4. Расширение таблицы заявок и админки
- В `agency_join_applications` добавить: `decided_by uuid`, `decided_at timestamptz`, `decision_note text`, `created_user_id uuid`, `assigned_referral_code text` (если ещё нет), `email_sent_at timestamptz`.
- Новый экран `AdminAgencyApplications.tsx` (заменит секцию в `AdminReferralSettings`):
  - таблица со статусами (Pending / Approved / Rejected) + фильтры;
  - модалка деталей: все поля заявки, IP, User-Agent, согласия (оферта v/дата), реферал пригласившего, telegram, возраст;
  - кнопки **Одобрить** (опц. ввести max_uses реф-кода и приветственное сообщение) и **Отклонить** (с обязательной причиной);
  - блок «История»: кто решил, когда, статус письма, id созданного пользователя, ссылка на него;
  - индикатор «Письмо отправлено / ошибка».

### 5. Письма (Resend)
- Подключить секрет `RESEND_API_KEY` через `add_secret`.
- Шаблоны (inline HTML в функции, без новой инфраструктуры):
  - `application_approved` — приветствие + magic-link + краткая инструкция.
  - `application_rejected` — отказ + причина + контакт поддержки.
- Логировать ответ Resend в `audit_log` и в `email_sent_at` заявки.

### 6. Гейт «Доступ ограничен» (фронт)
- Для роли `streamer` без `agency_streamer` показывать не «выйти», а CTA «Подать заявку в Агентство» с переходом на `/auth?tab=agency`.
- Для staff/agency_streamer — обычный продукт.

---

## Технические детали (для разработчика)

**Миграции:**
- `ALTER TYPE public.app_role ADD VALUE 'agency_streamer';`
- `INSERT INTO public.roles (slug, name, tier, visibility) VALUES ('agency_streamer', 'Agency Streamer', 'tier_0', 'public') ON CONFLICT DO NOTHING;`
- `ALTER TABLE public.agency_join_applications ADD COLUMN ... decided_by, decided_at, decision_note, created_user_id, email_sent_at;`
- Обновить `ensure_profile_access_data` (вернуть referral_code из `profiles.referral_code`) и `resolve_user_app_role` (учесть `agency_streamer`).
- Обновить `approve_agency_application` или (предпочтительно) вынести логику в edge-функцию и оставить RPC только для совместимости.

**Edge-функции:**
- Новая: `agency-application-decide` (verify_jwt=true, проверка `agency.applications.review` через `has_permission`).
- Правка: `onboarding-complete` — принять `roleSlug`, маппинг slug→enum.
- Правка: `admin-create-user` — сразу вставлять `user_roles` для выбранных слугов, не дожидаясь онбординга.
- Правка: `admin-manage-user-role` — корректный маппинг slug→legacy enum (используя готовую таблицу маппинга).

**Frontend:**
- `src/lib/roles.ts`: добавить `agency_streamer` в `ROLE_LABELS` и в проверку product-доступа.
- `src/App.tsx`: разветвление гейта (стример без агентства → CTA на заявку, не выход).
- `src/components/admin/AdminAgencyApplications.tsx`: новый компонент со списком, фильтрами, модалкой решения.
- `src/pages/Onboarding.tsx`: при выборе роли передавать `roleSlug` в `onboarding-complete`.
- `src/pages/Admin.tsx`: подключить новую вкладку.

**Безопасность:**
- `RESEND_API_KEY` — только в edge-функции, не во фронт.
- Хеш пароля заявки переиспользуем только для установки в auth.users через service-role; в логи не пишем.
- Все решения по заявкам — в `audit_log` (actor, before/after, ip).

---

## Что НЕ входит в этот заход
- Полноценный почтовый домен/брендирование шаблонов (только базовый HTML).
- Перенос обычных стримеров в `agency_streamer` ретроактивно (сделаем потом скриптом по факту).
- Двухфакторная аутентификация для админов.

После одобрения плана делаю всё одним связным набором миграций + функций + фронта.
