import { ZodType } from 'zod'
import { Request, Response, NextFunction } from 'express'

type Source = 'body' | 'query' | 'params'

/**
 * Перевіряє частину запиту за схемою zod. При успіху кладе розібрані
 * (приведені до типів) дані назад у req; при помилці відповідає 400
 * зі списком полів, не пускаючи запит у контролер.
 */
export const validate =
  (schema: ZodType, source: Source = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source])

    if (!result.success) {
      return res.status(400).json({
        error: 'Некоректні дані',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.') || source,
          message: issue.message,
        })),
      })
    }

    req[source] = result.data
    next()
  }

export default validate
