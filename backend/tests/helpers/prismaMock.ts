/**
 * Спільні хелпери для юніт-тестів контролерів: мок Prisma-клієнта
 * (jest.fn() на кожен метод, що реально використовується) і фейкові
 * req/res об'єкти Express — той самий підхід, що й у my-blog.
 */

export const prismaMock = {
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  productVariant: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  productCustomField: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
}

export const mockResponse = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

export const mockRequest = (overrides: any = {}) => ({
  body: {},
  params: {},
  validatedQuery: {},
  ...overrides,
})
