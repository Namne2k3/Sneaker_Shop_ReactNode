import express from 'express';
import {
    createProduct,
    getProducts,
    getProductById,
    getProductBySlug,
    updateProduct,
    deleteProduct,
    softDeleteProduct,
    createProductVariant,
    updateProductVariant,
    deleteProductVariant,
    getProductVariants,
    getProductSizes,
    getProductColors,
    findProductVariant,
    createProductVariants,
    updateVariantsStock,
    createProductWithVariants,
    getProductVariantById
} from '../controllers/productController.js';
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js';
import { productValidation, idValidation, paginationValidation } from '../utils/validators.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { parseFormData, parseMultipleFiles } from '../middlewares/formDataMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', paginationValidation, validateRequest, getProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', idValidation, validateRequest, getProductById);

// Variant related public routes
router.get('/:id/variants', idValidation, validateRequest, getProductVariants);
router.get('/:id/sizes', idValidation, validateRequest, getProductSizes);
router.get('/:id/colors', idValidation, validateRequest, getProductColors);
router.get('/:id/find-variant', idValidation, validateRequest, findProductVariant);
router.get('/variants/:id', idValidation, validateRequest, getProductVariantById);

// Protected routes (admin only)
router.post('/', authenticate, isAdmin, parseMultipleFiles, productValidation.create, validateRequest, createProduct);
router.post('/with-variants', authenticate, isAdmin, parseMultipleFiles, productValidation.createWithVariants, validateRequest, createProductWithVariants);
router.put('/:id', authenticate, isAdmin, parseMultipleFiles, idValidation, productValidation.update, validateRequest, updateProduct);
router.put('/:id/soft-delete', authenticate, isAdmin, idValidation, validateRequest, softDeleteProduct);
router.delete('/:id', authenticate, isAdmin, idValidation, validateRequest, deleteProduct);

// Variant routes
router.post('/:id/variants', authenticate, isAdmin, idValidation, validateRequest, createProductVariant);
router.post('/:id/batch-variants', authenticate, isAdmin, idValidation, validateRequest, createProductVariants);
router.post('/:id/update-stock', authenticate, isAdmin, idValidation, validateRequest, updateVariantsStock);
router.put('/variants/:id', authenticate, isAdmin, idValidation, validateRequest, updateProductVariant);
router.delete('/variants/:id', authenticate, isAdmin, idValidation, validateRequest, deleteProductVariant);

export default router;
