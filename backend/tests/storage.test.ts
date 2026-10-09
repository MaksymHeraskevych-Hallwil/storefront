import { detectImageType, buildObjectKey, ALLOWED_IMAGE_TYPES } from '../src/lib/storage'

const pad = (head: number[]) => Buffer.concat([Buffer.from(head), Buffer.alloc(16)])

describe('detectImageType', () => {
  it('розпізнає JPEG, PNG, GIF і WebP за магічними байтами', () => {
    expect(detectImageType(pad([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
    expect(detectImageType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png')
    expect(detectImageType(Buffer.from('GIF89a' + '\0'.repeat(16)))).toBe('image/gif')
    expect(detectImageType(Buffer.from('GIF87a' + '\0'.repeat(16)))).toBe('image/gif')
    expect(detectImageType(Buffer.from('RIFF\0\0\0\0WEBP' + '\0'.repeat(8)))).toBe('image/webp')
  })

  it('відхиляє скрипт, якого клієнт видав за картинку', () => {
    expect(detectImageType(Buffer.from('#!/bin/sh\necho pwned\n'.repeat(3)))).toBeNull()
  })

  it('відхиляє RIFF, що не є WebP (наприклад, WAV)', () => {
    expect(detectImageType(Buffer.from('RIFF\0\0\0\0WAVE' + '\0'.repeat(8)))).toBeNull()
  })

  it('відхиляє надто короткий буфер', () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff]))).toBeNull()
  })
})

describe('buildObjectKey', () => {
  it('будує ключ products/РІК/МІСЯЦЬ/uuid.ext з розширенням за типом', () => {
    for (const [mime, ext] of Object.entries(ALLOWED_IMAGE_TYPES)) {
      expect(buildObjectKey(mime)).toMatch(
        new RegExp(`^products/\\d{4}/\\d{2}/[0-9a-f-]{36}\\.${ext}$`)
      )
    }
  })

  it('кожен виклик дає новий ключ — один файл не перезапише інший', () => {
    expect(buildObjectKey('image/png')).not.toBe(buildObjectKey('image/png'))
  })
})
