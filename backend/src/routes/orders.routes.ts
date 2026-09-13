import express from 'express'
import { listOrders, getOrder, updateOrderStatus } from '../controllers/orders.controller'
import { requireAuth, requireRole } from '../middlewares/auth.middleware'
import validate from '../middlewares/validate.middleware'
import { idParamSchema, orderListQuerySchema, updateOrderStatusSchema } from '../schemas'

const router = express.Router()

router.use(requireAuth)

router.get('/', validate(orderListQuerySchema, 'query'), listOrders)
router.get('/:id', validate(idParamSchema, 'params'), getOrder)
router.patch(
  '/:id/status',
  requireRole('ADMIN', 'STAFF'),
  validate(idParamSchema, 'params'),
  validate(updateOrderStatusSchema),
  updateOrderStatus
)

export default router
