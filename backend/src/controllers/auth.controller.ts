import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import { AUTH_COOKIE_NAME } from '../middlewares/auth.middleware'

const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000 // 8 годин — робоча зміна

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ error: 'Неправильний email або пароль' })
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Неправильний email або пароль' })
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '8h' }
  )

  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE_MS,
  })

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  })
}

export const logout = (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME)
  res.status(204).send()
}

export const me = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
  if (!user) {
    return res.status(401).json({ error: 'Користувача не знайдено' })
  }
  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  })
}
