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
  listCustomFields,
  addCustomField,
  updateCustomField,
  deleteCustomField,
} from '../controllers/products.controller'
import { requireAuth, requireRole } from '../middlewares/auth.middleware'
import validate from '../middlewares/validate.middleware'
import {
  idParamSchema,
  productVariantParamsSchema,
  customFieldParamsSchema,
  productListQuerySchema,
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
  createCustomFieldSchema,
  updateCustomFieldSchema,
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

export default router
