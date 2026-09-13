import { Request, Response } from 'express'
import { Prisma, OrderStatus } from '@prisma/client'
import prisma from '../lib/prisma'

// Той самий стейт-машин, що й у StoreFront Blueprint: PENDING — єдиний
// статус, з якого можна піти двома шляхами; решта — по одному кроку
// вперед або в термінальний стан. FULFILLED/CANCELLED/REFUNDED — кінцеві,
// назад ходу немає (нове замовлення — на повернення коштів, а не відкат).
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['FULFILLED', 'REFUNDED'],
  FULFILLED: [],
  CANCELLED: [],
  REFUNDED: [],
}

const orderTotal = (items: { price: Prisma.Decimal | string; quantity: number }[]) =>
  items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

export const listOrders = async (req: Request, res: Response) => {
  const { page, limit, status } = req.validatedQuery as {
    page: number
    limit: number
    status?: OrderStatus
  }

  const where: Prisma.OrderWhereInput = status ? { status } : {}

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, email: true, name: true } },
        items: { select: { price: true, quantity: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  const data = orders.map(({ items, ...order }) => ({ ...order, total: orderTotal(items) }))

  res.json({ data, meta: { page, limit, total } })
}

export const getOrder = async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id as string },
    include: {
      customer: { select: { id: true, email: true, name: true, phone: true } },
      items: {
        include: {
          variant: { select: { id: true, sku: true, product: { select: { title: true } } } },
        },
      },
    },
  })

  if (!order) {
    return res.status(404).json({ error: 'Замовлення не знайдено' })
  }

  res.json({
    order: {
      ...order,
      total: orderTotal(order.items),
      // Фронт рендерить кнопки лише для дозволених переходів замість
      // довільного select — і не дублює цю таблицю сам.
      allowedTransitions: ALLOWED_TRANSITIONS[order.status],
    },
  })
}

export const updateOrderStatus = async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id as string } })
  if (!order) {
    return res.status(404).json({ error: 'Замовлення не знайдено' })
  }

  const nextStatus = req.body.status as OrderStatus
  const allowed = ALLOWED_TRANSITIONS[order.status]

  if (!allowed.includes(nextStatus)) {
    return res.status(409).json({
      error: `Перехід ${order.status} → ${nextStatus} не дозволений`,
      allowedTransitions: allowed,
    })
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: nextStatus },
  })

  res.json({ order: updated })
}
