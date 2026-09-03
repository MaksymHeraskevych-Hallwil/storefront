import express from 'express'
import { login, logout, me } from '../controllers/auth.controller'
import { requireAuth } from '../middlewares/auth.middleware'
import validate from '../middlewares/validate.middleware'
import { loginSchema } from '../schemas'

const router = express.Router()

router.post('/login', validate(loginSchema), login)
router.post('/logout', logout)
router.get('/me', requireAuth, me)

export default router
