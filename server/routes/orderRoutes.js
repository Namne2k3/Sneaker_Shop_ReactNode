import express from 'express';
import {
    createOrder,
    getOrders,
    getOrderById,
    getOrderByNumber,
    updateOrderStatus,
    cancelOrder,
    getUserOrders,
    getOrderStatistics
} from '../controllers/orderController.js';
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { orderValidation, idValidation, paginationValidation } from '../utils/validators.js';

const router = express.Router();

// Public routes - None for orders as they should all be protected

// User routes - require authentication
router.post('/', authenticate, createOrder);
router.get('/user', authenticate, paginationValidation, validateRequest, getUserOrders);
router.put('/:id/cancel', authenticate, idValidation, validateRequest, cancelOrder);

// Admin routes - require admin privileges
router.get('/', authenticate, isAdmin, paginationValidation, validateRequest, getOrders);
router.get('/statistics', authenticate, isAdmin, getOrderStatistics);
router.get('/number/:orderNumber', authenticate, getOrderByNumber);
router.get('/:id', authenticate, idValidation, validateRequest, getOrderById);
router.put('/:id/status', authenticate, isAdmin, idValidation, orderValidation.updateStatus, validateRequest, updateOrderStatus);

export default router;
