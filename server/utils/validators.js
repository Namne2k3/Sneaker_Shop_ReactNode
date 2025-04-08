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
    ],
    create: [
        body('fullName')
            .notEmpty().withMessage('Họ tên không được để trống')
            .trim(),
        body('email')
            .notEmpty().withMessage('Email không được để trống')
            .isEmail().withMessage('Email không hợp lệ')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('Mật khẩu không được để trống')
            .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
        body('phone')
            .optional()
            .matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
        body('role')
            .optional()
            .isIn(['user', 'admin']).withMessage('Vai trò không hợp lệ'),
        body('isActive')
            .optional()
            .isBoolean().withMessage('Trạng thái phải là boolean')
    ],
    update: [
        body('fullName')
            .optional()
            .notEmpty().withMessage('Họ tên không được để trống')
            .trim(),
        body('email')
            .optional()
            .isEmail().withMessage('Email không hợp lệ')
            .normalizeEmail(),
        body('phone')
            .optional()
            .matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
        body('role')
            .optional()
            .isIn(['user', 'admin']).withMessage('Vai trò không hợp lệ'),
        body('isActive')
            .optional()
            .isBoolean().withMessage('Trạng thái phải là boolean'),
        body('address')
            .optional()
    ],
    changePassword: [
        body('currentPassword')
            .notEmpty().withMessage('Mật khẩu hiện tại không được để trống'),
        body('newPassword')
            .notEmpty().withMessage('Mật khẩu mới không được để trống')
            .isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
            .not().equals(body('currentPassword')).withMessage('Mật khẩu mới không được trùng với mật khẩu hiện tại')
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
        body('features')
            .optional()
            .isString().withMessage('Tính năng phải là chuỗi'),

    ],
    createWithVariants: [
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
        body('features')
            .optional()
            .isString().withMessage('Tính năng phải là chuỗi'),
        body('variants')
            .optional()
            .custom((value, { req }) => {
                // Handle variants coming as a string (from FormData) or as an array (from JSON)
                if (typeof value === 'string') {
                    try {
                        const parsed = JSON.parse(value);
                        if (!Array.isArray(parsed)) {
                            throw new Error('Biến thể phải là mảng');
                        }
                        req.body.variants = parsed; // Replace string with parsed array for further validation
                        return true;
                    } catch (error) {
                        throw new Error('Dữ liệu biến thể không đúng định dạng JSON');
                    }
                }

                if (!Array.isArray(value)) {
                    throw new Error('Biến thể phải là mảng');
                }
                return true;
            }),
        body('variants.*.size')
            .optional()
            .notEmpty().withMessage('Size không được để trống'),
        body('variants.*.color')
            .optional()
            .notEmpty().withMessage('Màu sắc không được để trống'),
        body('variants.*.sku')
            .optional()
            .notEmpty().withMessage('SKU không được để trống')
            .isString().withMessage('SKU phải là chuỗi'),
        body('variants.*.stock')
            .optional()
            .isInt({ min: 0 }).withMessage('Số lượng tồn phải là số nguyên không âm'),
        body('variants.*.additionalPrice')
            .optional()
            .isNumeric().withMessage('Giá tăng thêm phải là số')
            .custom(value => value >= 0).withMessage('Giá tăng thêm không được âm')
    ],
    update: [
        body('name')
            .optional()
            .isLength({ max: 200 }).withMessage('Tên sản phẩm không quá 200 ký tự'),
        body('basePrice')
            .optional()
            .isNumeric().withMessage('Giá phải là số')
            .custom(value => value >= 0).withMessage('Giá không được âm'),
        body('images.*.isPrimary')
            .optional()
            .isBoolean().withMessage('isPrimary phải là boolean'),
        body('replaceImages')
            .optional()
            .isBoolean().withMessage('replaceImages phải là boolean'),
        body('features')
            .optional()
            .isString().withMessage('Tính năng phải là chuỗi'),
    ]
};

// ProductVariant validation
export const productVariantValidation = {
    create: [
        body('size')
            .notEmpty().withMessage('Size không được để trống'),
        body('color')
            .notEmpty().withMessage('Màu sắc không được để trống'),
        body('sku')
            .notEmpty().withMessage('SKU không được để trống')
            .isString().withMessage('SKU phải là chuỗi'),
        body('stock')
            .notEmpty().withMessage('Số lượng tồn không được để trống')
            .isInt({ min: 0 }).withMessage('Số lượng tồn phải là số nguyên không âm'),
        body('additionalPrice')
            .optional()
            .isNumeric().withMessage('Giá tăng thêm phải là số')
            .custom(value => value >= 0).withMessage('Giá tăng thêm không được âm'),
    ],
    update: [
        body('size')
            .optional(),
        body('color')
            .optional(),
        body('sku')
            .optional()
            .isString().withMessage('SKU phải là chuỗi'),
        body('stock')
            .optional()
            .isInt({ min: 0 }).withMessage('Số lượng tồn phải là số nguyên không âm'),
        body('additionalPrice')
            .optional()
            .isNumeric().withMessage('Giá tăng thêm phải là số')
            .custom(value => value >= 0).withMessage('Giá tăng thêm không được âm'),
    ],
    batch: [
        body('variants')
            .isArray().withMessage('Biến thể phải là mảng')
            .notEmpty().withMessage('Phải có ít nhất một biến thể'),
        body('variants.*.size')
            .notEmpty().withMessage('Size không được để trống'),
        body('variants.*.color')
            .notEmpty().withMessage('Màu sắc không được để trống'),
        body('variants.*.sku')
            .notEmpty().withMessage('SKU không được để trống')
            .isString().withMessage('SKU phải là chuỗi'),
        body('variants.*.stock')
            .optional()
            .isInt({ min: 0 }).withMessage('Số lượng tồn phải là số nguyên không âm'),
        body('variants.*.additionalPrice')
            .optional()
            .isNumeric().withMessage('Giá tăng thêm phải là số')
            .custom(value => value >= 0).withMessage('Giá tăng thêm không được âm'),
    ],

    stockUpdate: [
        body('updates')
            .isArray().withMessage('Cập nhật phải là mảng')
            .notEmpty().withMessage('Phải có ít nhất một cập nhật'),
        body('updates.*.variantId')
            .notEmpty().withMessage('ID biến thể không được để trống')
            .isMongoId().withMessage('ID biến thể không hợp lệ'),
        body('updates.*.stock')
            .notEmpty().withMessage('Số lượng tồn không được để trống')
            .isInt({ min: 0 }).withMessage('Số lượng tồn phải là số nguyên không âm'),
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
        body('shippingAddress.email')
            .notEmpty().withMessage('Email không được để trống')
            .isEmail().withMessage('Email không hợp lệ'),
        body('shippingAddress.phone')
            .notEmpty().withMessage('Số điện thoại không được để trống')
            .isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ'),
        body('shippingAddress.address')
            .notEmpty().withMessage('Địa chỉ không được để trống'),
        body('shippingAddress.city')
            .notEmpty().withMessage('Thành phố không được để trống'),
        body('paymentMethod')
            .notEmpty().withMessage('Phương thức thanh toán không được để trống')
            .isIn(['cod', 'bank_transfer', 'credit_card', 'momo', 'zalopay', 'vnpay'])
            .withMessage('Phương thức thanh toán không hợp lệ')
    ],
    updateStatus: [
        body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
            .withMessage('Trạng thái đơn hàng không hợp lệ'),
        body('note').optional().isString().withMessage('Ghi chú phải là chuỗi')
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
            .custom(value => {
                // Allow null or empty string to represent a root category
                if (value === null || value === 'null' || value === '') {
                    return true;
                }
                // Otherwise, must be a valid MongoDB ObjectId
                if (!value.match(/^[0-9a-fA-F]{24}$/)) {
                    throw new Error('ID danh mục cha không hợp lệ');
                }
                return true;
            }),
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

// Brand validation
export const brandValidation = {
    create: [
        body('name')
            .notEmpty().withMessage('Tên thương hiệu không được để trống')
            .isLength({ max: 100 }).withMessage('Tên thương hiệu không quá 100 ký tự'),
        body('description')
            .optional()
            .isLength({ max: 500 }).withMessage('Mô tả không quá 500 ký tự'),
        body('website')
            .optional()
            .isURL().withMessage('Website phải là URL hợp lệ'),
        body('status')
            .optional()
            .isIn(['active', 'inactive']).withMessage('Trạng thái không hợp lệ'),
    ],
    update: [
        body('name')
            .optional()
            .isLength({ max: 100 }).withMessage('Tên thương hiệu không quá 100 ký tự'),
        body('description')
            .optional()
            .isLength({ max: 500 }).withMessage('Mô tả không quá 500 ký tự'),
        body('website')
            .optional()
            .isURL().withMessage('Website phải là URL hợp lệ'),
        body('status')
            .optional()
            .isIn(['active', 'inactive']).withMessage('Trạng thái không hợp lệ'),
    ]
};

// Wishlist validation
export const wishlistValidation = {
    addToWishlist: [
        body('productId')
            .isMongoId()
            .withMessage('Mã sản phẩm không hợp lệ')
            .notEmpty()
            .withMessage('Mã sản phẩm không được để trống'),
        body('variantId')
            .optional()
            .isMongoId()
            .withMessage('Mã biến thể không hợp lệ'),
        body('quantity')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Số lượng phải là số nguyên lớn hơn 0')
            .toInt()
    ],
    updateQuantity: [
        param('itemId')
            .isMongoId()
            .withMessage('Mã sản phẩm trong giỏ hàng không hợp lệ'),
        body('quantity')
            .isInt({ min: 1 })
            .withMessage('Số lượng phải là số nguyên lớn hơn 0')
            .toInt()
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
