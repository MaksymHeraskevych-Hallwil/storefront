import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { Role } from '@prisma/client'
import { AuthUser } from '../types/express'

const COOKIE_NAME = 'token'

/**
 * Читає JWT з httpOnly-куки (не з заголовка Authorization — токен
 * ніколи не потрапляє в JS на фронті, тому XSS не може його вкрасти).
 * При успіху кладе { userId, role } у req.user.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.[COOKIE_NAME]

  if (!token) {
    return res.status(401).json({ error: 'Потрібна автентифікація' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser
    req.user = { userId: payload.userId, role: payload.role }
    next()
  } catch {
    return res.status(401).json({ error: 'Недійсний або прострочений токен' })
  }
}

/**
 * Ставити ПІСЛЯ requireAuth. Перевіряє, що роль користувача — одна з
 * дозволених для цього роута (наприклад, DELETE товару — тільки ADMIN).
 */
export const requireRole =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостатньо прав' })
    }
    next()
  }

export const AUTH_COOKIE_NAME = COOKIE_NAME
