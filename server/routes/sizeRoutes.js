import express from 'express';
import {
    createSize,
    getSizes,
    getSizeById,
    updateSize,
    deleteSize
} from '../controllers/sizeController.js';
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js';
import { idValidation } from '../utils/validators.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getSizes);
router.get('/:id', idValidation, validateRequest, getSizeById);

// Protected routes (admin only)
router.post('/', authenticate, isAdmin, createSize);
router.put('/:id', authenticate, isAdmin, idValidation, validateRequest, updateSize);
router.delete('/:id', authenticate, isAdmin, idValidation, validateRequest, deleteSize);

export default router;
