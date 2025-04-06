import express from 'express'
import { register, login, refreshToken, getCurrentUser, logout } from '../controllers/authController.js'
import { authenticate } from '../middlewares/authMiddleware.js'
import { loginValidation, registerValidation } from '../middlewares/validationMiddleware.js'

const router = express.Router()

router.post('/register', registerValidation, register)

router.post('/login', loginValidation, login)

router.post('/refresh-token', refreshToken)

router.post('/logout', logout)

router.get('/me', authenticate, getCurrentUser)

export default router;