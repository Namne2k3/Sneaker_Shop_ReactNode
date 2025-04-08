import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import orderService from '../../../services/orderService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useAppSelector } from '../../../store/hooks';

const OrdersPage = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [status, setStatus] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Add auth state check
    const { isAuthenticated, user } = useAppSelector(state => state.auth);

    // Debug authentication effect
    useEffect(() => {
        console.log('Auth status in OrdersPage:', { isAuthenticated, userRole: user?.role });

        // If not authenticated, redirect to login
        if (!isAuthenticated) {
            console.log('Not authenticated, redirecting to login');
            navigate('/login', { state: { from: '/admin/orders' } });
            return;
        }

        // If not admin, redirect to forbidden
        if (user?.role !== 'admin') {
            console.log('Not admin, access forbidden');
            navigate('/forbidden');
            return;
        }
    }, [isAuthenticated, user, navigate]);

    // Fetch orders with filtering and pagination
    const { data, isLoading, error } = useQuery({
        queryKey: ['admin-orders', page, limit, status, sortBy, sortOrder],
        queryFn: () => orderService.getAllOrders({
            page,
            limit,
            status: status || undefined,
            sortBy,
            sortOrder
        }),
        enabled: isAuthenticated && user?.role === 'admin', // Only fetch if authenticated and admin
        keepPreviousData: true
    });

    // Handle page change
    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    // Handle status filter change
    const handleStatusChange = (e) => {
        setStatus(e.target.value);
        setPage(1);  // Reset to first page when filter changes
    };

    // Handle sort change
    const handleSortChange = (e) => {
        const value = e.target.value;
        const [newSortBy, newSortOrder] = value.split('-');
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        setPage(1);  // Reset to first page when sort changes
    };

    // Format price with Vietnamese currency
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Function to get status badge color
    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'processing': return 'bg-blue-100 text-blue-800';
            case 'shipped': return 'bg-indigo-100 text-indigo-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'refunded': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Translate status to Vietnamese
    const translateStatus = (status) => {
        switch (status) {
            case 'pending': return 'Chờ xác nhận';
            case 'processing': return 'Đang xử lý';
            case 'shipped': return 'Đang giao hàng';
            case 'delivered': return 'Đã giao hàng';
            case 'cancelled': return 'Đã hủy';
            case 'refunded': return 'Đã hoàn tiền';
            default: return status;
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-500">Đã xảy ra lỗi khi tải dữ liệu đơn hàng.</p>
                </div>
            </div>
        );
    }

    const orders = data?.data?.data?.orders || [];
    const totalPages = data?.data?.data?.totalPages || 0;

    return (
        <div className="p-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Quản lý đơn hàng</h1>
                <p className="text-gray-600">Quản lý và cập nhật trạng thái đơn hàng</p>
            </div>

            {/* Filter and sort controls */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div>
                        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Lọc theo trạng thái</label>
                        <select
                            id="status-filter"
                            value={status}
                            onChange={handleStatusChange}
                            className="form-select rounded border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="pending">Chờ xác nhận</option>
                            <option value="processing">Đang xử lý</option>
                            <option value="shipped">Đang giao hàng</option>
                            <option value="delivered">Đã giao hàng</option>
                            <option value="cancelled">Đã hủy</option>
                            <option value="refunded">Đã hoàn tiền</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">Sắp xếp</label>
                        <select
                            id="sort-order"
                            value={`${sortBy}-${sortOrder}`}
                            onChange={handleSortChange}
                            className="form-select rounded border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        >
                            <option value="createdAt-desc">Mới nhất trước</option>
                            <option value="createdAt-asc">Cũ nhất trước</option>
                            <option value="total-desc">Giá trị cao đến thấp</option>
                            <option value="total-asc">Giá trị thấp đến cao</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thanh toán
                                </th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                #{order.orderNumber}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {order.shippingAddress?.fullName || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {order.shippingAddress?.phone || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: vi })}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {format(new Date(order.createdAt), 'HH:mm', { locale: vi })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatPrice(order.total)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {order.items?.length || 0} sản phẩm
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                                                {translateStatus(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                            </span>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {order.paymentMethod === 'cod' ? 'COD' : 'Chuyển khoản'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <Link
                                                to={`/admin/orders/${order._id}`}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Chi tiết
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                        Không tìm thấy đơn hàng nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Trang <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span>
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className={`px-3 py-1 rounded ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'}`}
                                >
                                    Trước
                                </button>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className={`px-3 py-1 rounded ${page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'}`}
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Order statistics summary */}
            {data?.data?.data?.totalItems && (
                <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-lg font-medium mb-2">Tổng quan</h2>
                    <p>Tổng số đơn hàng: {data.data.data.totalItems}</p>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
