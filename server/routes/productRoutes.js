import express from 'express';
import {
    createProduct,
    getProducts,
    getProductById,
    getProductBySlug,
    updateProduct,
    deleteProduct,
    createProductVariant,
    updateProductVariant,
    deleteProductVariant
} from '../controllers/productController.js';
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js';
import { productValidation, idValidation, paginationValidation } from '../utils/validators.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', paginationValidation, validateRequest, getProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', idValidation, validateRequest, getProductById);

// Protected routes (admin only)
router.post('/', authenticate, isAdmin, productValidation.create, validateRequest, createProduct);
router.put('/:id', authenticate, isAdmin, idValidation, productValidation.update, validateRequest, updateProduct);
router.delete('/:id', authenticate, isAdmin, idValidation, validateRequest, deleteProduct);

// Variant routes
router.post('/:id/variants', authenticate, isAdmin, idValidation, validateRequest, createProductVariant);
router.put('/variants/:id', authenticate, isAdmin, idValidation, validateRequest, updateProductVariant);
router.delete('/variants/:id', authenticate, isAdmin, idValidation, validateRequest, deleteProductVariant);

export default router;
