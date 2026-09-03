# backend

Express + Prisma 7 + PostgreSQL. REST API для адмін-панелі StoreFront.

## Стек і конвенції

Той самий стиль, що й у `my-express-app` (проєкт my-blog): `app.ts` збирає
Express-застосунок і НЕ піднімає сервер (щоб тести могли передати `app`
у supertest), `server.ts` тільки викликає `app.listen`. Zod-схеми — в
одному файлі `src/schemas/index.ts`, розділені коментарями по доменах.

**Prisma 7 breaking change:** `datasource.url` більше не працює у
`schema.prisma`. Конекшн-стрінг для `prisma migrate`/`prisma db` тепер
живе в `prisma.config.ts`, а рантайм-клієнт (`src/lib/prisma.ts`)
підключається через driver adapter (`@prisma/adapter-pg`), а не напряму
за URL-рядком.

## Локальний запуск

```bash
cp .env.example .env          # раз, значення вже збігаються з ../docker-compose.yml
cd .. && docker compose up -d # підняти Postgres
cd backend
npm install
npx prisma migrate dev        # накотити міграції
npm run prisma:seed           # створити першого ADMIN-користувача
npm run dev                   # http://localhost:5051
```

Дефолтний адмін після сіда: `admin@storefront.dev` / `admin12345`
(тільки для локальної розробки — див. `prisma/seed.ts`).

**Порт бази — 5433, не 5432.** На машині розробника вже може бути
нативний (не-Docker) Postgres на стандартному порту; щоб уникнути
конфлікту, контейнер мапиться на `5433:5432` (див. `../docker-compose.yml`).

## Автентифікація

JWT лежить у httpOnly-кукі `token` (не в `localStorage` і не в заголовку
`Authorization`) — так токен ніколи не потрапляє в JS на фронті, і XSS
не може його прочитати. `requireAuth` перевіряє куку й кладе
`{ userId, role }` у `req.user`; `requireRole('ADMIN', ...)` ставиться
після нього там, де дія дозволена не всім ролям.

## Ендпоінти (Етап 1)

| Метод і шлях          | Опис                                  |
| ---------------------- | -------------------------------------- |
| `POST /api/auth/login`  | Вхід, видає httpOnly-куку з JWT        |
| `POST /api/auth/logout` | Видаляє куку                          |
| `GET /api/auth/me`      | Поточний користувач (потрібна кука)    |

## Тести

```bash
npm test
```

Юніт-тести без бази: zod-схеми й auth-middleware (мокані `req`/`res`,
токени підписані тестовим секретом). Інтеграційні тести проти реальної
БД — пізніший етап.
