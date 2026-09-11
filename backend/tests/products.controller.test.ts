jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: require('./helpers/prismaMock').prismaMock,
}))

import { Prisma } from '@prisma/client'
import {
  listProducts,
  createProduct,
  getProduct,
  updateProduct,
  archiveProduct,
  addVariant,
  updateVariant,
  deleteVariant,
  addCustomField,
  updateCustomField,
  deleteCustomField,
} from '../src/controllers/products.controller'
import { prismaMock, mockRequest, mockResponse } from './helpers/prismaMock'

// Ім'я constraint'у, яке реально повертає Postgres під driver adapter —
// саме ту форму, яку isUniqueConstraintError мусить розпізнати.
const skuConflictError = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: {
      driverAdapterError: { cause: { constraint: { index: 'ProductVariant_sku_key' } } },
    },
  })

const notFoundError = () =>
  new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: 'test',
  })

beforeEach(() => jest.clearAllMocks())

describe('listProducts', () => {
  it('фільтрує за статусом, коли він переданий у validatedQuery', async () => {
    prismaMock.product.findMany.mockResolvedValue([])
    prismaMock.product.count.mockResolvedValue(0)

    const req = mockRequest({ validatedQuery: { page: 1, limit: 20, status: 'ACTIVE' } })
    await listProducts(req as any, mockResponse())

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'ACTIVE' } })
    )
  })

  it('search шукає в title регістронезалежно, а не точним збігом', async () => {
    prismaMock.product.findMany.mockResolvedValue([])
    prismaMock.product.count.mockResolvedValue(0)

    const req = mockRequest({ validatedQuery: { page: 1, limit: 20, search: 'чашка' } })
    await listProducts(req as any, mockResponse())

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { title: { contains: 'чашка', mode: 'insensitive' } },
      })
    )
  })

  it('status і search комбінуються через AND, не перезаписують один одного', async () => {
    prismaMock.product.findMany.mockResolvedValue([])
    prismaMock.product.count.mockResolvedValue(0)

    const req = mockRequest({
      validatedQuery: { page: 1, limit: 20, status: 'ACTIVE', search: 'чашка' },
    })
    await listProducts(req as any, mockResponse())

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ACTIVE', title: { contains: 'чашка', mode: 'insensitive' } },
      })
    )
  })
})

describe('getProduct', () => {
  it('404, якщо товару немає', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null)
    const res = mockResponse()

    await getProduct(mockRequest({ params: { id: 'p1' } }) as any, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('updateProduct / archiveProduct', () => {
  it('updateProduct → 404, якщо Prisma кидає P2025', async () => {
    prismaMock.product.update.mockRejectedValue(notFoundError())
    const res = mockResponse()

    await updateProduct(mockRequest({ params: { id: 'missing' }, body: { title: 'x' } }) as any, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('archiveProduct — не видаляє рядок, а ставить статус ARCHIVED', async () => {
    prismaMock.product.update.mockResolvedValue({ id: 'p1', status: 'ARCHIVED' })
    const res = mockResponse()

    await archiveProduct(mockRequest({ params: { id: 'p1' } }) as any, res)

    expect(prismaMock.product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { status: 'ARCHIVED' },
    })
    expect(res.json).toHaveBeenCalledWith({ product: { id: 'p1', status: 'ARCHIVED' } })
  })
})

describe('addVariant', () => {
  it('404, якщо товар не знайдено', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null)
    const res = mockResponse()

    await addVariant(mockRequest({ params: { id: 'missing' }, body: { sku: 'A' } }) as any, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(prismaMock.productVariant.create).not.toHaveBeenCalled()
  })

  it('409, якщо SKU вже зайнятий (реальна форма помилки з driver adapter)', async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: 'p1' })
    prismaMock.productVariant.create.mockRejectedValue(skuConflictError())
    const res = mockResponse()

    await addVariant(mockRequest({ params: { id: 'p1' }, body: { sku: 'DUP' } }) as any, res)

    expect(res.status).toHaveBeenCalledWith(409)
  })
})

describe('updateVariant / deleteVariant — перевірка належності товару', () => {
  it('404, якщо variantId існує, але належить іншому товару', async () => {
    prismaMock.productVariant.findUnique.mockResolvedValue({ id: 'v1', productId: 'other-product' })
    const res = mockResponse()

    await updateVariant(
      mockRequest({ params: { id: 'p1', variantId: 'v1' }, body: { price: 10 } }) as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(404)
    expect(prismaMock.productVariant.update).not.toHaveBeenCalled()
  })

  it('deleteVariant віддає 204 при успіху', async () => {
    prismaMock.productVariant.findUnique.mockResolvedValue({ id: 'v1', productId: 'p1' })
    const res = mockResponse()

    await deleteVariant(mockRequest({ params: { id: 'p1', variantId: 'v1' } }) as any, res)

    expect(prismaMock.productVariant.delete).toHaveBeenCalledWith({ where: { id: 'v1' } })
    expect(res.status).toHaveBeenCalledWith(204)
  })
})

describe('addCustomField', () => {
  it('404, якщо товар не знайдено', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null)
    const res = mockResponse()

    await addCustomField(
      mockRequest({ params: { id: 'missing' }, body: { key: 'material', value: 'x' } }) as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(404)
    expect(prismaMock.productCustomField.create).not.toHaveBeenCalled()
  })

  it('409, якщо такий ключ у товару вже є (constraint productId+key)', async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: 'p1' })
    prismaMock.productCustomField.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: {
          driverAdapterError: {
            cause: { constraint: { index: 'ProductCustomField_productId_key_key' } },
          },
        },
      })
    )
    const res = mockResponse()

    await addCustomField(
      mockRequest({ params: { id: 'p1' }, body: { key: 'material', value: 'x' } }) as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(409)
  })
})

describe('updateCustomField / deleteCustomField — перевірка належності товару', () => {
  it('404, якщо fieldId існує, але належить іншому товару', async () => {
    prismaMock.productCustomField.findUnique.mockResolvedValue({
      id: 'f1',
      productId: 'other-product',
    })
    const res = mockResponse()

    await updateCustomField(
      mockRequest({ params: { id: 'p1', fieldId: 'f1' }, body: { value: 'нове' } }) as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(404)
    expect(prismaMock.productCustomField.update).not.toHaveBeenCalled()
  })

  it('deleteCustomField віддає 204 при успіху', async () => {
    prismaMock.productCustomField.findUnique.mockResolvedValue({ id: 'f1', productId: 'p1' })
    const res = mockResponse()

    await deleteCustomField(mockRequest({ params: { id: 'p1', fieldId: 'f1' } }) as any, res)

    expect(prismaMock.productCustomField.delete).toHaveBeenCalledWith({ where: { id: 'f1' } })
    expect(res.status).toHaveBeenCalledWith(204)
  })
})

describe('createProduct', () => {
  it('201 з тілом, яке вже провалідував zod', async () => {
    prismaMock.product.create.mockResolvedValue({ id: 'p1', title: 'Нове' })
    const res = mockResponse()

    await createProduct(mockRequest({ body: { title: 'Нове' } }) as any, res)

    expect(res.status).toHaveBeenCalledWith(201)
  })
})
