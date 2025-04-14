import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';
import orderService from '../../../services/orderService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { useAppSelector } from '../../../store/hooks';
import ForbiddenPage from '../../../components/common/ForbiddenPage';

const OrderDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    // Add auth state check
    const { isAuthenticated, user } = useAppSelector(state => state.auth);

    const [statusUpdateData, setStatusUpdateData] = useState({
        status: '',
        note: ''
    });

    const [showStatusModal, setShowStatusModal] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    // Fixed authentication check
    useEffect(() => {
        // If not authenticated, redirect to login
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/admin/orders/${id}` } });
            return;
        }

        // If not admin, redirect to forbidden
        if (user?.role !== 'admin') {
            navigate('/forbidden');
            return;
        }

        // Mark auth as checked
        setAuthChecked(true);
    }, [isAuthenticated, user, navigate, id]);

    // Fetch order details
    const { data: orderData, isLoading, error } = useQuery({
        queryKey: ['order', id],
        queryFn: () => orderService.getOrderById(id as string),
        enabled: !!id && isAuthenticated && user?.role === 'admin', // Only fetch if authenticated and admin
    });

    // Update order status mutation
    const updateStatusMutation = useMutation({
        mutationFn: (data: { status: string; note: string }) =>
            orderService.updateOrderStatus(id as string, data.status, data.note),
        onSuccess: () => {
            toast.success('Cập nhật trạng thái đơn hàng thành công');
            setShowStatusModal(false);
            // Invalidate and refetch order data
            queryClient.invalidateQueries({ queryKey: ['order', id] });
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Cập nhật trạng thái thất bại');
        }
    });

    // Handle status update
    const handleStatusUpdate = () => {
        if (!statusUpdateData.status) {
            toast.error('Vui lòng chọn trạng thái mới');
            return;
        }
        updateStatusMutation.mutate(statusUpdateData);
    };

    // Don't check if the order belongs to the user when in admin mode
    if (!authChecked || !isAuthenticated) {
        return (
            <div className="flex justify-center items-center p-8">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    // If user is not admin, show forbidden page
    if (user?.role !== 'admin') {
        return <ForbiddenPage />;
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (error || !orderData) {
        return (
            <div className="p-4">
                <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-500">Đã xảy ra lỗi khi tải thông tin đơn hàng.</p>
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="mt-2 text-blue-600 hover:underline"
                    >
                        Quay lại danh sách đơn hàng
                    </button>
                </div>
            </div>
        );
    }

    const order = orderData.data.data;

    // Format price with Vietnamese currency
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Get status badge color
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

    // Get next possible statuses based on current status
    const getNextPossibleStatuses = (currentStatus) => {
        const statusFlow = {
            'pending': ['processing', 'cancelled'],
            'processing': ['shipped', 'cancelled'],
            'shipped': ['delivered', 'cancelled'],
            'delivered': ['refunded'],
            'cancelled': [],
            'refunded': []
        };

        return statusFlow[currentStatus] || [];
    };

    const nextPossibleStatuses = getNextPossibleStatuses(order.status);

    return (
        <div className="p-4">
            {/* Back button */}
            <div className="mb-4">
                <Link to="/admin/orders" className="inline-flex items-center text-blue-600 hover:underline">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Quay lại danh sách đơn hàng
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                {/* Order header */}
                <div className="px-6 py-4 border-b flex flex-col md:flex-row md:justify-between md:items-center bg-gray-50">
                    <div className="mb-4 md:mb-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-bold">Đơn hàng #{order.orderNumber}</h1>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                                {translateStatus(order.status)}
                            </div>
                            <span className="text-gray-500 text-sm">
                                {order.createdAt && format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {nextPossibleStatuses.length > 0 && (
                            <button
                                onClick={() => setShowStatusModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cập nhật trạng thái
                            </button>
                        )}

                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            In đơn hàng
                        </button>
                    </div>
                </div>

                {/* Order content */}
                <div className="p-6">
                    {/* Customer and shipping info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="border rounded-md p-4">
                            <h2 className="font-semibold text-gray-900 mb-3">Thông tin khách hàng</h2>
                            <div className="space-y-1 text-sm">
                                <p className="flex">
                                    <span className="text-gray-500 w-32">Khách hàng:</span>
                                    <span className="font-medium">{order.user?.name || order.shippingAddress.fullName}</span>
                                </p>
                                <p className="flex">
                                    <span className="text-gray-500 w-32">Email:</span>
                                    <span className="font-medium">{order.user?.email || order.shippingAddress.email}</span>
                                </p>
                                <p className="flex">
                                    <span className="text-gray-500 w-32">Số điện thoại:</span>
                                    <span className="font-medium">{order.shippingAddress.phone}</span>
                                </p>
                            </div>
                        </div>

                        <div className="border rounded-md p-4">
                            <h2 className="font-semibold text-gray-900 mb-3">Thông tin giao hàng</h2>
                            <div className="space-y-1 text-sm">
                                <p className="flex">
                                    <span className="text-gray-500 w-32">Địa chỉ:</span>
                                    <span className="font-medium">{order.shippingAddress.address}</span>
                                </p>
                                <p className="flex">
                                    <span className="text-gray-500 w-32">Thành phố:</span>
                                    <span className="font-medium">{order.shippingAddress.city}</span>
                                </p>
                                {order.notes && (
                                    <p className="flex">
                                        <span className="text-gray-500 w-32">Ghi chú:</span>
                                        <span className="font-medium">{order.notes}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment information */}
                    <div className="border rounded-md p-4 mb-8">
                        <h2 className="font-semibold text-gray-900 mb-3">Thông tin thanh toán</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1 text-sm">
                                <p className="flex">
                                    <span className="text-gray-500 w-32">Phương thức:</span>
                                    <span className="font-medium">
                                        {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}
                                    </span>
                                </p>
                                <p className="flex">
                                    <span className="text-gray-500 w-32">Trạng thái:</span>
                                    <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Order timeline */}
                    <div className="mb-8">
                        <h2 className="font-semibold text-gray-900 mb-3">Lịch sử đơn hàng</h2>
                        <div className="border rounded-md p-6">
                            <ol className="relative border-l border-gray-200">
                                {order.statusHistory && order.statusHistory.map((history, index) => (
                                    <li key={index} className="mb-6 ml-6">
                                        <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full -left-3 ring-8 ring-white">
                                            <svg className="w-2.5 h-2.5 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                                            </svg>
                                        </span>
                                        <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900">
                                            {translateStatus(history.status)}
                                        </h3>
                                        <time className="block mb-2 text-sm font-normal leading-none text-gray-400">
                                            {format(new Date(history.timestamp), "dd/MM/yyyy HH:mm", { locale: vi })}
                                        </time>
                                        {history.note && (
                                            <p className="mb-4 text-base font-normal text-gray-500">{history.note}</p>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>

                    {/* Order details */}
                    <div className="mb-8">
                        <h2 className="font-semibold text-gray-900 mb-3">Chi tiết đơn hàng</h2>
                        <div className="border rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sản phẩm
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Giá
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Số lượng
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thành tiền
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {order.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-16 w-16 mr-4">
                                                        <img
                                                            src={item.image || "https://via.placeholder.com/150"}
                                                            alt={item.name}
                                                            loading='lazy'
                                                            className="h-16 w-16 object-cover rounded-md"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=No+Image";
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{formatPrice(item.price)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{item.quantity}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-sm font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Order summary */}
                    <div className="border rounded-md p-4">
                        <div className="flex justify-end space-y-2">
                            <div className="w-full md:w-1/2 lg:w-1/3">
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-600">Tạm tính:</span>
                                    <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-600">Phí vận chuyển:</span>
                                    <span>{formatPrice(order.shippingFee)}</span>
                                </div>
                                {order.discount > 0 && (
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-600">Giảm giá:</span>
                                        <span className="text-red-500">-{formatPrice(order.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-2 border-t border-gray-200 font-semibold">
                                    <span>Tổng cộng:</span>
                                    <span className="text-blue-600">{formatPrice(order.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status update modal */}
            {showStatusModal && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                Cập nhật trạng thái đơn hàng
                            </h3>
                            <div className="mt-4">
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                    Trạng thái mới
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    value={statusUpdateData.status}
                                    onChange={(e) => setStatusUpdateData({ ...statusUpdateData, status: e.target.value })}
                                >
                                    <option value="">Chọn trạng thái</option>
                                    {nextPossibleStatuses.map((status) => (
                                        <option key={status} value={status}>{translateStatus(status)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mt-4">
                                <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                                    Ghi chú (không bắt buộc)
                                </label>
                                <textarea
                                    id="note"
                                    name="note"
                                    rows={3}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Nhập ghi chú cho cập nhật này"
                                    value={statusUpdateData.note}
                                    onChange={(e) => setStatusUpdateData({ ...statusUpdateData, note: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="mt-5 sm:mt-6 flex gap-3">
                                <button
                                    type="button"
                                    className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                                    onClick={handleStatusUpdate}
                                    disabled={updateStatusMutation.isPending}
                                >
                                    {updateStatusMutation.isPending ? 'Đang xử lý...' : 'Cập nhật'}
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                                    onClick={() => setShowStatusModal(false)}
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetailPage;
