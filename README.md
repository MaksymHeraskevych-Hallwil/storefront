# StoreFront

Адмін-панель для керування інтернет-магазином: товари, замовлення, аналітика,
підтримка клієнтів. Окремий самостійний сервіс з власною базою даних —
не інтеграція з реальним Shopify, лише його адмінка як референс UX.

Повна схема (архітектура, модель даних, API, флоу процесів) — у
StoreFront Blueprint, обговорена окремо перед стартом розробки.

## Стек

- **frontend/** — Next.js (App Router) + [Shopify Polaris](https://polaris.shopify.com/) для UI адмінки
- **backend/** — Express + Prisma + PostgreSQL, REST API
- **сховище файлів** — S3-сумісне (MinIO локально, Cloudflare R2 у проді) — з Етапу 7

## Розробка

```bash
docker compose up -d   # Postgres на localhost:5433 (див. .env.example)
cd backend && npm install && npm run dev   # див. backend/README.md
```

Фронтенд з'явиться на Етапі 3.

## Дорожня карта

- [x] **0 — Ініціалізація.** Репозиторій, структура frontend/ + backend/, docker-compose з Postgres.
- [x] **1 — Фундамент бекенду.** Express, Prisma 7, модель User, логін + JWT (httpOnly-кука), role-middleware, юніт-тести.
- [ ] **2 — Домен товарів.** Product / ProductVariant / ProductImage, CRUD API, тести.
- [ ] **3 — Фундамент адмінки.** Next.js + Polaris, навігація, логін, список і картка товару.
- [ ] **4 — Домен замовлень.** Order / OrderItem, зміна статусу з перевіркою переходів.
- [ ] **5 — Підтримка клієнтів.** Ticket / TicketMessage, перегляд і відповідь.
- [ ] **6 — Аналітика.** Ендпоінти агрегації, дашборд.
- [ ] **7 — Медіа.** Завантаження зображень товару в S3-сумісне сховище.
- [ ] **8 — Стабілізація.** Тести, CI, повний docker-compose, деплой.
