import express from 'express'
import {
  listProducts,
  createProduct,
  getProduct,
  updateProduct,
  archiveProduct,
  addVariant,
  updateVariant,
  deleteVariant,
} from '../controllers/products.controller'
import { requireAuth, requireRole } from '../middlewares/auth.middleware'
import validate from '../middlewares/validate.middleware'
import {
  idParamSchema,
  productVariantParamsSchema,
  productListQuerySchema,
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
} from '../schemas'

const router = express.Router()

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

export default router
