import { loginSchema } from '../src/schemas'

describe('loginSchema', () => {
  it('приймає коректні email і пароль', () => {
    const result = loginSchema.safeParse({
      email: 'Admin@Storefront.dev',
      password: 'admin12345',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      // email нормалізується: trim + lowercase
      expect(result.data.email).toBe('admin@storefront.dev')
    }
  })

  it('відхиляє некоректний email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'x' })
    expect(result.success).toBe(false)
  })

  it('відхиляє порожній пароль', () => {
    const result = loginSchema.safeParse({ email: 'admin@storefront.dev', password: '' })
    expect(result.success).toBe(false)
  })
})
