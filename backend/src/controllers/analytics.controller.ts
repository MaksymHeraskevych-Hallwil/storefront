import { Request, Response } from 'express'
import { OrderStatus } from '@prisma/client'
import prisma from '../lib/prisma'

// Виручка — гроші, які реально залишились у магазині: PAID і FULFILLED
// рахуються, PENDING (ще не оплачено) і REFUNDED (повернено) — ні.
const REVENUE_STATUSES: OrderStatus[] = ['PAID', 'FULFILLED']

// Без ?days графік показує останні 90 днів — "весь час" щоденними стовпчиками
// став би нечитабельним, а картки зверху все одно рахуються за весь час.
const DEFAULT_SERIES_DAYS = 90

const DAY_MS = 24 * 60 * 60 * 1000
const dayKey = (d: Date) => d.toISOString().slice(0, 10)

export const getAnalyticsSummary = async (req: Request, res: Response) => {
  const { days } = req.validatedQuery as { days?: number }

  const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined
  const dateWhere = since ? { createdAt: { gte: since } } : {}

  // Дні рахуються за UTC, як і createdAt у базі — без прив'язки до часової зони клієнта.
  const seriesDays = days ?? DEFAULT_SERIES_DAYS
  const today = new Date()
  const seriesStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - (seriesDays - 1) * DAY_MS)
  const seriesWhere = { createdAt: { gte: seriesStart } }

  const [orderCount, newCustomers, seriesOrders, seriesCustomers, revenueItems] = await Promise.all([
    prisma.order.count({ where: dateWhere }),
    prisma.customer.count({ where: dateWhere }),
    prisma.order.findMany({
      where: seriesWhere,
      select: { createdAt: true, status: true, items: { select: { price: true, quantity: true } } },
    }),
    prisma.customer.findMany({ where: seriesWhere, select: { createdAt: true } }),
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

  const series = new Map<string, { date: string; revenue: number; orders: number; newCustomers: number }>()
  for (let i = 0; i < seriesDays; i++) {
    const date = dayKey(new Date(seriesStart.getTime() + i * DAY_MS))
    series.set(date, { date, revenue: 0, orders: 0, newCustomers: 0 })
  }

  for (const order of seriesOrders) {
    const point = series.get(dayKey(order.createdAt))
    if (!point) continue
    point.orders += 1
    if (REVENUE_STATUSES.includes(order.status)) {
      point.revenue += order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
    }
  }

  for (const customer of seriesCustomers) {
    const point = series.get(dayKey(customer.createdAt))
    if (point) point.newCustomers += 1
  }

  res.json({
    revenue,
    orderCount,
    newCustomers,
    topProducts,
    days: days ?? null,
    series: [...series.values()],
  })
}
