import { Request, Response } from 'express'
import { OrderStatus } from '@prisma/client'
import prisma from '../lib/prisma'

// Виручка — гроші, які реально залишились у магазині: PAID і FULFILLED
// рахуються, PENDING (ще не оплачено) і REFUNDED (повернено) — ні.
const REVENUE_STATUSES: OrderStatus[] = ['PAID', 'FULFILLED']

export const getAnalyticsSummary = async (req: Request, res: Response) => {
  const { days } = req.validatedQuery as { days?: number }

  const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined
  const dateWhere = since ? { createdAt: { gte: since } } : {}

  const [orderCount, revenueItems] = await Promise.all([
    prisma.order.count({ where: dateWhere }),
    prisma.orderItem.findMany({
      where: { order: { status: { in: REVENUE_STATUSES }, ...dateWhere } },
      select: {
        price: true,
        quantity: true,
        variant: { select: { product: { select: { id: true, title: true } } } },
      },
    }),
  ])

  let revenue = 0
  const byProduct = new Map<string, { title: string; quantitySold: number; revenue: number }>()

  for (const item of revenueItems) {
    const lineTotal = Number(item.price) * item.quantity
    revenue += lineTotal

    const { id, title } = item.variant.product
    const entry = byProduct.get(id) ?? { title, quantitySold: 0, revenue: 0 }
    entry.quantitySold += item.quantity
    entry.revenue += lineTotal
    byProduct.set(id, entry)
  }

  const topProducts = [...byProduct.entries()]
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5)

  res.json({ revenue, orderCount, topProducts, days: days ?? null })
}
