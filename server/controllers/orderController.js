import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
// import { createError } from '../utils/error.js';
import {
    badRequestResponse,
    handleError,
    notFoundResponse,
    okResponse,
    unauthorizedResponse
} from '../utils/response.js';

// Create new order
export const createOrder = async (req, res, next) => {
    try {
        const { shippingDetails, items, paymentMethod, notes, subtotal, shippingFee, total, coupon } = req.body;
        // return;
        if (!items || items.length === 0) {
            return badRequestResponse(res, 'Không có sản phẩm nào trong đơn hàng');
        }

        if (coupon) {
            const couponData = await Coupon.findOne({ code: coupon });
            if (!couponData) {
                return badRequestResponse(res, 'Mã giảm giá không tồn tại');
            } else {
                if (!couponData.isValid) {
                    return badRequestResponse(res, 'Mã giảm giá không hợp lệ');
                }
                // if (couponData.minOrderAmount > total) {
                //     return badRequestResponse(res, `Đơn hàng tối thiểu ${couponData.minOrderAmount} để áp dụng mã giảm giá`);
                // }
                if (couponData.usageCount >= couponData.maxUsage && couponData.maxUsage > 0) {
                    return badRequestResponse(res, 'Mã giảm giá đã hết lượt sử dụng');
                }
                if (new Date() < couponData.startDate) {
                    return badRequestResponse(res, 'Mã giảm giá chưa có hiệu lực');
                }
                if (new Date() > couponData.endDate) {
                    return badRequestResponse(res, 'Mã giảm giá đã hết hạn');
                }

                // Update coupon usage count
                couponData.usageCount += 1;
                if (couponData.type === 'percentage') {
                    const discount = (total * couponData.value) / 100;
                    req.body.discount = discount;
                    req.body.total -= discount;
                } else if (couponData.type === 'fixed') {
                    req.body.discount = couponData.value;
                    req.body.total -= couponData.value;
                }
                await couponData.save();
                req.body.coupon = couponData._id;
            }
        }

        // Validate and prepare order items
        const orderItems = [];
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return badRequestResponse(res, `Sản phẩm không tồn tại`);
            }

            let variant = null;
            if (item.variant) {
                variant = await ProductVariant.findById(item.variant).populate({ path: 'color size' });
                if (!variant) {
                    return badRequestResponse(res, `Biến thể sản phẩm không tồn tại`);
                }

                // Check stock
                if (variant.stock < item.quantity) {
                    return badRequestResponse(res, `Biến thể sản phẩm ${variant.size.name}, ${variant.color.name} chỉ còn ${variant.stock} sản phẩm`);
                }
            }

            // Add to order items
            orderItems.push({
                product: product._id,
                productVariant: variant ? variant._id : undefined,
                name: product.name + (variant ? ` - ${variant.size.name}, ${variant.color.name}` : ''),
                price: item.price,
                image: product.images[0].imagePath,
                quantity: item.quantity
            });
        }

        // Verify total matches calculation
        // const calculatedSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // if (Math.abs(calculatedSubtotal - subtotal) > 0.001) {
        //     return next(createError(400, 'Tổng tiền đơn hàng không khớp'));
        // }

        // const calculatedTotal = subtotal + shippingFee - (req.body.discount || 0);
        // if (Math.abs(calculatedTotal - total) > 0.001) {
        //     return next(createError(400, 'Tổng tiền thanh toán không khớp'));
        // }

        // Create order
        const newOrder = new Order({
            user: req.user.id,
            items: orderItems,
            subtotal,
            shippingFee,
            total,
            paymentMethod,
            notes,
            coupon: req.body.coupon || null,
            discount: req.body.discount || 0,
            shippingAddress: {
                fullName: shippingDetails.fullName,
                email: shippingDetails.email,
                phone: shippingDetails.phoneNumber,
                address: `${shippingDetails.address}, ${shippingDetails.ward}, ${shippingDetails.district}`,
                city: shippingDetails.city
            }
        });

        // Save order and update inventory
        const savedOrder = await newOrder.save();

        // Update product inventory
        for (const item of items) {
            if (item.variant) {
                await ProductVariant.findByIdAndUpdate(
                    item.variant,
                    { $inc: { stock: -item.quantity } }
                );
            }
            // If tracking inventory at product level too
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { totalStock: -item.quantity } }
            );
        }

        // Clear selected items from cart
        if (req.user) {
            const userCart = await Cart.findOne({ user: req.user.id });
            if (userCart) {
                const itemIds = items.map(item => item.cartItemId).filter(id => id);
                if (itemIds.length > 0) {
                    userCart.products = userCart.products.filter(prod => !itemIds.includes(prod._id.toString()));
                    await userCart.save();
                }
            }
        }

        return okResponse(res, 'Tạo đơn hàng thành công', savedOrder);
    } catch (err) {
        next(err);
    }
};

// Get all orders (admin)
export const getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, paymentStatus, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        // Build query filter
        const filter = {};
        if (status) filter.status = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        // Determine sort direction and field
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Count total documents for pagination
        const totalOrders = await Order.countDocuments(filter);

        // Calculate pagination
        const startIndex = (Number(page) - 1) * Number(limit);
        const totalPages = Math.ceil(totalOrders / Number(limit));

        // Execute query
        const orders = await Order.find(filter)
            .sort(sort)
            .skip(startIndex)
            .limit(Number(limit))
            .populate('user', 'name email')
            .select('-__v');

        return okResponse(res, 'Lấy danh sách đơn hàng thành công', {
            orders,
            currentPage: Number(page),
            totalPages,
            totalItems: totalOrders
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate('user', 'name email')
            .populate({
                path: 'items.product',
                select: 'name slug images'
            })
            .populate({
                path: 'items.productVariant',
                select: 'sku color size price salePrice'
            });

        if (!order) {
            return notFoundResponse(res, 'Không tìm thấy đơn hàng');
        }

        // Check if the user is authorized to view this order
        if (!req.user.isAdmin && order.user._id.toString() !== req.user.id) {
            return unauthorizedResponse(res, 'Bạn không có quyền xem đơn hàng này');
        }

        return okResponse(res, 'Lấy thông tin đơn hàng thành công', order);
    } catch (error) {
        return handleError(res, error);
    }
};

// Get order by order number
export const getOrderByNumber = async (req, res) => {
    try {
        const { orderNumber } = req.params;

        const order = await Order.findOne({ orderNumber })
            .populate('user', 'name email')
            .populate({
                path: 'items.product',
                select: 'name slug images'
            })
            .populate({
                path: 'items.productVariant',
                select: 'sku color size price salePrice'
            });

        if (!order) {
            return notFoundResponse(res, 'Không tìm thấy đơn hàng');
        }

        // Check if the user is authorized to view this order
        if (!req.user.isAdmin && order.user && order.user._id.toString() !== req.user.id) {
            return unauthorizedResponse(res, 'Bạn không có quyền xem đơn hàng này');
        }

        return okResponse(res, 'Lấy thông tin đơn hàng thành công', order);
    } catch (error) {
        return handleError(res, error);
    }
};

// Update order status (admin)
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        const order = await Order.findById(id);

        if (!order) {
            return notFoundResponse(res, 'Không tìm thấy đơn hàng');
        }

        // Validate state transition
        if (!isValidStatusTransition(order.status, status)) {
            return badRequestResponse(res, `Không thể chuyển từ trạng thái ${order.status} sang ${status}`);
        }

        // Update order status
        order.status = status;

        // Add status history entry
        order.statusHistory.push({
            status,
            timestamp: new Date(),
            note: note || `Đã cập nhật trạng thái đơn hàng sang ${status}`
        });

        // Update payment status if order is delivered
        if (status === 'delivered' && order.paymentMethod === 'cod') {
            order.paymentStatus = 'paid';
        }

        await order.save();

        return okResponse(res, 'Cập nhật trạng thái đơn hàng thành công', order);
    } catch (error) {
        return handleError(res, error);
    }
};

// Cancel order (user or admin)
export const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const order = await Order.findById(id);

        if (!order) {
            return notFoundResponse(res, 'Không tìm thấy đơn hàng');
        }

        // kiểm tra đơn hàng có thuộc về người dùng không
        if (!req.user.isAdmin && order.user.toString() !== req.user.id) {
            return unauthorizedResponse(res, 'Bạn không có quyền hủy đơn hàng này');
        }

        if (!['pending', 'processing'].includes(order.status)) {
            return badRequestResponse(res, 'Không thể hủy đơn hàng ở trạng thái này');
        }

        // Update order status
        order.status = 'cancelled';

        // Add status history entry
        order.statusHistory.push({
            status: 'cancelled',
            timestamp: new Date(),
            note: reason || 'Đơn hàng đã bị hủy'
        });

        // Restore inventory
        for (const item of order.items) {
            await ProductVariant.findByIdAndUpdate(
                item.productVariant,
                { $inc: { stock: item.quantity } }
            );
        }

        await order.save();

        return okResponse(res, 'Hủy đơn hàng thành công', order);
    } catch (error) {
        return handleError(res, error);
    }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const userId = req.user.id;

        // Build query filter
        const filter = { user: userId };
        if (status) filter.status = status;

        // Count total documents for pagination
        const totalOrders = await Order.countDocuments(filter);

        // Calculate pagination
        const startIndex = (Number(page) - 1) * Number(limit);
        const totalPages = Math.ceil(totalOrders / Number(limit));

        // Execute query
        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(Number(limit))
            .select('orderNumber total status paymentStatus createdAt items');

        return okResponse(res, 'Lấy danh sách đơn hàng thành công', {
            orders,
            currentPage: Number(page),
            totalPages,
            totalItems: totalOrders
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Get order statistics (admin)
export const getOrderStatistics = async (req, res) => {
    try {
        // Get current date and month boundaries
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Order counts by status
        const ordersByStatus = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total: { $sum: '$total' }
                }
            }
        ]);

        // Total revenue
        const totalRevenue = await Order.aggregate([
            {
                $match: {
                    status: { $in: ['delivered'] },
                    paymentStatus: 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total' }
                }
            }
        ]);

        // Orders today
        const ordersToday = await Order.countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        // Revenue today
        const revenueToday = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfDay, $lte: endOfDay },
                    status: { $in: ['delivered'] },
                    paymentStatus: 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total' }
                }
            }
        ]);

        // Orders this month
        const ordersThisMonth = await Order.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // Revenue this month
        const revenueThisMonth = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                    status: { $in: ['delivered'] },
                    paymentStatus: 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total' }
                }
            }
        ]);

        // Format the response
        const statistics = {
            ordersByStatus: ordersByStatus.reduce((acc, curr) => {
                acc[curr._id] = { count: curr.count, total: curr.total };
                return acc;
            }, {}),
            totalOrders: await Order.countDocuments(),
            totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
            ordersToday,
            revenueToday: revenueToday.length > 0 ? revenueToday[0].total : 0,
            ordersThisMonth,
            revenueThisMonth: revenueThisMonth.length > 0 ? revenueThisMonth[0].total : 0,
        };

        return okResponse(res, 'Lấy thống kê đơn hàng thành công', statistics);
    } catch (error) {
        return handleError(res, error);
    }
};

// Helper function to validate status transitions
function isValidStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = {
        'pending': ['processing', 'cancelled'],
        'processing': ['shipped', 'cancelled'],
        'shipped': ['delivered', 'cancelled'],
        'delivered': ['refunded'],
        'cancelled': [],
        'refunded': []
    };

    return allowedTransitions[currentStatus]?.includes(newStatus);
}
