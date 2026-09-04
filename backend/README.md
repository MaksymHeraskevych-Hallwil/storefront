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

Бекенд повністю в Docker — не `npm run dev` на хості. Причина: у Postgres
немає опублікованого порту (див. "Порти" нижче), тож із хоста до нього
однаково не достукатись напряму.

```bash
cd ..                                        # корінь storefront/
docker compose up -d --build
docker compose exec backend npm run prisma:seed   # разово: перший ADMIN
```

Далі все через **http://localhost** (порт 80, nginx) — не `:5051`, він
не опублікований. Код монтується з хоста через volume, тож правки в
`backend/src` підхоплює nodemon усередині контейнера без перезбірки.
Перезбирати образ (`--build`) треба тільки при зміні `package.json`.

Дефолтний адмін після сіда: `admin@storefront.dev` / `admin12345`
(тільки для локальної розробки — див. `prisma/seed.ts`).

Нову міграцію після зміни `prisma/schema.prisma` створюють так:

```bash
docker compose exec backend npx prisma migrate dev --name <назва>
```

## Порти

Ні Postgres, ні сам бекенд не мають опублікованого порту — тільки
`expose` всередині docker-мережі (`postgres:5432`, `backend:5051` —
видно з інших контейнерів, недоступно з хоста чи мережі). Єдиний вхід
іззовні — nginx на `80`, який проксіює `/api/*` на бекенд. Перевірити
самому: `nc -z localhost 5051` має сказати "connection refused".

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
docker compose exec backend npm test
```

Юніт-тести без бази: zod-схеми й auth-middleware (мокані `req`/`res`,
токени підписані тестовим секретом). Інтеграційні тести проти реальної
БД — пізніший етап.
