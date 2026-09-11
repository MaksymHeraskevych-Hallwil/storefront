import { z } from 'zod'

/**
 * Схеми вхідних даних. Бекенд не вірить клієнту на слово — усе, що
 * приходить у req.body/query/params, проходить через zod, перш ніж
 * потрапити в контролер.
 */

// ── Автентифікація ───────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Некоректний email'),
  password: z.string().min(1, 'Введіть пароль'),
})

// ── Параметри запиту ─────────────────────────────────────────────
// cuid(), а не uuid() — саме такий формат id генерує @default(cuid())
export const idParamSchema = z.object({
  id: z.string().cuid('Некоректний id'),
})

export const productVariantParamsSchema = z.object({
  id: z.string().cuid('Некоректний id товару'),
  variantId: z.string().cuid('Некоректний id варіанта'),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  // Верхня межа навмисна: без неї ?limit=1000000 обходив би пагінацію
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

// ── Товари ────────────────────────────────────────────────────────
const productStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'])

export const productListQuerySchema = paginationSchema.extend({
  status: productStatusEnum.optional(),
})

export const createProductSchema = z.object({
  title: z.string().trim().min(1, 'Назва не може бути порожньою').max(200),
  description: z.string().trim().max(5000).optional(),
  vendor: z.string().trim().max(120).optional(),
  status: productStatusEnum.optional(),
})

// Часткове оновлення: дозволяємо надіслати лише частину полів,
// але хоча б одне має бути — інакше PATCH без сенсу.
export const updateProductSchema = createProductSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Треба передати хоча б одне поле для оновлення' }
)

// ── Варіанти товару ──────────────────────────────────────────────
export const createVariantSchema = z.object({
  sku: z.string().trim().min(1, 'SKU не може бути порожнім').max(64),
  price: z.coerce.number().positive('Ціна має бути більшою за 0'),
  inventoryQty: z.coerce.number().int().min(0).default(0),
})

export const updateVariantSchema = createVariantSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Треба передати хоча б одне поле для оновлення' }
)
