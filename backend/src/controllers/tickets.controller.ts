import { Request, Response } from 'express'
import { Prisma, TicketStatus } from '@prisma/client'
import prisma from '../lib/prisma'

export const listTickets = async (req: Request, res: Response) => {
  const { page, limit, status } = req.validatedQuery as {
    page: number
    limit: number
    status?: TicketStatus
  }

  const where: Prisma.TicketWhereInput = status ? { status } : {}

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, email: true, name: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ])

  res.json({ data: tickets, meta: { page, limit, total } })
}

export const getTicket = async (req: Request, res: Response) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id as string },
    include: {
      customer: { select: { id: true, email: true, name: true, phone: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!ticket) {
    return res.status(404).json({ error: 'Тікет не знайдено' })
  }

  res.json({ ticket })
}

export const addTicketMessage = async (req: Request, res: Response) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id as string } })
  if (!ticket) {
    return res.status(404).json({ error: 'Тікет не знайдено' })
  }

  const { body, close } = req.body as { body: string; close?: boolean }

  const [message] = await prisma.$transaction([
    prisma.ticketMessage.create({
      data: { ticketId: ticket.id, authorType: 'STAFF', body },
    }),
    prisma.ticket.update({
      where: { id: ticket.id },
      // Відповідь персоналу завжди означає "м'яч на боці клієнта" —
      // або тікет одразу закрито, якщо відповідь вирішила питання.
      data: { status: close ? 'CLOSED' : 'PENDING_CUSTOMER' },
    }),
  ])

  res.status(201).json({ message })
}

export const updateTicketStatus = async (req: Request, res: Response) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id as string } })
  if (!ticket) {
    return res.status(404).json({ error: 'Тікет не знайдено' })
  }

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: req.body.status as TicketStatus },
  })

  res.json({ ticket: updated })
}
