import { Role } from '@prisma/client'

// Дані з JWT-пейлоада, які requireAuth кладе в req.user.
export interface AuthUser {
  userId: string
  role: Role
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
      // Куди validate.middleware кладе розібрані query-параметри —
      // req.query переписати не можна, він лише для читання.
      validatedQuery?: unknown
    }
  }
}

export {}
