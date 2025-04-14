import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import cartService from '../../services/cartService';
import LoadingSpinner from '../common/LoadingSpinner';

interface MiniCartPreviewProps {
    isVisible: boolean;
    onClose: () => void;
}

const MiniCartPreview = ({ isVisible, onClose }: MiniCartPreviewProps) => {
    const { data: cartResponse, isLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: cartService.getCart,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    const cartItems = cartResponse?.data?.products || [];

    // Format price with Vietnamese currency
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    if (!isVisible) return null;

    return (
        <div
            className="absolute top-full right-0 mt-2 w-80 bg-white shadow-lg rounded-md z-50"
            onMouseLeave={onClose}
        >
            <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Giỏ hàng của bạn</h3>

                {isLoading ? (
                    <div className="flex justify-center items-center py-4">
                        <LoadingSpinner size="small" />
                    </div>
                ) : cartItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Giỏ hàng trống</p>
                ) : (
                    <>
                        <ul className="max-h-60 overflow-y-auto divide-y divide-gray-200">
                            {cartItems.slice(0, 3).map((item: any) => {
                                return (
                                    <li key={item._id} className="py-2">
                                        <div className="flex items-center">
                                            <div className="h-12 w-12 flex-shrink-0">
                                                <img
                                                    src={item.product.images.find((img: any) => img.isPrimary)?.imagePath || item.product.images[0]?.imagePath}
                                                    alt={item.product.name}
                                                    className="h-full w-full object-cover object-center"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/100x100?text=No+Image";
                                                    }}
                                                    loading='lazy'
                                                />
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {item.quantity} x {formatPrice(item.product.salePrice || item.product.basePrice)}
                                                </p>
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}

                            {cartItems.length > 3 && (
                                <li className="py-2 text-center text-sm text-gray-500">
                                    +{cartItems.length - 3} sản phẩm khác
                                </li>
                            )}
                        </ul>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Tổng cộng ({cartItems.length} sản phẩm):</span>
                                <span className="text-primary">
                                    {formatPrice(
                                        cartItems.reduce((total: number, item: any) => total + ((item.product.salePrice || item.product.basePrice) + item.variant.additionalPrice) * item.quantity, 0)
                                    )}
                                </span>
                            </div>

                            <div className="mt-4">
                                <Link
                                    to="/cart"
                                    className="w-full inline-block text-center bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
                                    onClick={onClose}
                                >
                                    Xem giỏ hàng
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MiniCartPreview;
