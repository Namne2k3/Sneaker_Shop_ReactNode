import express from 'express';
import {
    createColor,
    getColors,
    getColorById,
    updateColor,
    deleteColor
} from '../controllers/colorController.js';
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js';
import { idValidation } from '../utils/validators.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getColors);
router.get('/:id', idValidation, validateRequest, getColorById);

// Protected routes (admin only)
router.post('/', authenticate, isAdmin, createColor);
router.put('/:id', authenticate, isAdmin, idValidation, validateRequest, updateColor);
router.delete('/:id', authenticate, isAdmin, idValidation, validateRequest, deleteColor);

export default router;
