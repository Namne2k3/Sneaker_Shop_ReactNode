import Coupon from '../models/Coupon.js';
import {
    okResponse,
    createdResponse,
    notFoundResponse,
    badRequestResponse,
    handleError
} from '../utils/response.js';

// Create a new coupon
export const createCoupon = async (req, res) => {
    try {
        const {
            code,
            type,
            value,
            minOrderAmount,
            maxUsage,
            startDate,
            endDate,
            isActive
        } = req.body;

        // Check if coupon with same code already exists
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return badRequestResponse(res, 'Mã giảm giá này đã tồn tại');
        }

        // Validate end date is after start date
        const start = startDate ? new Date(startDate) : new Date();
        const end = new Date(endDate);

        if (end <= start) {
            return badRequestResponse(res, 'Ngày kết thúc phải sau ngày bắt đầu');
        }

        // Create new coupon
        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            type,
            value,
            minOrderAmount: minOrderAmount || 0,
            maxUsage: maxUsage || 0,
            startDate: start,
            endDate: end,
            isActive: isActive !== undefined ? isActive : true
        });

        return createdResponse(res, 'Tạo mã giảm giá thành công', coupon);
    } catch (error) {
        return handleError(res, error);
    }
};

// Get all coupons with pagination and filtering
export const getCoupons = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = 'createdAt',
            order = 'desc',
            isActive,
            code
        } = req.query;

        // Build filter object
        const filter = {};

        // Filter by active status
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        // Filter by code
        if (code) {
            filter.code = { $regex: code, $options: 'i' };
        }

        // Prepare sort object
        const sortOption = {};
        sortOption[sort] = order === 'asc' ? 1 : -1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Count total coupons
        const totalCoupons = await Coupon.countDocuments(filter);

        // Execute query
        const coupons = await Coupon.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        // Add isValid virtual property
        const couponsWithValidity = coupons.map(coupon => {
            const couponObj = coupon.toObject({ virtuals: true });
            return {
                ...couponObj,
                isValid: coupon.isValid
            };
        });

        return okResponse(res, 'Lấy danh sách mã giảm giá thành công', couponsWithValidity, {
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalCoupons / parseInt(limit)),
            totalCoupons
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Get coupon by ID
export const getCouponById = async (req, res) => {
    try {
        const { id } = req.params;

        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return notFoundResponse(res, 'Không tìm thấy mã giảm giá');
        }

        // Include virtual property
        const couponWithValidity = coupon.toObject({ virtuals: true });
        couponWithValidity.isValid = coupon.isValid;

        return okResponse(res, 'Lấy thông tin mã giảm giá thành công', couponWithValidity);
    } catch (error) {
        return handleError(res, error);
    }
};

// Validate coupon by code
export const validateCoupon = async (req, res) => {
    try {
        const { code } = req.params;
        const { orderAmount } = req.query;

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return notFoundResponse(res, 'Mã giảm giá không tồn tại');
        }

        // Check if coupon is valid
        if (!coupon.isValid) {
            return badRequestResponse(res, 'Mã giảm giá đã hết hạn hoặc không còn hiệu lực');
        }

        // Check minimum order amount if provided
        if (orderAmount && coupon.minOrderAmount > parseFloat(orderAmount)) {
            return badRequestResponse(res, `Mã giảm giá chỉ áp dụng cho đơn hàng từ ${coupon.minOrderAmount.toLocaleString('vi-VN')}₫`);
        }

        // Calculate discount amount based on coupon type
        let discountAmount = 0;
        if (orderAmount) {
            if (coupon.type === 'percentage') {
                discountAmount = (parseFloat(orderAmount) * coupon.value) / 100;
            } else { // fixed amount
                discountAmount = coupon.value;
            }
        }

        const couponWithValidity = coupon.toObject({ virtuals: true });
        couponWithValidity.isValid = coupon.isValid;
        couponWithValidity.discountAmount = discountAmount;

        return okResponse(res, 'Mã giảm giá hợp lệ', couponWithValidity);
    } catch (error) {
        return handleError(res, error);
    }
};

// Update coupon
export const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Check if coupon exists
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return notFoundResponse(res, 'Không tìm thấy mã giảm giá');
        }

        // If updating code, check for duplicates
        if (updateData.code && updateData.code !== coupon.code) {
            const existingCoupon = await Coupon.findOne({
                code: updateData.code.toUpperCase(),
                _id: { $ne: id }
            });

            if (existingCoupon) {
                return badRequestResponse(res, 'Mã giảm giá này đã tồn tại');
            }

            updateData.code = updateData.code.toUpperCase();
        }

        // If updating dates, validate them
        if ((updateData.startDate || updateData.endDate)) {
            const start = updateData.startDate ? new Date(updateData.startDate) : coupon.startDate;
            const end = updateData.endDate ? new Date(updateData.endDate) : coupon.endDate;

            if (end <= start) {
                return badRequestResponse(res, 'Ngày kết thúc phải sau ngày bắt đầu');
            }
        }

        // Update the coupon
        const updatedCoupon = await Coupon.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        // Include virtual property
        const couponWithValidity = updatedCoupon.toObject({ virtuals: true });
        couponWithValidity.isValid = updatedCoupon.isValid;

        return okResponse(res, 'Cập nhật mã giảm giá thành công', couponWithValidity);
    } catch (error) {
        return handleError(res, error);
    }
};

// Delete coupon
export const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if coupon exists
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return notFoundResponse(res, 'Không tìm thấy mã giảm giá');
        }

        // Delete the coupon
        await Coupon.findByIdAndDelete(id);

        return okResponse(res, 'Xóa mã giảm giá thành công');
    } catch (error) {
        return handleError(res, error);
    }
};

// Apply coupon to increase usage count
export const applyCoupon = async (req, res) => {
    try {
        const { code } = req.params;

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return notFoundResponse(res, 'Mã giảm giá không tồn tại');
        }

        // Check if coupon is valid
        if (!coupon.isValid) {
            return badRequestResponse(res, 'Mã giảm giá đã hết hạn hoặc không còn hiệu lực');
        }

        // Increment usage count
        if (coupon.usageCount > coupon.maxUsage && coupon.maxUsage > 0) {
            coupon.isActive = false; // Deactivate if max usage reached
            coupon.usageCount = coupon.maxUsage; // Set to max usage
            await coupon.save();
            return badRequestResponse(res, 'Mã giảm giá đã hết lượt sử dụng');
        } else {
            coupon.usageCount += 1;
        }
        await coupon.save();
        return okResponse(res, 'Áp dụng mã giảm giá thành công', coupon);
    } catch (error) {
        return handleError(res, error);
    }
};