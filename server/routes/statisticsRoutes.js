import express from 'express'
import { getDashboardStats, getPopularProducts, getUserCount, getStatisticsOrders } from '../controllers/statisticsController.js'
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/dashboard', authenticate, isAdmin, getDashboardStats)
router.get('/products/popular', authenticate, isAdmin, getPopularProducts)
router.get('/users/count', authenticate, isAdmin, getUserCount)
router.get('/orders/recent', authenticate, isAdmin, getStatisticsOrders)

export default router;