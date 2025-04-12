import express from 'express';
import {
    createCoupon,
    getCoupons,
    getCouponById,
    validateCoupon,
    updateCoupon,
    deleteCoupon,
    applyCoupon
} from '../controllers/couponController.js';
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { idValidation, paginationValidation } from '../utils/validators.js';

const router = express.Router();

// Public route for validating coupons
router.get('/validate/:code', validateCoupon);

// Protected routes (require authentication)
router.post('/apply/:code', authenticate, applyCoupon);

// Admin only routes
router.get('/', authenticate, isAdmin, paginationValidation, validateRequest, getCoupons);
router.get('/:id', authenticate, isAdmin, idValidation, validateRequest, getCouponById);
router.post('/', authenticate, isAdmin, createCoupon);
router.put('/:id', authenticate, isAdmin, idValidation, validateRequest, updateCoupon);
router.delete('/:id', authenticate, isAdmin, idValidation, validateRequest, deleteCoupon);

export default router;