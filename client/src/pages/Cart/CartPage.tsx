import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import cartService from '../../services/cartService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface CartItem {
    _id: string;
    product: {
        _id: string;
        name: string;
        slug: string;
        images: Array<{ imagePath: string; isPrimary: boolean }>;
        basePrice: number;
        salePrice: number;
    };
    variant?: {
        _id: string;
        size: { name: string; value: string };
        color: { name: string; code: string };
        stock: number;
        additionalPrice: number;
    };
    quantity: number;
    price: number;
}

interface CartData {
    _id: string;
    user: string;
    products: CartItem[];
}

const CartPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isAllSelected, setIsAllSelected] = useState<boolean>(false);

    // Fetch cart data
    const { data: cartResponse, isLoading, isError, refetch } = useQuery({
        queryKey: ['cart'],
        queryFn: cartService.getCart,
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 5, // 5 minute stale time
    });

    const cartData = cartResponse?.data as CartData;
    const cartItems = cartData?.products || [];

    // Update selected items when cart data changes
    useEffect(() => {
        if (cartItems.length > 0 && isAllSelected) {
            const allItemIds = cartItems.map(item => item._id);
            setSelectedItems(new Set(allItemIds));
        } else if (cartItems.length === 0) {
            setSelectedItems(new Set());
            setIsAllSelected(false);
        } else {
            // Check if all current items are selected
            const newIsAllSelected = cartItems.every(item => selectedItems.has(item._id));
            setIsAllSelected(newIsAllSelected);
        }
    }, [cartItems]);

    // Update quantity mutation
    const updateQuantityMutation = useMutation({
        mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => {
            return cartService.updateCartItemQuantity(itemId, quantity);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật số lượng');
        }
    });

    // Remove item mutation
    const removeItemMutation = useMutation({
        mutationFn: (itemId: string) => {
            return cartService.removeFromCart(itemId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa sản phẩm khỏi giỏ hàng');
        }
    });

    // Clear cart mutation
    const clearCartMutation = useMutation({
        mutationFn: cartService.clearCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            setSelectedItems(new Set());
            setIsAllSelected(false);
            toast.success('Đã xóa tất cả sản phẩm khỏi giỏ hàng');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa giỏ hàng');
        }
    });

    // Format price with Vietnamese currency - Fix NaN issue
    const formatPrice = (price: number) => {
        if (price === undefined || isNaN(price)) {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(0);
        }
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Handle quantity change
    const handleQuantityChange = (itemId: string, quantity: number) => {
        if (quantity < 1) return;
        updateQuantityMutation.mutate({ itemId, quantity });
    };

    // Handle item selection
    const toggleItemSelection = (itemId: string) => {
        const newSelectedItems = new Set(selectedItems);
        if (selectedItems.has(itemId)) {
            newSelectedItems.delete(itemId);
        } else {
            newSelectedItems.add(itemId);
        }
        setSelectedItems(newSelectedItems);
        setIsAllSelected(newSelectedItems.size === cartItems.length);
    };

    // Handle select/deselect all - Fix selection issue
    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedItems(new Set());
        } else {
            const allItemIds = cartItems.map(item => item._id);
            setSelectedItems(new Set(allItemIds));
        }
        setIsAllSelected(!isAllSelected);
    };

    // Calculate totals - Fix NaN issue
    const calculateSubtotal = () => {
        if (!cartItems || cartItems.length === 0) return 0;

        return cartItems.reduce((total, item) => {
            if (selectedItems.has(item._id)) {
                const itemPrice = (item.product.salePrice || item.product.basePrice) + (item.variant?.additionalPrice || 0);
                const quantity = item.quantity || 1;
                return total + (itemPrice * quantity);
            }
            return total;
        }, 0);
    };

    // Proceed to checkout
    const handleCheckout = () => {
        if (selectedItems.size === 0) {
            toast.warning('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
            return;
        }

        // Get the selected items from the cart
        const selectedProducts = cartItems.filter(item => selectedItems.has(item._id));

        // Log for debugging
        console.log('Selected products for checkout:', selectedProducts);

        // Calculate the correct prices for each item before sending to checkout
        const productsWithCalculatedPrices = selectedProducts.map(item => {
            const itemPrice = (item.product.salePrice || item.product.basePrice) + (item.variant?.additionalPrice || 0);
            return {
                ...item,
                calculatedPrice: itemPrice // Add the calculated price for reference
            };
        });

        // Pass the selected products to the checkout page using navigation state
        navigate('/checkout', {
            state: {
                selectedProducts: productsWithCalculatedPrices
            }
        });
    };

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        navigate('/login', { state: { from: '/cart' } });
        return null;
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-600">
                        Đã xảy ra lỗi khi lấy thông tin giỏ hàng. Vui lòng thử lại sau.
                    </p>
                    <button
                        className="mt-2 text-blue-600 hover:underline"
                        onClick={() => refetch()}
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Giỏ hàng của bạn</h1>
                    <p className="text-gray-600 mb-8">Giỏ hàng của bạn hiện đang trống.</p>
                    <Link
                        to="/products"
                        className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
                    >
                        Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Giỏ hàng của bạn</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart items section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    checked={isAllSelected}
                                    onChange={toggleSelectAll}
                                />
                                <span className="ml-2 text-gray-700 font-medium">Chọn tất cả ({cartItems.length} sản phẩm)</span>

                                <button
                                    className="ml-auto text-gray-500 hover:text-red-600"
                                    onClick={() => clearCartMutation.mutate()}
                                    disabled={clearCartMutation.isPending}
                                >
                                    {clearCartMutation.isPending ? 'Đang xóa...' : 'Xóa tất cả'}
                                </button>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {cartItems.map((item) => (
                                <div key={item._id} className="p-4 flex flex-col sm:flex-row sm:items-center">
                                    <div className="flex items-center space-x-4 flex-grow">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                            checked={selectedItems.has(item._id)}
                                            onChange={() => toggleItemSelection(item._id)}
                                        />

                                        <div className="h-20 w-20 flex-shrink-0">
                                            <img
                                                src={item.product.images.find(img => img.isPrimary)?.imagePath || item.product.images[0]?.imagePath}
                                                alt={item.product.name}
                                                className="h-full w-full object-cover object-center"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/200x200?text=No+Image";
                                                }}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <Link to={`/products/${item.product.slug}`} className="text-gray-800 font-medium hover:text-primary truncate">
                                                {item.product.name}
                                            </Link>

                                            {item.variant && (
                                                <div className="text-sm text-gray-500 mt-1">
                                                    <span className="mr-2">Kích thước: {item.variant.size.name}</span>
                                                    <span>
                                                        Màu:
                                                        <span className="inline-block h-3 w-3 rounded-full ml-1 align-middle" style={{ backgroundColor: item.variant.color.code }}></span>
                                                        {' '}{item.variant.color.name}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="text-primary font-medium mt-1">
                                                {formatPrice((item.product.salePrice || item.product.basePrice) + (item.variant?.additionalPrice || 0))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center mt-4 sm:mt-0">
                                        <div className="flex items-center border border-gray-300 rounded-md">
                                            <button
                                                className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                                onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                                                disabled={updateQuantityMutation.isPending}
                                            >
                                                -
                                            </button>
                                            <span className="px-3 py-1 text-gray-800">{item.quantity}</span>
                                            <button
                                                className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                                onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                                                disabled={updateQuantityMutation.isPending}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <button
                                            className="ml-4 text-gray-500 hover:text-red-600"
                                            onClick={() => removeItemMutation.mutate(item._id)}
                                            disabled={removeItemMutation.isPending}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order summary section */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tạm tính ({selectedItems.size} sản phẩm):</span>
                                <span className="font-medium">{formatPrice(calculateSubtotal())}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Phí vận chuyển:</span>
                                <span className="font-medium">Miễn phí</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 flex justify-between">
                                <span className="text-lg font-semibold">Tổng cộng:</span>
                                <span className="text-lg text-primary font-bold">{formatPrice(calculateSubtotal())}</span>
                            </div>
                        </div>

                        <button
                            className="mt-6 w-full bg-primary text-white py-3 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                            onClick={handleCheckout}
                            disabled={selectedItems.size === 0}
                        >
                            Thanh toán
                        </button>

                        <div className="mt-4 text-center">
                            <Link
                                to="/products"
                                className="text-primary hover:underline"
                            >
                                Tiếp tục mua sắm
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
