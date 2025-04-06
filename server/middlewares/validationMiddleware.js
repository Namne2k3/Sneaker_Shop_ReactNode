import { body, validationResult } from 'express-validator';
import { validationErrorResponse } from '../utils/response.js';

export const registerValidation = [
    body('fullName')
        .notEmpty().withMessage('Họ tên không được để trống')
        .isLength({ min: 3 }).withMessage('Họ tên phải có ít nhất 3 ký tự'),
    body('email')
        .notEmpty().withMessage('Email không được để trống')
        .isEmail().withMessage('Email không hợp lệ'),
    body('password')
        .notEmpty().withMessage('Mật khẩu không được để trống')
        .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('phone')
        .optional()
        .isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ')
];

export const loginValidation = [
    body('email')
        .notEmpty().withMessage('Email không được để trống')
        .isEmail().withMessage('Email không hợp lệ'),
    body('password')
        .notEmpty().withMessage('Mật khẩu không được để trống')
];

export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return validationErrorResponse(res, errors.array());
    }
    next();
};
