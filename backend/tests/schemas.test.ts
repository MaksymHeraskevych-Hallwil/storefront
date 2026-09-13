import {
  loginSchema,
  idParamSchema,
  productListQuerySchema,
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  createCustomFieldSchema,
  updateOrderStatusSchema,
} from '../src/schemas'

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

describe('idParamSchema', () => {
  it('приймає валідний cuid', () => {
    expect(idParamSchema.safeParse({ id: 'cltest1234567890abcdefghi' }).success).toBe(true)
  })

  it('відхиляє довільний рядок на кшталт "123"', () => {
    expect(idParamSchema.safeParse({ id: '123' }).success).toBe(false)
  })
})

describe('createProductSchema', () => {
  it('приймає лише title, решта опціональні', () => {
    expect(createProductSchema.safeParse({ title: 'Кавова чашка' }).success).toBe(true)
  })

  it('відхиляє порожній title', () => {
    expect(createProductSchema.safeParse({ title: '' }).success).toBe(false)
  })
})

describe('updateProductSchema', () => {
  it('відхиляє порожній об\'єкт — PATCH без полів безглуздий', () => {
    expect(updateProductSchema.safeParse({}).success).toBe(false)
  })

  it('приймає часткове оновлення одним полем', () => {
    expect(updateProductSchema.safeParse({ vendor: 'StoreFront Goods' }).success).toBe(true)
  })
})

describe('createVariantSchema', () => {
  it('приводить price і inventoryQty з рядків (як прийшло б із форми)', () => {
    const result = createVariantSchema.safeParse({ sku: 'CUP-001', price: '12.50', inventoryQty: '40' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.price).toBe(12.5)
      expect(result.data.inventoryQty).toBe(40)
    }
  })

  it('відхиляє price <= 0', () => {
    expect(createVariantSchema.safeParse({ sku: 'CUP-001', price: 0 }).success).toBe(false)
  })
})

describe('productListQuerySchema', () => {
  it('search — опціональний, за замовчуванням не заданий', () => {
    const result = productListQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.search).toBeUndefined()
    }
  })

  it('приймає search разом зі status', () => {
    const result = productListQuerySchema.safeParse({ status: 'ACTIVE', search: 'чашка' })
    expect(result.success).toBe(true)
  })
})

describe('createCustomFieldSchema', () => {
  it('приймає ключ у форматі snake_case', () => {
    expect(
      createCustomFieldSchema.safeParse({ key: 'warranty_months', value: '12' }).success
    ).toBe(true)
  })

  it('відхиляє ключ із пробілами чи кирилицею', () => {
    expect(createCustomFieldSchema.safeParse({ key: 'матеріал виробу', value: 'x' }).success).toBe(
      false
    )
  })

  it('відхиляє порожнє значення', () => {
    expect(createCustomFieldSchema.safeParse({ key: 'material', value: '' }).success).toBe(false)
  })
})

describe('updateOrderStatusSchema', () => {
  it('приймає валідний статус', () => {
    expect(updateOrderStatusSchema.safeParse({ status: 'PAID' }).success).toBe(true)
  })

  it('відхиляє довільний рядок поза enum', () => {
    expect(updateOrderStatusSchema.safeParse({ status: 'SHIPPED' }).success).toBe(false)
  })
})
