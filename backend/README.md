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

**Пастка:** `nodemon` за замовчуванням ігнорує `node_modules` — після
`prisma generate` (він пише саме туди) сервер сам не перезапуститься.
Якщо після зміни схеми бекенд відповідає 502 чи старими типами:

```bash
docker compose restart backend
```

## Порти

Ні Postgres, ні MinIO, ні сам бекенд не мають опублікованого порту — тільки
`expose` всередині docker-мережі (`postgres:5432`, `minio:9000`, `backend:5051` —
видно з інших контейнерів, недоступно з хоста чи мережі). Єдиний вхід
іззовні — nginx на `80`, який проксіює `/api/*` на бекенд. Перевірити
самому: `nc -z localhost 5051` має сказати "connection refused".

## Автентифікація

JWT лежить у httpOnly-кукі `token` (не в `localStorage` і не в заголовку
`Authorization`) — так токен ніколи не потрапляє в JS на фронті, і XSS
не може його прочитати. `requireAuth` перевіряє куку й кладе
`{ userId, role }` у `req.user`; `requireRole('ADMIN', ...)` ставиться
після нього там, де дія дозволена не всім ролям.

## Ендпоінти

| Метод і шлях                          | Роль          | Опис                                    |
| -------------------------------------- | ------------- | ---------------------------------------- |
| `POST /api/auth/login`                 | Public        | Вхід, видає httpOnly-куку з JWT          |
| `POST /api/auth/logout`                | Staff         | Видаляє куку                            |
| `GET /api/auth/me`                     | Staff         | Поточний користувач (потрібна кука)      |
| `GET /api/products`                    | Staff         | Список, пагінація (`page`/`limit`), фільтр `status`, пошук `search` за назвою |
| `POST /api/products`                   | Staff         | Створити товар                          |
| `GET /api/products/:id`                | Staff         | Товар з варіантами, зображеннями й кастомними полями |
| `PATCH /api/products/:id`              | Staff         | Оновити поля товару                     |
| `DELETE /api/products/:id`             | **Admin**     | Архівувати (`status: ARCHIVED`, не DELETE-рядок) |
| `POST /api/products/:id/variants`      | Staff         | Додати варіант (SKU унікальний)         |
| `PATCH /api/products/:id/variants/:variantId` | Staff  | Оновити варіант                         |
| `DELETE /api/products/:id/variants/:variantId` | Staff | Видалити варіант                        |
| `GET /api/products/:id/custom-fields`  | Staff         | Список кастомних полів товару            |
| `POST /api/products/:id/images`        | Staff         | Завантажити зображення (multipart, поле `file`, до 5 МБ) |
| `DELETE /api/products/:id/images/:imageId` | Staff     | Видалити зображення (запис і файл у сховищі) |
| `POST /api/products/:id/custom-fields` | Staff         | Додати поле (`key` унікальний у межах товару) |
| `PATCH /api/products/:id/custom-fields/:fieldId` | Staff | Оновити значення поля                  |
| `DELETE /api/products/:id/custom-fields/:fieldId` | Staff | Видалити поле                         |
| `GET /api/orders`                      | Staff         | Список, пагінація, фільтр `status`, з підрахованим `total` |
| `GET /api/orders/:id`                  | Staff         | Замовлення з позиціями й `allowedTransitions` |
| `PATCH /api/orders/:id/status`         | Staff         | Змінити статус (лише дозволений перехід, інакше `409`) |
| `GET /api/tickets`                     | Staff         | Список тікетів, пагінація, фільтр `status` |
| `GET /api/tickets/:id`                 | Staff         | Тікет з клієнтом і повним листуванням    |
| `POST /api/tickets/:id/messages`       | Staff         | Додати відповідь персоналу; `close: true` заразом закриває тікет |
| `PATCH /api/tickets/:id/status`        | Staff         | Змінити статус вручну (без обмежень на перехід) |
| `GET /api/analytics/summary`           | Staff         | Виручка, к-сть замовлень, нові клієнти, топ-5 товарів, щоденний ряд для графіків; опційно `?days=N` |

### Статуси замовлення

```
PENDING → PAID → FULFILLED
PENDING → CANCELLED
PAID → REFUNDED
```

`FULFILLED`/`CANCELLED`/`REFUNDED` — кінцеві, назад ходу немає.
Таблиця переходів (`ALLOWED_TRANSITIONS` в `orders.controller.ts`) —
єдине джерело правди: `GET /api/orders/:id` віддає `allowedTransitions`
для поточного статусу, і фронт малює кнопки тільки для них, не
дублюючи цю логіку.

### Статуси тікета підтримки

На відміну від замовлень, тут **немає** таблиці дозволених переходів —
`OPEN` / `PENDING_CUSTOMER` / `CLOSED` можна міняти в будь-якому напрямку
через `PATCH /api/tickets/:id/status`. Свідоме рішення: діалог підтримки
не такий лінійний, як оплата замовлення (клієнт може написати в уже
закритий тікет, персонал може помилково закрити й одразу відкрити
назад), а в завданні вимагалась лише можливість відповісти/закрити.
Відповідь персоналу (`POST .../messages`) сама рухає статус:
`PENDING_CUSTOMER`, якщо `close` не передано, або `CLOSED`, якщо
передано `close: true` — обидві дії виконуються атомарно одним
`prisma.$transaction`.

### Аналітика

`GET /api/analytics/summary` без `?days` рахує за весь час; з
`?days=N` — тільки замовлення, створені за останні N днів.

- **Виручка** — сума `price * quantity` по позиціях замовлень у статусі
  `PAID` або `FULFILLED`. `PENDING` ще не оплачено, `REFUNDED` гроші
  повернуто — обидва в суму не йдуть.
- **Замовлень** — кількість замовлень за період, **усі** статуси (не
  лише оплачені) — показує, скільки замовлень узагалі надійшло.
- **Нових клієнтів** — `Customer.createdAt` у межах періоду.
- **`series`** — по точці `{ date, revenue, orders, newCustomers }` на
  кожен день періоду (дні без подій — з нулями, щоб на графіку не було
  "дір"). Без `?days` — останні 90 днів: "весь час" щоденними
  стовпчиками нечитабельний, а картки зверху все одно рахуються за
  весь час. Дні групуються за UTC, як і `createdAt` у базі.
- **Топ-5 товарів** — ті самі позиції оплачених/виконаних замовлень,
  згруповані за товаром і відсортовані за кількістю проданих одиниць.

Рахується в JS (`reduce`/`Map`), а не SQL-агрегацією — Prisma не вміє
`SUM(price * quantity)` напряму без сирого запиту, а обсяг даних у MVP
не виправдовує `$queryRaw`. Той самий підхід, що й `orderTotal()` у
`orders.controller.ts`.

## Зображення: R2 / MinIO

Файли лежать в об'єктному сховищі, а не в базі: у PostgreSQL тільки
метадані (`ProductImage`: `key`, `url`, `mimeType`, `size`, `position`).

Код пише в **S3 API**, тож однаково працює з Cloudflare R2 і з MinIO.
Локально `docker compose` піднімає MinIO й створює бакет
`storefront-media` (одноразовий контейнер `minio-init`) — акаунт і картка
не потрібні. Порт MinIO **не опублікований**: картинки браузер тягне
через nginx за `/media/...` (`S3_PUBLIC_URL=http://localhost/media/storefront-media`),
тож політика "назовні тільки порт 80" лишається чинною. Через `/media/`
доступне лише читання (`GET`/`HEAD`); пише у сховище виключно бекенд.

### Що тут захищено

1. **Тип файлу визначається за вмістом**, а не за `Content-Type`: його
   присилає клієнт, тобто скрипт легко віддати як `image/png`. Дивимось
   на магічні байти (JPEG/PNG/WebP/GIF); перевірено реальним запитом.
2. **Ім'я файлу від користувача не використовується** — ключ
   генерується: `products/РІК/МІСЯЦЬ/uuid.ext`. Інакше `../../x` або
   перезапис чужого файлу однаковим іменем.
3. **Ліміт 5 МБ** на рівні multer — запит обривається, не дочитуючись
   (відповідь `400`). Файл тримається в пам'яті, на диск не пишеться.
4. **nginx** за замовчуванням відсікає тіло понад 1 МБ відповіддю `413`;
   для `/api/` стоїть `client_max_body_size 6m`, інакше завантаження
   ніколи б не дійшло до бекенду.
5. Файл спершу кладеться в сховище, потім пишеться рядок у базу; якщо
   запис не вдався — файл прибирається (без сиріт). Видалення навпаки:
   спершу рядок, потім файл (осиротілий файл — марні байти, осиротілий
   запис — битий URL в UI).
6. Файли віддаються з `Cache-Control: public, max-age=31536000, immutable`
   (ключ унікальний, вміст за ним не змінюється). Побічний ефект: після
   видалення зображення браузер, що його вже завантажував, ще може
   показати кешовану копію — на сховищі її вже немає.

Без `S3_*` змінних сховище вимкнене: завантаження відповідає `503`, решта
бекенду працює як і раніше.

### Перехід на справжній Cloudflare R2

Код міняти не треба — тільки змінні середовища. Скопіюйте
[`.env.example`](../.env.example) у `.env` у корені репозиторію (він в
`.gitignore`, ключі не потраплять у git) і підставте значення:

```
S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
S3_BUCKET=<назва бакета>
S3_ACCESS_KEY_ID=<з панелі R2>
S3_SECRET_ACCESS_KEY=<з панелі R2>
S3_PUBLIC_URL=https://pub-<hash>.r2.dev
```

Кроки в панелі Cloudflare: R2 → Create bucket → Settings → Public
access увімкнути (r2.dev-піддомен або власний домен) → Manage API
Tokens → токен з правами Object Read & Write. Далі
`docker compose up -d` — compose підхопить `.env` замість дефолтів MinIO.
Контейнери `minio`/`minio-init` тоді просто не використовуються.

## Тести

```bash
docker compose exec backend npm test
```

Юніт-тести без бази: zod-схеми, auth-middleware (мокані `req`/`res`,
токени підписані тестовим секретом), контролери товарів, замовлень і
тікетів (Prisma-клієнт замокано в `tests/helpers/prismaMock.ts`, за
зразком `my-blog`). Реальні
помилки Prisma (`P2002`, `P2025`) відтворюються справжнім класом
`Prisma.PrismaClientKnownRequestError`, а не рядковими заглушками — саме
так спіймали баг нижче. Інтеграційні тести проти реальної БД — пізніший
етап.

### Реальна пастка: форма помилки `P2002` під driver adapter

Класичний Prisma-код перевіряє дублікат унікального поля через
`error.meta.target` (масив назв полів). Під `@prisma/adapter-pg`
(Prisma 7) це поле **порожнє** — замість нього `meta.driverAdapterError
.cause.constraint.index` з іменем constraint'у в БД (`"ProductVariant_
sku_key"`). Перша версія коду це не врахувала: дубль SKU падав у 500
замість 409, доки не побачили реальний `EXPLAIN`-подібний вивід помилки
в логах контейнера. Код і тест у `products.controller.ts`
(`isUniqueConstraintError`) уже враховують саме цю форму.
