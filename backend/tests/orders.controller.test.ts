jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: require('./helpers/prismaMock').prismaMock,
}))

import { listOrders, getOrder, updateOrderStatus } from '../src/controllers/orders.controller'
import { prismaMock, mockRequest, mockResponse } from './helpers/prismaMock'

beforeEach(() => jest.clearAllMocks())

describe('listOrders', () => {
  it('рахує total із суми price * quantity по всіх позиціях', async () => {
    prismaMock.order.findMany.mockResolvedValue([
      {
        id: 'o1',
        status: 'PENDING',
        items: [
          { price: '100', quantity: 2 },
          { price: '50', quantity: 1 },
        ],
      },
    ])
    prismaMock.order.count.mockResolvedValue(1)
    const res = mockResponse()

    await listOrders(mockRequest({ validatedQuery: { page: 1, limit: 20 } }) as any, res)

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: [expect.objectContaining({ id: 'o1', total: 250 })] })
    )
  })

  it('фільтрує за статусом, коли він переданий', async () => {
    prismaMock.order.findMany.mockResolvedValue([])
    prismaMock.order.count.mockResolvedValue(0)

    await listOrders(
      mockRequest({ validatedQuery: { page: 1, limit: 20, status: 'PAID' } }) as any,
      mockResponse()
    )

    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'PAID' } })
    )
  })
})

describe('getOrder', () => {
  it('404, якщо замовлення немає', async () => {
    prismaMock.order.findUnique.mockResolvedValue(null)
    const res = mockResponse()

    await getOrder(mockRequest({ params: { id: 'missing' } }) as any, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})

describe('updateOrderStatus — стейт-машина переходів', () => {
  it('PENDING → PAID: дозволено', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 'o1', status: 'PENDING' })
    prismaMock.order.update.mockResolvedValue({ id: 'o1', status: 'PAID' })
    const res = mockResponse()

    await updateOrderStatus(
      mockRequest({ params: { id: 'o1' }, body: { status: 'PAID' } }) as any,
      res
    )

    expect(prismaMock.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: { status: 'PAID' },
    })
    expect(res.json).toHaveBeenCalledWith({ order: { id: 'o1', status: 'PAID' } })
  })

  it('PENDING → FULFILLED: заборонено (не можна перескочити PAID)', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 'o1', status: 'PENDING' })
    const res = mockResponse()

    await updateOrderStatus(
      mockRequest({ params: { id: 'o1' }, body: { status: 'FULFILLED' } }) as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(409)
    expect(prismaMock.order.update).not.toHaveBeenCalled()
  })

  it.each(['FULFILLED', 'CANCELLED', 'REFUNDED'] as const)(
    '%s — термінальний статус, з нього нікуди',
    async (terminalStatus) => {
      prismaMock.order.findUnique.mockResolvedValue({ id: 'o1', status: terminalStatus })
      const res = mockResponse()

      await updateOrderStatus(
        mockRequest({ params: { id: 'o1' }, body: { status: 'PENDING' } }) as any,
        res
      )

      expect(res.status).toHaveBeenCalledWith(409)
      expect(prismaMock.order.update).not.toHaveBeenCalled()
    }
  )

  it('PAID → REFUNDED: дозволено (виняткова гілка, не тільки FULFILLED)', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 'o1', status: 'PAID' })
    prismaMock.order.update.mockResolvedValue({ id: 'o1', status: 'REFUNDED' })
    const res = mockResponse()

    await updateOrderStatus(
      mockRequest({ params: { id: 'o1' }, body: { status: 'REFUNDED' } }) as any,
      res
    )

    expect(res.status).not.toHaveBeenCalledWith(409)
  })

  it('404, якщо замовлення не знайдено', async () => {
    prismaMock.order.findUnique.mockResolvedValue(null)
    const res = mockResponse()

    await updateOrderStatus(
      mockRequest({ params: { id: 'missing' }, body: { status: 'PAID' } }) as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(404)
  })
})
