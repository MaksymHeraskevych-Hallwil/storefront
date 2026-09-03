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
