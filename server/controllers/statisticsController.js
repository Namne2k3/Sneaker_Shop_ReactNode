import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { okResponse, handleError } from '../utils/response.js';

export const getDashboardStats = async (req, res) => {
    try {

        const today = new Date();

        // thiết lập thời gian bắt đầu và kết thúc của ngày hôm nay
        // để truy vấn dữ liệu trong khoảng thời gian này
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        // lấy ra thời gian đầu tiên của tháng hiện tại
        // và thời gian cuối cùng của tháng hiện tại
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        const orderStats = await getOrderStats(startOfDay, endOfDay, startOfMonth, endOfMonth);

        const productStats = await getProductStats();

        const usersCount = await User.countDocuments({ isActive: true })

        const stats = {
            orders: {
                total: orderStats.totalOrders,
                today: orderStats.ordersToday,
                thisMonth: orderStats.ordersThisMonth,
                byStatus: orderStats.ordersByStatus
            },
            revenue: {
                total: orderStats.totalRevenue,
                today: orderStats.revenueToday,
                thisMonth: orderStats.revenueThisMonth
            },
            products: {
                total: productStats.totalProducts,
                popular: productStats.popularProducts
            },
            users: {
                total: usersCount
            }
        }

        return okResponse(res, "Thông tin dữ liệu thống kê truy xuất thành công!", stats)

    } catch (error) {
        return handleError(res, error)
    }
}

// Cấu trúc chung
// Order.aggregate([...]): 
// Đây là phương thức của Mongoose để thực hiện các thao tác aggregation trên mô hình Order.
// [...]: Một mảng chứa các giai đoạn của pipeline, mỗi giai đoạn là một đối tượng.
async function getOrderStats(startOfDay, endOfDay, startOfMonth, endOfMonth) {
    const ordersByStatus = await Order.aggregate([
        {
            $group: {
                // _id là thuộc tính để nhóm dữ liệu, ở đây nhóm theo status của đơn hàng
                // dấu $ là để truy cập vào thuộc tính của đối tượng trong MongoDB (tham chiếu)
                _id: "$status",

                // tạo ra trường dữ liệu mới tên "count"
                // count để đếm số lượng đơn hàng trong từng nhóm trạng thái
                // $sum: 1 có nghĩa là tăng giá trị của trường count lên 1 cho mỗi đơn hàng trong nhóm
                count: { $sum: 1 },

                // tạo ra trường dữ liệu mới tên "total"
                // total để tính tổng giá trị đơn hàng trong từng nhóm trạng thái
                // $sum: "$total" có nghĩa là cộng dồn giá trị của trường total trong từng đơn hàng trong nhóm
                total: { $sum: '$total' }
            }
        }
    ])

    const totalOrders = await Order.countDocuments();

    // tổng doanh thu của tất cả các đơn hàng
    const totalRevenue = await Order.aggregate([
        // stage đầu tiên lọc qua các đơn hàng có trạng thái là "delivered" và "paid"
        {
            $match: {
                status: 'delivered',
                paymentStatus: 'paid'
            }
        },

        // stage thứ hai nhóm các đơn hàng
        // và tính tổng doanh thu của từng nhóm
        // để sử dụng hàm sum thì phải sử dụng đi đôi với group
        // nhưng group thì phải có trường _id để gom nhóm dựa vào trường nào đó
        // ở đây chúng ta không cần nhóm theo trường nào cả
        // vì chúng ta chỉ cần tổng doanh thu của tất cả các đơn hàng
        // nên chúng ta để _id là null
        {
            $group: {
                _id: null,
                total: { $sum: '$total' }
            }
        }
    ]);

    const ordersToday = await Order.countDocuments({
        createdAt: {
            $gte: startOfDay,
            $lt: endOfDay
        }
    })

    const revenueToday = await Order.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startOfDay,
                    $lt: endOfDay
                },
                status: 'delivered',
                paymentStatus: 'paid'
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$total' }
            }
        }
    ])

    const ordersThisMonth = await Order.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const revenueThisMonth = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                status: 'delivered',
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

    return {
        ordersByStatus: ordersByStatus.reduce((acc, curr) => {
            acc[curr._id] = { count: curr.count, total: curr.total };
            return acc;
        }, {}),
        totalOrders,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        ordersToday,
        revenueToday: revenueToday.length > 0 ? revenueToday[0].total : 0,
        ordersThisMonth,
        revenueThisMonth: revenueThisMonth.length > 0 ? revenueThisMonth[0].total : 0
    };
}

// Helper function to get product statistics
async function getProductStats() {
    const totalProducts = await Product.countDocuments();

    const popularProducts = await Order.aggregate([
        {
            $match: {
                status: { $in: ['delivered', 'shipped', 'processing'] }
            }
        },
        {
            $unwind: '$items'
        },
        {
            $group: {
                _id: '$items.product',
                totalSold: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
            }
        },
        {
            $sort: { totalSold: -1 }
        },
        { $limit: 5 },
        {
            // join với bảng products để lấy thông tin chi tiết của sản phẩm
            $lookup: {

                // Truy vấn từ collection products trong MongoDB. Đây là "bảng" phụ để lấy thông tin thêm.
                from: 'products',

                // Trường trong tài liệu hiện tại (sau bước $group) – ở đây _id chính là items.product (ID của sản phẩm).
                localField: '_id',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        { $unwind: '$productDetails' },
        {
            // Chọn ra (hoặc tính toán) các trường mà bạn muốn xuất hiện trong kết quả cuối cùng.
            // Nó giống như câu lệnh SELECT trong SQL(chọn cột để hiển thị).
            $project: {
                _id: '$productDetails._id',
                name: '$productDetails.name',
                price: '$productDetails.price',
                images: '$productDetails.images',
                salesCount: '$totalSold',
                rating: '$productDetails.averageRating'
            }
        }
    ])

    return {
        totalProducts,
        popularProducts
    };
}

// Get popular products
// hàm này đơn giản là lấy ra 5 sản phẩm có trong các đơn hàng đã được vận chuyển
// và được sắp xếp giảm dần dựa theo số lượng bán ra nhiều nhất
export const getPopularProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const products = await Order.aggregate([
            // Chỉ xem xét đơn hàng đã hoàn thành hoặc đang giao hàng
            {
                $match: {
                    status: { $in: ['delivered', 'shipped', 'processing'] }
                }
            },
            // Unwind items array để có thể group theo sản phẩm
            { $unwind: '$items' },
            // Group theo product ID và tính tổng số lượng đã bán
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            // Sắp xếp theo số lượng bán giảm dần
            { $sort: { totalSold: -1 } },
            // Lấy số lượng sản phẩm theo limit
            { $limit: limit },
            // Join bảng products và đẩy vào trường dữ liệu mới "productDetails" để lấy thông tin chi tiết về sản phẩm
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            // Unwind kết quả lookup
            { $unwind: '$productDetails' },
            // Định dạng kết quả trả về
            {
                $project: {
                    _id: '$productDetails._id',
                    name: '$productDetails.name',
                    price: '$productDetails.price',
                    images: '$productDetails.images',
                    salesCount: '$totalSold',
                    rating: '$productDetails.averageRating'
                }
            }
        ]);

        const totalProducts = await Product.countDocuments();

        return okResponse(res, 'Popular products retrieved successfully', {
            products,
            totalProducts
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Get user count
export const getUserCount = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ isActive: true });
        return okResponse(res, 'User count retrieved successfully', { totalUsers });
    } catch (error) {
        return handleError(res, error);
    }
};

// interface Order {
//     _id: string,
//     orderNumber: string,
//     user: {
//         _id: string,
//         fullName: string
//     },
//     createdAt: string,
//     total: number,
//     status: string
// }
// Get Statistics Orders
export const getStatisticsOrders = async (req, res) => {
    try {
        const { limit } = req.query;

        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate({
                path: 'user',
                select: '-password -refreshToken'
            })
            .limit(limit || 5);

        return okResponse(res, 'Statistics orders retrieved successfully', orders);
    } catch (error) {
        return handleError(res, error)
    }
}