import express from 'express';
import {
    createCategory,
    getCategories,
    getCategoryById,
    getCategoryBySlug,
    updateCategory,
    deleteCategory,
    getCategoryTree
} from '../controllers/categoryController.js';
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { categoryValidation, idValidation } from '../utils/validators.js';
import { parseFormData } from '../middlewares/formDataMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', idValidation, validateRequest, getCategoryById);

// Protected routes (admin only)
router.post('/',
    authenticate,
    isAdmin,
    parseFormData,
    categoryValidation.create,
    validateRequest,
    createCategory
);

router.put('/:id',
    authenticate,
    isAdmin,
    idValidation,
    parseFormData,
    categoryValidation.update,
    validateRequest,
    updateCategory
);

router.delete('/:id',
    authenticate,
    isAdmin,
    idValidation,
    validateRequest,
    deleteCategory
);

export default router;
