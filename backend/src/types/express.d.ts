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
    }
  }
}

export {}
