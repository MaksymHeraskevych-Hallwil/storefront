import express from 'express'
import {
  listTickets,
  getTicket,
  addTicketMessage,
  updateTicketStatus,
} from '../controllers/tickets.controller'
import { requireAuth, requireRole } from '../middlewares/auth.middleware'
import validate from '../middlewares/validate.middleware'
import {
  idParamSchema,
  ticketListQuerySchema,
  createTicketMessageSchema,
  updateTicketStatusSchema,
} from '../schemas'

const router = express.Router()

router.use(requireAuth)

router.get('/', validate(ticketListQuerySchema, 'query'), listTickets)
router.get('/:id', validate(idParamSchema, 'params'), getTicket)
router.post(
  '/:id/messages',
  requireRole('ADMIN', 'STAFF'),
  validate(idParamSchema, 'params'),
  validate(createTicketMessageSchema),
  addTicketMessage
)
router.patch(
  '/:id/status',
  requireRole('ADMIN', 'STAFF'),
  validate(idParamSchema, 'params'),
  validate(updateTicketStatusSchema),
  updateTicketStatus
)

export default router
