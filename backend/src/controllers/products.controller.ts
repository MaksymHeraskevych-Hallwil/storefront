import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '../lib/prisma'

// ── Товари ────────────────────────────────────────────────────────

export const listProducts = async (req: Request, res: Response) => {
  const { page, limit, status } = req.validatedQuery as {
    page: number
    limit: number
    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  }

  const where = status ? { status } : {}

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { variants: true } } },
    }),
    prisma.product.count({ where }),
  ])

  res.json({ data: items, meta: { page, limit, total } })
}

export const createProduct = async (req: Request, res: Response) => {
  const product = await prisma.product.create({ data: req.body })
  res.status(201).json({ product })
}

export const getProduct = async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id as string },
    include: {
      variants: { orderBy: { createdAt: 'asc' } },
      images: { orderBy: { position: 'asc' } },
    },
  })

  if (!product) {
    return res.status(404).json({ error: 'Товар не знайдено' })
  }

  res.json({ product })
}

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id as string },
      data: req.body,
    })
    res.json({ product })
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: 'Товар не знайдено' })
    }
    throw error
  }
}

// "Видалення" — це зміна статусу, не DELETE рядка: товар може вже
// бути в чиємусь замовленні (Етап 4), і історію не можна ламати.
export const archiveProduct = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id as string },
      data: { status: 'ARCHIVED' },
    })
    res.json({ product })
  } catch (error) {
    if (isNotFoundError(error)) {
      return res.status(404).json({ error: 'Товар не знайдено' })
    }
    throw error
  }
}

// ── Варіанти товару ──────────────────────────────────────────────

export const addVariant = async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id as string } })
  if (!product) {
    return res.status(404).json({ error: 'Товар не знайдено' })
  }

  try {
    const variant = await prisma.productVariant.create({
      data: { ...req.body, productId: product.id },
    })
    res.status(201).json({ variant })
  } catch (error) {
    if (isUniqueConstraintError(error, 'sku')) {
      return res.status(409).json({ error: 'SKU вже використовується іншим варіантом' })
    }
    throw error
  }
}

export const updateVariant = async (req: Request, res: Response) => {
  const variant = await findOwnedVariant(req.params.id as string, req.params.variantId as string)
  if (!variant) {
    return res.status(404).json({ error: 'Варіант не знайдено' })
  }

  try {
    const updated = await prisma.productVariant.update({
      where: { id: variant.id },
      data: req.body,
    })
    res.json({ variant: updated })
  } catch (error) {
    if (isUniqueConstraintError(error, 'sku')) {
      return res.status(409).json({ error: 'SKU вже використовується іншим варіантом' })
    }
    throw error
  }
}

export const deleteVariant = async (req: Request, res: Response) => {
  const variant = await findOwnedVariant(req.params.id as string, req.params.variantId as string)
  if (!variant) {
    return res.status(404).json({ error: 'Варіант не знайдено' })
  }

  await prisma.productVariant.delete({ where: { id: variant.id } })
  res.status(204).send()
}

// ── Хелпери ───────────────────────────────────────────────────────

// variantId — унікальний сам по собі, але цей запит ще й підтверджує,
// що він належить товару з :id у шляху, а не якомусь іншому.
const findOwnedVariant = async (productId: string, variantId: string) => {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
  return variant && variant.productId === productId ? variant : null
}

const isNotFoundError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'

// P2002 під driver adapter (Prisma 7) не несе meta.target (масив полів,
// як було в класичному rust-движку) — натомість ім'я constraint'у бази
// лежить у meta.driverAdapterError.cause.constraint.index, напр.
// "ProductVariant_sku_key". Перевіряємо саме цю форму.
const isUniqueConstraintError = (error: unknown, field: string) => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false
  }
  const meta = error.meta as
    | { driverAdapterError?: { cause?: { constraint?: { index?: string } } } }
    | undefined
  const constraintName = meta?.driverAdapterError?.cause?.constraint?.index
  return typeof constraintName === 'string' && constraintName.includes(field)
}
