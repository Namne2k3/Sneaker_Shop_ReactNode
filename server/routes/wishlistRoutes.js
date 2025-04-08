import express from 'express';
import {
    getUserWishlist,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    updateWishlistItemQuantity
} from '../controllers/wishlistController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { wishlistValidation } from '../utils/validators.js';

const router = express.Router();

// All wishlist routes are protected (require authentication)
router.get('/', authenticate, getUserWishlist);
router.post('/add', authenticate, wishlistValidation.addToWishlist, validateRequest, addToWishlist);
router.put('/update/:itemId', authenticate, wishlistValidation.updateQuantity, validateRequest, updateWishlistItemQuantity);
router.delete('/remove/:itemId', authenticate, removeFromWishlist);
router.delete('/clear', authenticate, clearWishlist);

export default router;
