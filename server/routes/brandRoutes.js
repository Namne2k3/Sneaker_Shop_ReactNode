import express from 'express';
import {
    createBrand,
    getBrands,
    getBrandById,
    getBrandBySlug,
    updateBrand,
    deleteBrand
} from '../controllers/brandController.js';
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { brandValidation, idValidation } from '../utils/validators.js';
import { parseFormData } from '../middlewares/formDataMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getBrands);
router.get('/slug/:slug', getBrandBySlug);
router.get('/:id', idValidation, validateRequest, getBrandById);

// Protected routes (admin only)
router.post('/',
    authenticate,
    isAdmin,
    parseFormData,  // For logo upload
    brandValidation.create,
    validateRequest,
    createBrand
);

router.put('/:id',
    authenticate,
    isAdmin,
    idValidation,
    parseFormData,  // For logo upload
    brandValidation.update,
    validateRequest,
    updateBrand
);

router.delete('/:id',
    authenticate,
    isAdmin,
    idValidation,
    validateRequest,
    deleteBrand
);

export default router;
