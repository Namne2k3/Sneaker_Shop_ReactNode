import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

const OrderSuccessPage: React.FC = () => {
    const location = useLocation();
    const { orderId, orderNumber } = location.state || {};

    // Redirect if there's no order info
    if (!orderId) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
                <div className="flex justify-center mb-4">
                    <FaCheckCircle className="text-green-500 text-6xl" />
                </div>

                <h1 className="text-2xl font-bold mb-4">Đặt hàng thành công!</h1>

                <p className="text-gray-600 mb-6">
                    Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xác nhận.
                    <br />
                    Mã đơn hàng: <span className="font-semibold">{orderNumber}</span>
                </p>

                <div className="mb-8 p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-700 mb-2">
                        Chúng tôi sẽ gửi email xác nhận đơn hàng cho bạn cùng với thông tin chi tiết và thời gian giao hàng dự kiến.
                    </p>
                    <p className="text-gray-700">
                        Bạn có thể theo dõi trạng thái đơn hàng trong tài khoản của mình.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link
                        to={`/account/orders/${orderId}`}
                        className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                    >
                        Xem chi tiết đơn hàng
                    </Link>

                    <Link
                        to="/"
                        className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessPage;
