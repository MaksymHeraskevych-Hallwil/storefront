import { Request, Response } from 'express'
import prisma from '../lib/prisma'
import {
  isStorageEnabled,
  uploadObject,
  deleteObject,
  detectImageType,
  buildObjectKey,
  ALLOWED_IMAGE_TYPES,
} from '../lib/storage'

export const uploadProductImage = async (req: Request, res: Response) => {
  if (!isStorageEnabled) {
    return res.status(503).json({ error: 'Сховище зображень не налаштоване' })
  }

  const productId = req.params.id as string
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) {
    return res.status(404).json({ error: 'Товар не знайдено' })
  }

  const file = req.file
  if (!file) {
    return res.status(400).json({ error: 'Файл не надіслано (поле форми: "file")' })
  }

  // Тип визначаємо за вмістом файлу, а не за заголовком від клієнта
  const mimeType = detectImageType(file.buffer)
  if (!mimeType || !ALLOWED_IMAGE_TYPES[mimeType]) {
    return res.status(400).json({ error: 'Дозволені лише зображення: JPEG, PNG, WebP, GIF' })
  }

  const key = buildObjectKey(mimeType)
  const url = await uploadObject(key, file.buffer, mimeType)

  try {
    const last = await prisma.productImage.aggregate({
      where: { productId },
      _max: { position: true },
    })

    const image = await prisma.productImage.create({
      data: {
        productId,
        key,
        url,
        mimeType,
        size: file.size,
        position: (last._max.position ?? -1) + 1,
      },
    })

    res.status(201).json({ image })
  } catch (error) {
    // Файл уже в бакеті, а запису в базі нема — не лишаємо сироту.
    await deleteObject(key)
    throw error
  }
}

export const deleteProductImage = async (req: Request, res: Response) => {
  const { id: productId, imageId } = req.params as { id: string; imageId: string }

  const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } })
  if (!image) {
    return res.status(404).json({ error: 'Зображення не знайдено' })
  }

  // Спершу з бази, потім зі сховища: осиротілий файл у бакеті — це
  // марно витрачені байти, а осиротілий запис у БД — битий URL у UI.
  await prisma.productImage.delete({ where: { id: image.id } })
  await deleteObject(image.key)

  res.status(204).send()
}
