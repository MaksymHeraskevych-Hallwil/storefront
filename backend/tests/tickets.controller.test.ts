jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: require('./helpers/prismaMock').prismaMock,
}))

import {
  listTickets,
  getTicket,
  addTicketMessage,
  updateTicketStatus,
} from '../src/controllers/tickets.controller'
import { prismaMock, mockRequest, mockResponse } from './helpers/prismaMock'

beforeEach(() => jest.clearAllMocks())

describe('listTickets', () => {
  it('повертає дані й meta з пагінацією', async () => {
    prismaMock.ticket.findMany.mockResolvedValue([{ id: 't1', status: 'OPEN' }])
    prismaMock.ticket.count.mockResolvedValue(1)
    const res = mockResponse()

    await listTickets(mockRequest({ validatedQuery: { page: 1, limit: 20 } }) as any, res)

    expect(res.json).toHaveBeenCalledWith({
      data: [{ id: 't1', status: 'OPEN' }],
      meta: { page: 1, limit: 20, total: 1 },
    })
  })

  it('фільтрує за статусом, коли він переданий', async () => {
    prismaMock.ticket.findMany.mockResolvedValue([])
    prismaMock.ticket.count.mockResolvedValue(0)

    await listTickets(
      mockRequest({ validatedQuery: { page: 1, limit: 20, status: 'CLOSED' } }) as any,
      mockResponse()
    )

    expect(prismaMock.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'CLOSED' } })
    )
  })
})

describe('getTicket', () => {
  it('повертає 404, якщо тікет не знайдено', async () => {
    prismaMock.ticket.findUnique.mockResolvedValue(null)
    const res = mockResponse()

    await getTicket(mockRequest({ params: { id: 'missing' } }) as any, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({ error: 'Тікет не знайдено' })
  })

  it('повертає тікет разом з повідомленнями', async () => {
    const ticket = { id: 't1', messages: [] }
    prismaMock.ticket.findUnique.mockResolvedValue(ticket)
    const res = mockResponse()

    await getTicket(mockRequest({ params: { id: 't1' } }) as any, res)

    expect(res.json).toHaveBeenCalledWith({ ticket })
  })
})

describe('addTicketMessage', () => {
  it('повертає 404, якщо тікет не знайдено', async () => {
    prismaMock.ticket.findUnique.mockResolvedValue(null)
    const res = mockResponse()

    await addTicketMessage(
      mockRequest({ params: { id: 'missing' }, body: { body: 'привіт' } }) as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(404)
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('без close переводить тікет у PENDING_CUSTOMER', async () => {
    prismaMock.ticket.findUnique.mockResolvedValue({ id: 't1', status: 'OPEN' })
    const message = { id: 'm1', body: 'Відповідь' }
    prismaMock.$transaction.mockResolvedValue([message, { id: 't1', status: 'PENDING_CUSTOMER' }])
    const res = mockResponse()

    await addTicketMessage(
      mockRequest({ params: { id: 't1' }, body: { body: 'Відповідь' } }) as any,
      res
    )

    expect(prismaMock.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'PENDING_CUSTOMER' } })
    )
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ message })
  })

  it('з close: true переводить тікет у CLOSED', async () => {
    prismaMock.ticket.findUnique.mockResolvedValue({ id: 't1', status: 'OPEN' })
    const message = { id: 'm1', body: 'Все вирішено' }
    prismaMock.$transaction.mockResolvedValue([message, { id: 't1', status: 'CLOSED' }])
    const res = mockResponse()

    await addTicketMessage(
      mockRequest({ params: { id: 't1' }, body: { body: 'Все вирішено', close: true } }) as any,
      res
    )

    expect(prismaMock.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CLOSED' } })
    )
  })
})

describe('updateTicketStatus', () => {
  it('повертає 404, якщо тікет не знайдено', async () => {
    prismaMock.ticket.findUnique.mockResolvedValue(null)
    const res = mockResponse()

    await updateTicketStatus(
      mockRequest({ params: { id: 'missing' }, body: { status: 'CLOSED' } }) as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('оновлює статус і повертає тікет', async () => {
    prismaMock.ticket.findUnique.mockResolvedValue({ id: 't1', status: 'OPEN' })
    const updated = { id: 't1', status: 'CLOSED' }
    prismaMock.ticket.update.mockResolvedValue(updated)
    const res = mockResponse()

    await updateTicketStatus(
      mockRequest({ params: { id: 't1' }, body: { status: 'CLOSED' } }) as any,
      res
    )

    expect(res.json).toHaveBeenCalledWith({ ticket: updated })
  })
})
