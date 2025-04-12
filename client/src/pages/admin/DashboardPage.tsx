import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import statisticsService from '../../services/dashboardAdminSerrvice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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
        fillName: string
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

const DashboardPage = () => {

    const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: statisticsService.getOrderStatistics,
    });

    const { data: recentOrdersData, isLoading: isLoadingOrders } = useQuery({
        queryKey: ['recent-orders'],
        queryFn: () => statisticsService.getOrderStatistics({ limit: 5 })
    });

    // Fetch popular products
    const { data: popularProductsData, isLoading: isLoadingProducts } = useQuery({
        queryKey: ['popular-products'],
        queryFn: () => statisticsService.getPopularProducts(3),
    });

    const { data: usersData, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['users-count'],
        queryFn: statisticsService.getUsersCount,
    });

    const isLoading = isLoadingStats || isLoadingOrders || isLoadingProducts || isLoadingUsers;

    const [stats, setStats] = useState<DashboardStat[]>([
        {
            title: 'Đơn hàng',
            value: '...',
            change: '+5%',
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
            iconBg: 'bg-blue-500',
            link: '/admin/orders'
        },
        {
            title: 'Doanh thu',
            value: '...',
            change: '+12%',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            iconBg: 'bg-green-500',
            link: '/admin/revenue'
        },
        {
            title: 'Sản phẩm',
            value: '...',
            change: '+3%',
            icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
            iconBg: 'bg-indigo-500',
            link: '/admin/products'
        },
        {
            title: 'Khách hàng',
            value: '...',
            change: '+7%',
            icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
            iconBg: 'bg-orange-500',
            link: '/admin/users'
        }
    ]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && dashboardStats && popularProductsData && usersData) {
            const totalOrders = dashboardStats.data.totalOrders || 0;
            const totalRevenue = dashboardStats.data.totalRevenue || 0;
            const totalProducts = popularProductsData.data.totalProducts || 0;
            const totalUsers = usersData.data.totalUsers || 0;

            const ordersThisMonth = dashboardStats.data.ordersThisMonth || 0;
            const revenueThisMonth = dashboardStats.data.revenueThisMonth || 0;

            // Format growth percentages (placeholder calculations)
            const orderGrowth = totalOrders > 0 ? `+${Math.round((ordersThisMonth / totalOrders) * 100)}%` : '+0%';
            const revenueGrowth = totalRevenue > 0 ? `+${Math.round((revenueThisMonth / totalRevenue) * 100)}%` : '+0%';
            const productGrowth = '+3%'; // This would need actual data from your API
            const userGrowth = '+5%';    // This would need actual data from your API

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
                    change: productGrowth,
                    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
                    iconBg: 'bg-indigo-500',
                    link: '/admin/products'
                },
                {
                    title: 'Khách hàng',
                    value: totalUsers,
                    change: userGrowth,
                    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
                    iconBg: 'bg-orange-500',
                    link: '/admin/users'
                }
            ]);
        }
    }, [isLoading, dashboardStats, popularProductsData, usersData]);

    const recentOrders: Order[] = recentOrdersData?.data?.orders || [];

    const popularProducts: PopularProduct[] = popularProductsData?.data?.products || [];

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
                <p className="text-gray-600">Xin chào, đây là tổng quan hệ thống của bạn</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {stats.map((stat, index) => (
                    <Link
                        key={index}
                        to={stat.link}
                        className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5 flex items-center"
                    >
                        <div className={`${stat.iconBg} rounded-full p-3 mr-4`}>
                            <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                            <div className="flex items-center">
                                <p className="text-xl font-semibold text-gray-800">
                                    {loading ? '...' : stat.value}
                                </p>
                                <span className="text-sm text-green-500 ml-2">{stat.change}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow mb-8">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Đơn hàng gần đây</h2>
                    <Link to="/admin/orders" className="text-primary hover:text-primary-dark">
                        Xem tất cả
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mã đơn hàng
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

                            {/* kiểm tra nếu đang loading thì hiển thị loadingSpinner */}
                            {/* nếu không có đơn hàng nào thì hiển thị thông báo không có đơn hàng nào */}
                            {isLoadingOrders ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center">
                                        <LoadingSpinner size="small" />
                                    </td>
                                </tr>
                            ) : recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        Không có đơn hàng nào
                                    </td>
                                </tr>
                            ) : (
                                recentOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{order.orderNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{order.user?.fullName || "Không xác định"}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{order.total.toLocaleString('vi-VN')}₫</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    order.status === 'processing' || order.status === 'shipping' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                            'bg-red-100 text-red-800'}`}
                                            >
                                                {order.status === 'pending' ? 'Chờ xử lý' :
                                                    order.status === 'processing' ? 'Đang xử lý' :
                                                        order.status === 'shipping' ? 'Đang giao' :
                                                            order.status === 'delivered' ? 'Hoàn thành' :
                                                                order.status === 'cancelled' ? 'Đã hủy' :
                                                                    'Không xác định'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Popular Products */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Sản phẩm phổ biến</h2>
                    <Link to="/admin/products" className="text-primary hover:text-primary-dark">
                        Xem tất cả
                    </Link>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoadingProducts ? (
                        <div className="col-span-3 flex justify-center">
                            <LoadingSpinner size="medium" />
                        </div>
                    ) : popularProducts.length === 0 ? (
                        <div className="col-span-3 text-center text-gray-500">
                            Không có dữ liệu sản phẩm
                        </div>
                    ) : (
                        popularProducts.map((product) => (
                            <div key={product._id} className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                                <div className="bg-gray-200 h-16 w-16 rounded-md mr-4 flex-shrink-0">
                                    <img
                                        src={product.images?.[0] || `https://via.placeholder.com/64x64?text=Product`}
                                        alt={product.name}
                                        className="h-full w-full object-cover rounded-md"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "https://via.placeholder.com/64x64?text=NoImage";
                                        }}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        <span className="font-semibold text-gray-900">{product.price.toLocaleString('vi-VN')}₫</span>
                                        <span className="ml-2 text-green-600">({product.salesCount || 0} đã bán)</span>
                                    </p>
                                    <div className="mt-1 flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className={`h-4 w-4 ${i < Math.round(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
