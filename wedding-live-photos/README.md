# Живая лента фото (отдельно от пригласительного сайта)

Гости сканируют QR → вводят **код** → снимают или выбирают фото → снимок попадает в **Supabase Storage**, метаданные — в таблицу `photos`. Пригласительная в корне репозитория **не затрагивается**.

## Supabase: подготовка

1. Создайте проект на [supabase.com](https://supabase.com).
2. **SQL Editor** — выполните `supabase/schema.sql`.
3. **Storage** → **New bucket**:
   - имя: `wedding-photos` (или своё, тогда укажите `SUPABASE_BUCKET` в `.env`);
   - включите **Public bucket** (чтобы лента показывала картинки по публичному URL; перечисление снимков по-прежнему только с PIN через ваш API).
4. **Project Settings → API**:
   - **`SUPABASE_SERVICE_ROLE_KEY`** — только секрет **service_role** (длинный JWT). Им загружается Express — Storage и таблица `photos`.
   - **`VITE_SUPABASE_PUBLISHABLE_KEY`** — ключ **publishable** (`sb_publishable_…`) или legacy anon — только для браузерного клиента в `src/lib/supabase/client.ts`.
   - Частая ошибка: положить publishable в `SUPABASE_SERVICE_ROLE_KEY` → ответы API **500**. Ключи не путать.
   - Ещё ошибка: вставить **anon** (JWT `role: anon`) вместо **service_role** — оба выглядят как длинный `eyJ...`, но сервер без роли `service_role` не может читать таблицу. Секреты в Git не коммитить.

### Не Next.js

Шаблон с `app/page.tsx`, `middleware.ts` и `utils/supabase/server.ts` из документации Supabase **для Next.js** сюда не копировали: у нас **Vite + React** и **Express**. Браузерный клиент — `src/lib/supabase/client.ts` (`createBrowserClient` из `@supabase/ssr`). Загрузка фото по-прежнему через API и **service_role** на сервере.

## Запуск для проверки

```bash
cd wedding-live-photos
npm install
cp .env.example .env
# Заполните SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, EVENT_PIN и при необходимости VITE_* для клиента
npm run dev
```

- Фронт: `http://localhost:5174` (прокси `/api` на бэкенд).
- API: `http://127.0.0.1:8787`.

## Production

Нужен процесс Node с переменными из `.env` (Express загружает файлы в Supabase):

```bash
cd wedding-live-photos
npm install
npm run build
NODE_ENV=production PORT=8787 npm start
```

HTTPS на домене желателен для камеры на телефонах.

## QR-код

QR ведёт на URL вашего деплоя ленты. Код мероприятия (`EVENT_PIN`) — на карточке в зале.

## API и данные

- Файлы: **Supabase Storage** (bucket из `SUPABASE_BUCKET`).
- Метаданные: таблица **`public.photos`**.
- Скачивание одного файла: `GET /api/photos/:id/download` с заголовком `X-Event-Pin`.

На клиенте **нет уменьшения разрешения** (кроме перекодирования с камеры в JPEG q=1.0). Лимит размера одного файла — `MAX_FILE_MB`.

Резерв: периодические бэкапы через Supabase (или экспорт bucket + дамп таблицы).
