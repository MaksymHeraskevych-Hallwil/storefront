jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: require('./helpers/prismaMock').prismaMock,
}))

import { getAnalyticsSummary } from '../src/controllers/analytics.controller'
import { prismaMock, mockRequest, mockResponse } from './helpers/prismaMock'

beforeEach(() => {
  jest.clearAllMocks()
  prismaMock.customer.count.mockResolvedValue(0)
  prismaMock.customer.findMany.mockResolvedValue([])
  prismaMock.order.findMany.mockResolvedValue([])
})

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

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        revenue: 550, // 100*2 + 50*1 + 100*3
        orderCount: 3,
        topProducts: [
          { productId: 'p1', title: 'Чашка', quantitySold: 5, revenue: 500 },
          { productId: 'p2', title: 'Блюдце', quantitySold: 1, revenue: 50 },
        ],
        days: null,
      })
    )
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

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ revenue: 0, orderCount: 0, newCustomers: 0, topProducts: [], days: null })
    )
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

  it('рахує нових клієнтів за період', async () => {
    prismaMock.order.count.mockResolvedValue(0)
    prismaMock.orderItem.findMany.mockResolvedValue([])
    prismaMock.customer.count.mockResolvedValue(4)
    const res = mockResponse()

    await getAnalyticsSummary(mockRequest({ validatedQuery: { days: 7 } }) as any, res)

    expect(prismaMock.customer.count).toHaveBeenCalledWith({
      where: { createdAt: expect.anything() },
    })
    expect(res.json.mock.calls[0][0].newCustomers).toBe(4)
  })

  describe('series', () => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    it('віддає по точці на кожен день періоду, включно з порожніми', async () => {
      prismaMock.order.count.mockResolvedValue(0)
      prismaMock.orderItem.findMany.mockResolvedValue([])
      const res = mockResponse()

      await getAnalyticsSummary(mockRequest({ validatedQuery: { days: 7 } }) as any, res)

      const { series } = res.json.mock.calls[0][0]
      expect(series).toHaveLength(7)
      expect(series[6].date).toBe(today.toISOString().slice(0, 10))
      expect(series.every((p: any) => p.revenue === 0 && p.orders === 0)).toBe(true)
    })

    it('без days бере останні 90 днів', async () => {
      prismaMock.order.count.mockResolvedValue(0)
      prismaMock.orderItem.findMany.mockResolvedValue([])
      const res = mockResponse()

      await getAnalyticsSummary(mockRequest({ validatedQuery: {} }) as any, res)

      expect(res.json.mock.calls[0][0].series).toHaveLength(90)
    })

    it('групує замовлення, виручку й клієнтів по днях; PENDING у виручку не йде', async () => {
      prismaMock.order.count.mockResolvedValue(3)
      prismaMock.orderItem.findMany.mockResolvedValue([])
      prismaMock.order.findMany.mockResolvedValue([
        { createdAt: today, status: 'PAID', items: [{ price: '100', quantity: 2 }] },
        { createdAt: today, status: 'PENDING', items: [{ price: '50', quantity: 1 }] },
        { createdAt: yesterday, status: 'FULFILLED', items: [{ price: '30', quantity: 1 }] },
      ])
      prismaMock.customer.findMany.mockResolvedValue([{ createdAt: yesterday }])
      const res = mockResponse()

      await getAnalyticsSummary(mockRequest({ validatedQuery: { days: 7 } }) as any, res)

      const { series } = res.json.mock.calls[0][0]
      expect(series[6]).toMatchObject({ orders: 2, revenue: 200, newCustomers: 0 })
      expect(series[5]).toMatchObject({ orders: 1, revenue: 30, newCustomers: 1 })
    })
  })
})
