let mockStorageEnabled = true

jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: require('./helpers/prismaMock').prismaMock,
}))

// Справжні чисті функції (detectImageType, buildObjectKey), але без походу
// в мережу: uploadObject/deleteObject — заглушки.
jest.mock('../src/lib/storage', () => ({
  ...jest.requireActual('../src/lib/storage'),
  get isStorageEnabled() {
    return mockStorageEnabled
  },
  uploadObject: jest.fn(),
  deleteObject: jest.fn(),
}))

import { uploadProductImage, deleteProductImage } from '../src/controllers/images.controller'
import { uploadObject, deleteObject } from '../src/lib/storage'
import { prismaMock, mockRequest, mockResponse } from './helpers/prismaMock'

const PNG = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(16)])
const file = (buffer: Buffer) => ({ buffer, size: buffer.length })

beforeEach(() => {
  jest.clearAllMocks()
  mockStorageEnabled = true
  prismaMock.product.findUnique.mockResolvedValue({ id: 'p1' })
  prismaMock.productImage.aggregate.mockResolvedValue({ _max: { position: null } })
  ;(uploadObject as jest.Mock).mockResolvedValue('http://cdn/products/x.png')
})

describe('uploadProductImage', () => {
  const run = (overrides = {}) => {
    const res = mockResponse()
    return uploadProductImage(
      mockRequest({ params: { id: 'p1' }, file: file(PNG), ...overrides }) as any,
      res
    ).then(() => res)
  }

  it('відповідає 503, якщо сховище не налаштоване', async () => {
    mockStorageEnabled = false
    const res = await run()
    expect(res.status).toHaveBeenCalledWith(503)
    expect(uploadObject).not.toHaveBeenCalled()
  })

  it('відповідає 404, якщо товару нема, і нічого не вантажить', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null)
    const res = await run()
    expect(res.status).toHaveBeenCalledWith(404)
    expect(uploadObject).not.toHaveBeenCalled()
  })

  it('відповідає 400, якщо файл не надіслано', async () => {
    const res = await run({ file: undefined })
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('відхиляє не-зображення, навіть якщо клієнт назвав його image/png', async () => {
    const res = await run({ file: { ...file(Buffer.from('#!/bin/sh\necho hi\n'.repeat(3))), mimetype: 'image/png' } })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(uploadObject).not.toHaveBeenCalled()
  })

  it('кладе файл у сховище й створює запис з position 0 для першого зображення', async () => {
    prismaMock.productImage.create.mockImplementation(async ({ data }: any) => ({ id: 'i1', ...data }))
    const res = await run()

    expect(uploadObject).toHaveBeenCalledWith(expect.stringMatching(/^products\//), PNG, 'image/png')
    expect(prismaMock.productImage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: 'p1',
        mimeType: 'image/png',
        url: 'http://cdn/products/x.png',
        size: PNG.length,
        position: 0,
      }),
    })
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('ставить наступний position після найбільшого наявного', async () => {
    prismaMock.productImage.aggregate.mockResolvedValue({ _max: { position: 3 } })
    prismaMock.productImage.create.mockImplementation(async ({ data }: any) => ({ id: 'i2', ...data }))
    await run()
    expect(prismaMock.productImage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ position: 4 }),
    })
  })

  it('прибирає файл зі сховища, якщо запис у базі не вдався (без сиріт)', async () => {
    prismaMock.productImage.create.mockRejectedValue(new Error('db down'))
    await expect(run()).rejects.toThrow('db down')
    expect(deleteObject).toHaveBeenCalledWith((uploadObject as jest.Mock).mock.calls[0][0])
  })
})

describe('deleteProductImage', () => {
  const req = () => mockRequest({ params: { id: 'p1', imageId: 'i1' } }) as any

  it('відповідає 404, якщо зображення нема або воно від іншого товару', async () => {
    prismaMock.productImage.findFirst.mockResolvedValue(null)
    const res = mockResponse()
    await deleteProductImage(req(), res)
    expect(prismaMock.productImage.findFirst).toHaveBeenCalledWith({
      where: { id: 'i1', productId: 'p1' },
    })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(deleteObject).not.toHaveBeenCalled()
  })

  it('видаляє запис, а тоді об’єкт зі сховища, і відповідає 204', async () => {
    prismaMock.productImage.findFirst.mockResolvedValue({ id: 'i1', key: 'products/x.png' })
    const order: string[] = []
    prismaMock.productImage.delete.mockImplementation(async () => void order.push('db'))
    ;(deleteObject as jest.Mock).mockImplementation(async () => void order.push('storage'))
    const res = mockResponse()

    await deleteProductImage(req(), res)

    expect(order).toEqual(['db', 'storage'])
    expect(deleteObject).toHaveBeenCalledWith('products/x.png')
    expect(res.status).toHaveBeenCalledWith(204)
  })
})
