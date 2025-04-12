import express from 'express'
import { getDashboardStats, getPopularProducts, getUserCount } from '../controllers/statisticsController.js'
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/dashboard', authenticate, isAdmin, getDashboardStats)
router.get('/products/popular', authenticate, isAdmin, getPopularProducts)
router.get('/users/count', authenticate, isAdmin, getUserCount)

export default router;