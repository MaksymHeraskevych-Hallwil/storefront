import express from 'express'
import { getAnalyticsSummary } from '../controllers/analytics.controller'
import { requireAuth } from '../middlewares/auth.middleware'
import validate from '../middlewares/validate.middleware'
import { analyticsQuerySchema } from '../schemas'

const router = express.Router()

router.use(requireAuth)

router.get('/summary', validate(analyticsQuerySchema, 'query'), getAnalyticsSummary)

export default router
