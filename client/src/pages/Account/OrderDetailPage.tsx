import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import orderService from '../../services/orderService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-toastify';

const OrderDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const queryClient = useQueryClient();
    const [cancelReason, setCancelReason] = useState('');

    // Fetch order details
    const { data: orderData, isLoading, error } = useQuery({
        queryKey: ['order', id],
        queryFn: () => orderService.getOrderById(id as string),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!id,
    });

    // Cancel order mutation
    const cancelOrderMutation = useMutation({
        mutationFn: () => orderService.cancelOrder(id as string, cancelReason),
        onSuccess: () => {
            toast.success('Đã hủy đơn hàng thành công');
            setShowCancelConfirm(false);
            setCancelReason('');
            queryClient.invalidateQueries({ queryKey: ['order', id] });
            queryClient.invalidateQueries({ queryKey: ['userOrders'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi hủy đơn hàng');
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (error || !orderData) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center text-red-500">
                    Đã xảy ra lỗi khi tải thông tin đơn hàng. Vui lòng thử lại sau.
                </div>
            </div>
        );
    }

    const order = orderData.data.data

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
            default: return status;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Back button */}
            <div className="mb-6">
                <Link to="/orders" className="inline-flex items-center text-primary hover:underline">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Quay lại danh sách đơn hàng
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                {/* Order header */}
                <div className="px-6 py-4 border-b flex flex-col md:flex-row md:justify-between md:items-center bg-gray-50">
                    <div className="mb-2 md:mb-0">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold">Đơn hàng #{order.orderNumber}</h1>
                            <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                                {translateStatus(order.status)}
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm">
                            {order.createdAt && format(new Date(order.createdAt), "dd MMMM, yyyy 'lúc' HH:mm", { locale: vi })}
                        </p>
                    </div>

                    {order.status === 'pending' && (
                        <div className="mt-2 md:mt-0">
                            <button
                                onClick={() => setShowCancelConfirm(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Hủy đơn hàng
                            </button>
                        </div>
                    )}
                </div>

                {/* Order content */}
                <div className="p-6">
                    {/* Shipping and payment info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="border rounded-md p-4">
                            <h2 className="font-semibold text-gray-900 mb-3">Thông tin giao hàng</h2>
                            <div className="space-y-1 text-sm">
                                <p className="flex">
                                    <span className="text-gray-500 w-24">Họ tên:</span>
                                    <span className="font-medium">{order.shippingAddress.fullName}</span>
                                </p>
                                <p className="flex">
                                    <span className="text-gray-500 w-24">Số điện thoại:</span>
                                    <span className="font-medium">{order.shippingAddress.phone}</span>
                                </p>
                                <p className="flex">
                                    <span className="text-gray-500 w-24">Email:</span>
                                    <span className="font-medium">{order.shippingAddress.email}</span>
                                </p>
                                <p className="flex">
                                    <span className="text-gray-500 w-24">Địa chỉ:</span>
                                    <span className="font-medium">{order.shippingAddress.address}, {order.shippingAddress.city}</span>
                                </p>
                                {order.notes && (
                                    <p className="flex">
                                        <span className="text-gray-500 w-24">Ghi chú:</span>
                                        <span className="font-medium">{order.notes}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="border rounded-md p-4">
                            <h2 className="font-semibold text-gray-900 mb-3">Thông tin thanh toán</h2>
                            <div className="space-y-1 text-sm">
                                <p className="flex">
                                    <span className="text-gray-500 w-36">Phương thức:</span>
                                    <span className="font-medium">{order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}</span>
                                </p>
                                <p className="flex">
                                    <span className="text-gray-500 w-36">Trạng thái:</span>
                                    <span className="font-medium">{order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
                                </p>
                                {order.paymentMethod === 'banking' && !order.isPaid && (
                                    <div className="mt-3 pt-3 border-t">
                                        <p className="text-sm font-medium text-gray-900">Thông tin chuyển khoản:</p>
                                        <p className="text-sm text-gray-700">Ngân hàng: VCB - Vietcombank</p>
                                        <p className="text-sm text-gray-700">Chủ tài khoản: Nguyễn Văn A</p>
                                        <p className="text-sm text-gray-700">Số tài khoản: 1234567890</p>
                                        <p className="text-sm text-gray-700">Nội dung: Thanh toán đơn hàng #{order.orderNumber}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order timeline */}
                    <div className="mb-8">
                        <h2 className="font-semibold text-gray-900 mb-3">Trạng thái đơn hàng</h2>
                        <div className="border rounded-md p-6">
                            <ol className="relative border-l border-gray-200">
                                {order.statusHistory && order.statusHistory.map((history, index) => (
                                    <li key={index} className="mb-6 ml-6">
                                        <span className="absolute flex items-center justify-center w-6 h-6 bg-primary rounded-full -left-3 ring-8 ring-white">
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                        </span>
                                        <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900">
                                            {translateStatus(history.status)}
                                        </h3>
                                        {history.timestamp && (
                                            <time className="block mb-2 text-sm font-normal leading-none text-gray-400">
                                                {format(new Date(history.timestamp), "dd MMMM, yyyy 'lúc' HH:mm", { locale: vi })}
                                            </time>
                                        )}
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
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-16 w-16 flex-shrink-0 mr-4">
                                                        <img
                                                            src={item.product?.images?.[0]?.imagePath || "https://via.placeholder.com/150"}
                                                            alt={item.product?.name}
                                                            className="h-full w-full object-cover object-center rounded"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=No+Image";
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{item.product?.name}</div>
                                                        {item.variant && (
                                                            <div className="text-sm text-gray-500">
                                                                {item.variant.size?.name}, {item.variant.color?.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatPrice(item.price)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                                {formatPrice(item.price * item.quantity)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Order summary */}
                    <div className="border rounded-md p-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tạm tính:</span>
                                <span>{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Phí vận chuyển:</span>
                                <span>{formatPrice(order.shippingFee)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Giảm giá:</span>
                                    <span>-{formatPrice(order.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold text-lg">
                                <span>Tổng cộng:</span>
                                <span className="text-primary">{formatPrice(order.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel order confirmation modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                                            Xác nhận hủy đơn hàng
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 mb-4">
                                                Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
                                            </p>
                                            <div className="mt-4">
                                                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Lý do hủy đơn hàng
                                                </label>
                                                <textarea
                                                    id="reason"
                                                    name="reason"
                                                    rows={3}
                                                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                                    placeholder="Vui lòng cho biết lý do bạn hủy đơn hàng này..."
                                                    value={cancelReason}
                                                    onChange={(e) => setCancelReason(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => cancelOrderMutation.mutate()}
                                    disabled={cancelOrderMutation.isPending}
                                >
                                    {cancelOrderMutation.isPending ? 'Đang xử lý...' : 'Hủy đơn hàng'}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowCancelConfirm(false)}
                                >
                                    Quay lại
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
