import express from 'express';
import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    changeUserStatus,
    changeUserPassword,
    getUserProfile
} from '../controllers/userController.js';
import { authenticate, isAdmin } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { userValidation, idValidation, paginationValidation } from '../utils/validators.js';
import { parseFormData } from '../middlewares/formDataMiddleware.js';

const router = express.Router();

// Protected routes (admin only) - User management
router.get('/', authenticate, isAdmin, paginationValidation, validateRequest, getUsers);
router.get('/:id', authenticate, isAdmin, idValidation, validateRequest, getUserById);
router.post('/',
    authenticate,
    isAdmin,
    // parseFormData,
    userValidation.create,
    validateRequest,
    createUser
);
router.put('/:id',
    authenticate,
    isAdmin,
    idValidation,
    // parseFormData,
    userValidation.update,
    validateRequest,
    updateUser
);
router.delete('/:id', authenticate, isAdmin, idValidation, validateRequest, deleteUser);
router.put('/:id/status', authenticate, isAdmin, idValidation, validateRequest, changeUserStatus);

// User profile routes (for authenticated users)
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, parseFormData, userValidation.updateProfile, validateRequest, updateUser);
router.put('/password/change-password', authenticate, userValidation.changePassword, validateRequest, changeUserPassword);

export default router;
