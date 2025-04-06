import { body, param, query } from 'express-validator';

// User validation
export const userValidation = {
    register: [
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
    ],
    login: [
        body('email')
            .notEmpty().withMessage('Email không được để trống')
            .isEmail().withMessage('Email không hợp lệ'),
        body('password')
            .notEmpty().withMessage('Mật khẩu không được để trống')
    ],
    updateProfile: [
        body('fullName')
            .optional()
            .isLength({ min: 3 }).withMessage('Họ tên phải có ít nhất 3 ký tự'),
        body('phone')
            .optional()
            .isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ')
    ]
};

// Product validation
export const productValidation = {
    create: [
        body('name')
            .notEmpty().withMessage('Tên sản phẩm không được để trống')
            .isLength({ max: 200 }).withMessage('Tên sản phẩm không quá 200 ký tự'),
        body('description')
            .notEmpty().withMessage('Mô tả không được để trống'),
        body('basePrice')
            .notEmpty().withMessage('Giá không được để trống')
            .isNumeric().withMessage('Giá phải là số')
            .custom(value => value >= 0).withMessage('Giá không được âm'),
        body('category')
            .notEmpty().withMessage('Danh mục không được để trống'),
        body('brand')
            .notEmpty().withMessage('Thương hiệu không được để trống'),
        body('thumbnail')
            .notEmpty().withMessage('Ảnh đại diện không được để trống')
    ],
    update: [
        body('name')
            .optional()
            .isLength({ max: 200 }).withMessage('Tên sản phẩm không quá 200 ký tự'),
        body('basePrice')
            .optional()
            .isNumeric().withMessage('Giá phải là số')
            .custom(value => value >= 0).withMessage('Giá không được âm')
    ]
};

// Order validation
export const orderValidation = {
    create: [
        body('items')
            .notEmpty().withMessage('Đơn hàng phải có ít nhất một sản phẩm')
            .isArray().withMessage('Danh sách sản phẩm không hợp lệ'),
        body('items.*.productVariant')
            .notEmpty().withMessage('ID biến thể sản phẩm không được để trống'),
        body('items.*.quantity')
            .notEmpty().withMessage('Số lượng không được để trống')
            .isInt({ min: 1 }).withMessage('Số lượng phải là số nguyên lớn hơn 0'),
        body('shippingAddress')
            .notEmpty().withMessage('Địa chỉ giao hàng không được để trống'),
        body('shippingAddress.fullName')
            .notEmpty().withMessage('Tên người nhận không được để trống'),
        body('shippingAddress.phone')
            .notEmpty().withMessage('Số điện thoại không được để trống')
            .isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ'),
        body('shippingAddress.province')
            .notEmpty().withMessage('Tỉnh/Thành phố không được để trống'),
        body('shippingAddress.district')
            .notEmpty().withMessage('Quận/Huyện không được để trống'),
        body('shippingAddress.ward')
            .notEmpty().withMessage('Phường/Xã không được để trống'),
        body('shippingAddress.street')
            .notEmpty().withMessage('Địa chỉ chi tiết không được để trống'),
        body('paymentMethod')
            .notEmpty().withMessage('Phương thức thanh toán không được để trống')
            .isIn(['cod', 'bank_transfer', 'credit_card', 'momo', 'zalopay', 'vnpay'])
            .withMessage('Phương thức thanh toán không hợp lệ')
    ]
};

// Review validation
export const reviewValidation = {
    create: [
        body('product')
            .notEmpty().withMessage('ID sản phẩm không được để trống'),
        body('rating')
            .notEmpty().withMessage('Đánh giá sao không được để trống')
            .isInt({ min: 1, max: 5 }).withMessage('Đánh giá phải từ 1-5 sao'),
        body('comment')
            .notEmpty().withMessage('Nội dung đánh giá không được để trống')
    ]
};

// Category validation
export const categoryValidation = {
    create: [
        body('name')
            .notEmpty().withMessage('Tên danh mục không được để trống')
            .isLength({ max: 100 }).withMessage('Tên danh mục không quá 100 ký tự'),
        body('description')
            .optional()
            .isLength({ max: 500 }).withMessage('Mô tả không quá 500 ký tự'),
        body('parent')
            .optional()
            .isMongoId().withMessage('ID danh mục cha không hợp lệ'),
        body('order')
            .optional()
            .isInt({ min: 0 }).withMessage('Thứ tự phải là số nguyên không âm'),
        body('status')
            .optional()
            .isIn(['active', 'inactive']).withMessage('Trạng thái không hợp lệ'),
        body('image')
            .optional()
            .isURL().withMessage('URL hình ảnh không hợp lệ')
    ],
    update: [
        body('name')
            .optional()
            .isLength({ max: 100 }).withMessage('Tên danh mục không quá 100 ký tự'),
        body('description')
            .optional()
            .isLength({ max: 500 }).withMessage('Mô tả không quá 500 ký tự'),
        body('parent')
            .optional()
            .isMongoId().withMessage('ID danh mục cha không hợp lệ'),
        body('order')
            .optional()
            .isInt({ min: 0 }).withMessage('Thứ tự phải là số nguyên không âm'),
        body('status')
            .optional()
            .isIn(['active', 'inactive']).withMessage('Trạng thái không hợp lệ'),
        body('image')
            .optional()
            .isURL().withMessage('URL hình ảnh không hợp lệ')
    ]
};

// Common ID validation
export const idValidation = param('id')
    .notEmpty().withMessage('ID không được để trống')
    .isMongoId().withMessage('ID không hợp lệ');

// Pagination validation
export const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Trang phải là số nguyên dương'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Số lượng mỗi trang phải từ 1-100')
];
