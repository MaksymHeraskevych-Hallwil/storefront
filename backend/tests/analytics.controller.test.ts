jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: require('./helpers/prismaMock').prismaMock,
}))

import { getAnalyticsSummary } from '../src/controllers/analytics.controller'
import { prismaMock, mockRequest, mockResponse } from './helpers/prismaMock'

beforeEach(() => jest.clearAllMocks())

describe('getAnalyticsSummary', () => {
  it('рахує виручку і топ-товари із позицій оплачених/виконаних замовлень', async () => {
    prismaMock.order.count.mockResolvedValue(3)
    prismaMock.orderItem.findMany.mockResolvedValue([
      { price: '100', quantity: 2, variant: { product: { id: 'p1', title: 'Чашка' } } },
      { price: '50', quantity: 1, variant: { product: { id: 'p2', title: 'Блюдце' } } },
      { price: '100', quantity: 3, variant: { product: { id: 'p1', title: 'Чашка' } } },
    ])
    const res = mockResponse()

    await getAnalyticsSummary(mockRequest({ validatedQuery: {} }) as any, res)

    expect(res.json).toHaveBeenCalledWith({
      revenue: 550, // 100*2 + 50*1 + 100*3
      orderCount: 3,
      topProducts: [
        { productId: 'p1', title: 'Чашка', quantitySold: 5, revenue: 500 },
        { productId: 'p2', title: 'Блюдце', quantitySold: 1, revenue: 50 },
      ],
      days: null,
    })
  })

  it('фільтрує замовлення за period, коли передано days', async () => {
    prismaMock.order.count.mockResolvedValue(0)
    prismaMock.orderItem.findMany.mockResolvedValue([])

    await getAnalyticsSummary(mockRequest({ validatedQuery: { days: 7 } }) as any, mockResponse())

    expect(prismaMock.order.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ createdAt: expect.anything() }) })
    )
    expect(prismaMock.orderItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          order: expect.objectContaining({
            status: { in: ['PAID', 'FULFILLED'] },
            createdAt: expect.anything(),
          }),
        }),
      })
    )
  })

  it('без замовлень повертає нулі й порожній список топ-товарів', async () => {
    prismaMock.order.count.mockResolvedValue(0)
    prismaMock.orderItem.findMany.mockResolvedValue([])
    const res = mockResponse()

    await getAnalyticsSummary(mockRequest({ validatedQuery: {} }) as any, res)

    expect(res.json).toHaveBeenCalledWith({
      revenue: 0,
      orderCount: 0,
      topProducts: [],
      days: null,
    })
  })

  it('обмежує топ-товари п\'ятьма позиціями', async () => {
    prismaMock.order.count.mockResolvedValue(6)
    prismaMock.orderItem.findMany.mockResolvedValue(
      Array.from({ length: 6 }, (_, i) => ({
        price: '10',
        quantity: 6 - i, // p0 продано найбільше, p5 — найменше
        variant: { product: { id: `p${i}`, title: `Товар ${i}` } },
      }))
    )
    const res = mockResponse()

    await getAnalyticsSummary(mockRequest({ validatedQuery: {} }) as any, res)

    const payload = res.json.mock.calls[0][0]
    expect(payload.topProducts).toHaveLength(5)
    expect(payload.topProducts[0].productId).toBe('p0')
  })
})
