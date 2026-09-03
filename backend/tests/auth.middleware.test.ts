import jwt from 'jsonwebtoken'
import { Request, Response } from 'express'
import { requireAuth, requireRole } from '../src/middlewares/auth.middleware'

process.env.JWT_SECRET = 'test-secret'

const mockRes = () => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res as Response
}

describe('requireAuth', () => {
  it('пропускає далі з дійсним токеном у куці', () => {
    const token = jwt.sign({ userId: 'u1', role: 'ADMIN' }, process.env.JWT_SECRET as string)
    const req = { cookies: { token } } as unknown as Request
    const res = mockRes()
    const next = jest.fn()

    requireAuth(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.user).toEqual({ userId: 'u1', role: 'ADMIN' })
  })

  it('віддає 401 без куки', () => {
    const req = { cookies: {} } as unknown as Request
    const res = mockRes()
    const next = jest.fn()

    requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('віддає 401 з підробленим токеном', () => {
    const req = { cookies: { token: 'garbage' } } as unknown as Request
    const res = mockRes()
    const next = jest.fn()

    requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })
})

describe('requireRole', () => {
  it('пропускає користувача з дозволеною роллю', () => {
    const req = { user: { userId: 'u1', role: 'ADMIN' as const } } as unknown as Request
    const res = mockRes()
    const next = jest.fn()

    requireRole('ADMIN', 'STAFF')(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('віддає 403, якщо ролі немає в списку дозволених', () => {
    const req = { user: { userId: 'u1', role: 'STAFF' as const } } as unknown as Request
    const res = mockRes()
    const next = jest.fn()

    requireRole('ADMIN')(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})
