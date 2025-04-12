import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import statisticsService from '../../services/dashboardAdminSerrvice';

interface DashboardStat {
    title: string;
    value: string | number;
    change: string;
    icon: string;
    iconBg: string;
    link: string;
}

interface Order {
    _id: string,
    orderNumber: string,
    user: {
        _id: string,
        fullName: string
    },
    createdAt: string,
    total: number,
    status: string
}

interface PopularProduct {
    _id: string,
    name: string,
    price: number,
    images: string[],
    salesCount: number,
    rating: number,
}

// Status color mapping
const statusColorMap = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    processing: { bg: 'bg-blue-100', text: 'text-blue-800' },
    shipping: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    delivered: { bg: 'bg-green-100', text: 'text-green-800' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
};

const statusTranslations = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    shipping: 'Đang giao',
    delivered: 'Hoàn thành',
    cancelled: 'Đã hủy',
    default: 'Không xác định'
};

const DashboardPage = () => {
    // Fetch dashboard statistics
    const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: statisticsService.getDashboardStats,
    });

    // Fetch recent orders
    const { data: recentOrdersData, isLoading: isLoadingOrders } = useQuery({
        queryKey: ['recent-orders'],
        queryFn: () => statisticsService.getOrderStatistics({ limit: 5 })
    });

    // Fetch popular products
    const { data: popularProductsData, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['popular-products'],
        queryFn: () => statisticsService.getPopularProducts(3),
    });

    // Fetch users count
    const { data: usersData, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['users-count'],
        queryFn: statisticsService.getUsersCount,
    });

    const isLoading = isLoadingStats || isLoadingOrders || isLoadingProducts || isLoadingUsers;

    const [stats, setStats] = useState<DashboardStat[]>([
        {
            title: 'Đơn hàng',
            value: '...',
            change: '+0%',
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
            iconBg: 'bg-blue-500',
            link: '/admin/orders'
        },
        {
            title: 'Doanh thu',
            value: '...',
            change: '+0%',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            iconBg: 'bg-green-500',
            link: '/admin/revenue'
        },
        {
            title: 'Sản phẩm',
            value: '...',
            change: '+0%',
            icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
            iconBg: 'bg-indigo-500',
            link: '/admin/products'
        },
        {
            title: 'Khách hàng',
            value: '...',
            change: '+0%',
            icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
            iconBg: 'bg-orange-500',
            link: '/admin/users'
        }
    ]);

    // Update stats when data is loaded
    useEffect(() => {
        if (!isLoading && dashboardStats && popularProductsData && usersData) {
            const totalOrders = dashboardStats.data.orders.total || 0;
            const totalRevenue = dashboardStats.data.revenue.total || 0;
            const totalProducts = dashboardStats.data.products.total || 0;
            const totalUsers = dashboardStats.data.users.total || 0;

            const ordersThisMonth = dashboardStats.data.orders.thisMonth || 0;
            const revenueThisMonth = dashboardStats.data.revenue.thisMonth || 0;

            // Tính phần trăm tăng trưởng
            const orderGrowth = totalOrders > 0 && ordersThisMonth > 0
                ? `+${Math.round((ordersThisMonth / totalOrders) * 100)}%`
                : '+0%';

            const revenueGrowth = totalRevenue > 0 && revenueThisMonth > 0
                ? `+${Math.round((revenueThisMonth / totalRevenue) * 100)}%`
                : '+0%';

            setStats([
                {
                    title: 'Đơn hàng',
                    value: totalOrders,
                    change: orderGrowth,
                    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
                    iconBg: 'bg-blue-500',
                    link: '/admin/orders'
                },
                {
                    title: 'Doanh thu',
                    value: `${(totalRevenue / 1000000).toFixed(1)}M₫`,
                    change: revenueGrowth,
                    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                    iconBg: 'bg-green-500',
                    link: '/admin/revenue'
                },
                {
                    title: 'Sản phẩm',
                    value: totalProducts,
                    change: '+0%',
                    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
                    iconBg: 'bg-indigo-500',
                    link: '/admin/products'
                },
                {
                    title: 'Khách hàng',
                    value: totalUsers,
                    change: '+0%',
                    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
                    iconBg: 'bg-orange-500',
                    link: '/admin/users'
                }
            ]);
        }
    }, [isLoading, dashboardStats, popularProductsData, usersData]);

    const recentOrders = recentOrdersData?.data || []
    const popularProducts: PopularProduct[] = popularProductsData?.data?.products || [];

    // Chuyển đổi dữ liệu phân bố trạng thái đơn hàng cho biểu đồ pie
    const orderStatusData = dashboardStats?.data?.orders?.byStatus
        ? Object.entries(dashboardStats.data.orders.byStatus).map(([status, data]: [string, any]) => ({
            name: statusTranslations[status as keyof typeof statusTranslations] || status,
            value: data.count,
            color: getStatusColor(status)
        }))
        : [];

    // Hàm lấy màu cho trạng thái đơn hàng
    function getStatusColor(status: string) {
        switch (status) {
            case 'pending': return '#FBBF24';
            case 'processing': return '#60A5FA';
            case 'shipping': return '#818CF8';
            case 'delivered': return '#34D399';
            case 'cancelled': return '#F87171';
            default: return '#9CA3AF';
        }
    }

    // Helper functions
    const renderStatusBadge = (status: string) => {
        const statusInfo = statusColorMap[status as keyof typeof statusColorMap] || { bg: 'bg-gray-100', text: 'text-gray-800' };
        const statusText = statusTranslations[status as keyof typeof statusTranslations] || statusTranslations.default;

        return (
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                {statusText}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN')
    };

    const formatPrice = (price: number) => {
        return price
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h1 className="text-2xl font-bold mb-4 text-gray-800">Tổng quan SneakerShop</h1>
                <p className="text-gray-600">
                    Xem nhanh các chỉ số kinh doanh quan trọng của cửa hàng
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((stat, index) => (
                    <Link
                        key={index}
                        to={stat.link}
                        className="bg-white rounded-lg shadow hover:shadow-md transition-all p-5 flex items-center"
                    >
                        <div className={`${stat.iconBg} rounded-lg p-3 mr-4`}>
                            <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                            <div className="flex items-baseline">
                                <p className="text-2xl font-bold text-gray-900">
                                    {isLoading ? '...' : stat.value}
                                </p>
                                <span className="text-sm text-green-500 ml-2">{stat.change}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">So với tháng trước</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Orders Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white p-5 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Phân bố trạng thái đơn hàng</h2>

                    {isLoadingStats ? (
                        <div className="flex justify-center py-10">
                            <LoadingSpinner size="small" />
                        </div>
                    ) : orderStatusData.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                            Chưa có dữ liệu trạng thái đơn hàng
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={orderStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {orderStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => [`${value} đơn hàng`, 'Số lượng']}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', border: 'none' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {orderStatusData.map((item, index) => (
                                    <div key={index} className="flex items-center text-sm">
                                        <span className="inline-block w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                                        <span className="text-gray-600">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Popular Products List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Sản phẩm bán chạy</h2>
                        <Link to="/admin/products" className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium">
                            Xem tất cả
                        </Link>
                    </div>
                    <div className="p-5 space-y-4">
                        {isLoadingProducts ? (
                            <div className="flex justify-center py-10">
                                <LoadingSpinner size="small" />
                            </div>
                        ) : popularProducts.length === 0 ? (
                            <div className="text-center text-gray-500 py-10">
                                Chưa có dữ liệu sản phẩm
                            </div>
                        ) : (
                            popularProducts.map((product) => (
                                <div key={product._id} className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="h-16 w-16 rounded-md mr-4 flex-shrink-0 overflow-hidden">
                                        <img
                                            src={product.images?.[0].imagePath || `https://via.placeholder.com/64x64?text=Product`}
                                            alt={product.name}
                                            className="h-full w-full object-cover rounded-md"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = "https://via.placeholder.com/64x64?text=NoImage";
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Link to={`/admin/products/${product._id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                                            {product.name}
                                        </Link>
                                        <p className="text-sm text-gray-700 mt-1">
                                            {formatPrice(product.price)}
                                        </p>
                                        <div className="mt-1 flex items-center justify-between">
                                            <div className="flex items-center">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg
                                                        key={i}
                                                        className={`h-3 w-3 ${i < Math.round(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                            <span className="text-xs font-medium text-green-600">
                                                {product.salesCount || 0} đã bán
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Đơn hàng gần đây</h2>
                    <Link to="/admin/orders" className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium">
                        Xem tất cả
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mã đơn
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Khách hàng
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày đặt
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tổng tiền
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoadingOrders ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center">
                                        <LoadingSpinner size="small" />
                                    </td>
                                </tr>
                            ) : recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        Chưa có đơn hàng nào
                                    </td>
                                </tr>
                            ) : (
                                recentOrders.map((order) => {
                                    return (
                                        <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <Link to={`/admin/orders/${order._id}`} className="text-blue-600 hover:underline font-medium">
                                                    {order.orderNumber}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{order.user?.fullName || "Khách vãng lai"}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-700">
                                                    {formatDate(order.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{formatPrice(order.total)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {renderStatusBadge(order.status)}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
