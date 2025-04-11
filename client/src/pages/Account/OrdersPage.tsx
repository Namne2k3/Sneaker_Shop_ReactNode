import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import orderService from '../../services/orderService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const OrdersPage = () => {
    const [activeTab, setActiveTab] = useState('all');

    // Fetch user orders
    const { data: ordersData, isLoading, error } = useQuery({
        queryKey: ['userOrders'],
        queryFn: orderService.getUserOrders,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center text-red-500">
                    Đã xảy ra lỗi khi tải đơn hàng. Vui lòng thử lại sau.
                </div>
            </div>
        );
    }

    // console.log("Check ordersData >>> ", ordersData.data.data.orders);

    const orders = ordersData?.data?.data?.orders || []

    // Filter orders based on active tab
    const filteredOrders = orders.filter(order => {
        if (activeTab === 'all') return true;
        return order.status === activeTab;
    });

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
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'shipped':
                return 'bg-indigo-100 text-indigo-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Translate status to Vietnamese
    const translateStatus = (status) => {
        switch (status) {
            case 'pending':
                return 'Chờ xác nhận';
            case 'processing':
                return 'Đang xử lý';
            case 'shipped':
                return 'Đang giao hàng';
            case 'delivered':
                return 'Đã giao hàng';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>

            {/* Tabs */}
            <div className="mb-6 border-b">
                <nav className="flex flex-wrap -mb-px">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'all'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Chờ xác nhận
                    </button>
                    <button
                        onClick={() => setActiveTab('processing')}
                        className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'processing'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Đang xử lý
                    </button>
                    <button
                        onClick={() => setActiveTab('shipped')}
                        className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'shipped'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Đang giao hàng
                    </button>
                    <button
                        onClick={() => setActiveTab('delivered')}
                        className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'delivered'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Đã giao hàng
                    </button>
                    <button
                        onClick={() => setActiveTab('cancelled')}
                        className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'cancelled'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Đã hủy
                    </button>
                </nav>
            </div>

            {/* Orders list */}
            {filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500">Không tìm thấy đơn hàng nào</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => (
                        <div key={order._id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                                <div>
                                    <span className="font-medium">Đơn hàng #{order.orderNumber}</span>
                                    <span className="text-gray-500 text-sm ml-4">
                                        {order.createdAt && format(new Date(order.createdAt), "dd MMMM, yyyy 'lúc' HH:mm", { locale: vi })}
                                    </span>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                                    {translateStatus(order.status)}
                                </div>
                            </div>

                            <div className="p-6">
                                {/* Order items summary */}
                                <div className="space-y-3 mb-4">
                                    {order.items.slice(0, 2).map((item, index) => (
                                        <div key={item._id} className="flex items-center">
                                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                                <img
                                                    src={`${item.image}`}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover object-center"
                                                />
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                                                <p className="mt-1 text-sm text-gray-500">SL: {item.quantity}</p>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">{formatPrice(item.price)}</p>
                                        </div>
                                    ))}

                                    {order.items.length > 2 && (
                                        <p className="text-sm text-gray-500">
                                            +{order.items.length - 2} sản phẩm khác
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-between border-t pt-4">
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {order.items.reduce((total, item) => total + item.quantity, 0)} sản phẩm
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Tổng tiền:</p>
                                        <p className="text-lg font-semibold text-primary">{formatPrice(order.total)}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end space-x-3">
                                    <Link
                                        to={`/account/orders/${order._id}`}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                    >
                                        Xem chi tiết
                                    </Link>
                                    {order.status === 'pending' && (
                                        <button
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            Hủy đơn hàng
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
