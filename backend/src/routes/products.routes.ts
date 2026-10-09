import express, { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import {
  listProducts,
  createProduct,
  getProduct,
  updateProduct,
  archiveProduct,
  addVariant,
  updateVariant,
  deleteVariant,
  listCustomFields,
  addCustomField,
  updateCustomField,
  deleteCustomField,
} from '../controllers/products.controller'
import { uploadProductImage, deleteProductImage } from '../controllers/images.controller'
import { MAX_FILE_SIZE } from '../lib/storage'
import { requireAuth, requireRole } from '../middlewares/auth.middleware'
import validate from '../middlewares/validate.middleware'
import {
  idParamSchema,
  productVariantParamsSchema,
  customFieldParamsSchema,
  productImageParamsSchema,
  productListQuerySchema,
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  createCustomFieldSchema,
  updateCustomFieldSchema,
} from '../schemas'

const router = express.Router()

// Файл тримаємо в пам'яті, а не на диску: він одразу їде в R2/MinIO, тож
// писати його на диск контейнера немає сенсу. Ліміт розміру — перша лінія
// захисту: multer обриває запит, не дочитуючи його до кінця.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
})

// Усе тут вимагає щонайменше STAFF — публічної вітрини ще немає.
router.use(requireAuth)

router.get('/', validate(productListQuerySchema, 'query'), listProducts)
router.post('/', requireRole('ADMIN', 'STAFF'), validate(createProductSchema), createProduct)

router.get('/:id', validate(idParamSchema, 'params'), getProduct)
router.patch(
  '/:id',
  requireRole('ADMIN', 'STAFF'),
  validate(idParamSchema, 'params'),
  validate(updateProductSchema),
  updateProduct
)
// Архівування — тільки ADMIN, за таблицею ролей у StoreFront Blueprint.
router.delete(
  '/:id',
  requireRole('ADMIN'),
  validate(idParamSchema, 'params'),
  archiveProduct
)

router.post(
  '/:id/variants',
  requireRole('ADMIN', 'STAFF'),
  validate(idParamSchema, 'params'),
  validate(createVariantSchema),
  addVariant
)
router.patch(
  '/:id/variants/:variantId',
  requireRole('ADMIN', 'STAFF'),
  validate(productVariantParamsSchema, 'params'),
  validate(updateVariantSchema),
  updateVariant
)
router.delete(
  '/:id/variants/:variantId',
  requireRole('ADMIN', 'STAFF'),
  validate(productVariantParamsSchema, 'params'),
  deleteVariant
)

router.get('/:id/custom-fields', validate(idParamSchema, 'params'), listCustomFields)
router.post(
  '/:id/custom-fields',
  requireRole('ADMIN', 'STAFF'),
  validate(idParamSchema, 'params'),
  validate(createCustomFieldSchema),
  addCustomField
)
router.patch(
  '/:id/custom-fields/:fieldId',
  requireRole('ADMIN', 'STAFF'),
  validate(customFieldParamsSchema, 'params'),
  validate(updateCustomFieldSchema),
  updateCustomField
)
router.delete(
  '/:id/custom-fields/:fieldId',
  requireRole('ADMIN', 'STAFF'),
  validate(customFieldParamsSchema, 'params'),
  deleteCustomField
)

router.post(
  '/:id/images',
  requireRole('ADMIN', 'STAFF'),
  validate(idParamSchema, 'params'),
  upload.single('file'),
  uploadProductImage
)
router.delete(
  '/:id/images/:imageId',
  requireRole('ADMIN', 'STAFF'),
  validate(productImageParamsSchema, 'params'),
  deleteProductImage
)

// Multer кидає власні помилки (наприклад, перевищений розмір) — без цього
// обробника вони перетворились би на 500.
router.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ error: `Файл завеликий. Максимум ${MAX_FILE_SIZE / 1024 / 1024} МБ` })
    }
    return res.status(400).json({ error: 'Помилка завантаження файлу' })
  }
  next(err)
})

export default router
