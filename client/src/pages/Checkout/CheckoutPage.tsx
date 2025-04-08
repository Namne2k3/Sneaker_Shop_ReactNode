import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import orderService from '../../services/orderService';

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
    calculatedPrice?: number; // Optional calculated price from cart
}

interface ShippingFormData {
    fullName: string;
    phoneNumber: string;
    email: string;
    address: string;
    city: string;
    district: string;
    ward: string;
    notes: string;
    paymentMethod: 'cod' | 'banking';
    shippingFee: number;
}

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const [selectedProducts, setSelectedProducts] = useState<CartItem[]>([]);

    // Form state
    const [formData, setFormData] = useState<ShippingFormData>({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phoneNumber: user?.phone || '',
        address: '',
        city: '',
        district: '',
        ward: '',
        notes: '',
        paymentMethod: 'cod',
        shippingFee: 30000
    });

    // Form errors
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        // Get selected products from location state
        if (location.state?.selectedProducts) {
            // console.log('Received products at checkout:', location.state.selectedProducts);
            setSelectedProducts(location.state.selectedProducts);
        } else {
            // Redirect to cart if no products are selected
            navigate('/cart');
            toast.error('Vui lòng chọn sản phẩm để thanh toán');
        }

        // Pre-fill form with user data if available
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.fullName || '',
                email: user.email || '',
                phoneNumber: user.phone || ''
            }));
        }
    }, [location.state, navigate, user]);

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when field is modified
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Handle radio button changes
    const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            paymentMethod: e.target.value as 'cod' | 'banking'
        }));
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        // Required fields validation
        if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên';
        if (!formData.email.trim()) newErrors.email = 'Vui lòng nhập email';
        else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
        else if (!/(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
        }

        if (!formData.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ';
        if (!formData.city.trim()) newErrors.city = 'Vui lòng nhập tỉnh/thành phố';
        if (!formData.district.trim()) newErrors.district = 'Vui lòng nhập quận/huyện';
        if (!formData.ward.trim()) newErrors.ward = 'Vui lòng nhập phường/xã';
        if (!formData.paymentMethod) newErrors.paymentMethod = 'Vui lòng chọn phương thức thanh toán';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Create order mutation
    const createOrderMutation = useMutation({
        mutationFn: (orderData: any) => {
            return orderService.createOrder(orderData);
        },
        onSuccess: (response) => {
            toast.success('Đặt hàng thành công!');
            // Navigate to order success page with order details
            navigate('/order-success', {
                state: {
                    orderId: response.data._id,
                    orderNumber: response.data.orderNumber
                }
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi đặt hàng');
        }
    });

    // Format price with Vietnamese currency
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

    // Calculate totals - use calculatedPrice from CartPage if available
    const calculateSubtotal = () => {
        if (!selectedProducts || selectedProducts.length === 0) return 0;

        return selectedProducts.reduce((total, item) => {
            // Use the pre-calculated price if available, otherwise calculate it
            const itemPrice = item.calculatedPrice ||
                ((item.product.salePrice || item.product.basePrice) + (item.variant?.additionalPrice || 0));
            const quantity = item.quantity || 1;

            // Log each item's price calculation for debugging
            // console.log(`Item ${item.product.name}: Price ${itemPrice} × Quantity ${quantity} = ${itemPrice * quantity}`);

            return total + (itemPrice * quantity);
        }, 0);
    };

    const handleCheckoutSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form before submission
        if (!validateForm()) return;

        const subtotal = calculateSubtotal(); // / No discount applied yet
        const shippingFee = 30000;
        const total = subtotal + shippingFee;

        const orderItems = selectedProducts.map(item => {
            const itemPrice = item.calculatedPrice ||
                ((item.product.salePrice || item.product.basePrice) + (item.variant?.additionalPrice || 0));

            return {
                product: item.product._id,
                variant: item.variant?._id,
                quantity: item.quantity,
                price: itemPrice,
                cartItemId: item._id // To help identify and remove from cart later
            };
        });

        const orderData = {
            shippingDetails: {
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                email: formData.email,
                address: formData.address,
                city: formData.city,
                district: formData.district,
                ward: formData.ward,
            },
            items: orderItems,
            paymentMethod: formData.paymentMethod,
            notes: formData.notes,
            subtotal: subtotal,
            shippingFee: shippingFee,
            total: total
        };

        console.log("Check orderData:", orderData);

        createOrderMutation.mutate(orderData);
    };

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        navigate('/login', { state: { from: '/checkout' } });
        return null;
    }

    if (!selectedProducts || selectedProducts.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Shipping form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Thông tin giao hàng</h2>

                        <form onSubmit={handleCheckoutSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Họ và tên <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.fullName && (
                                        <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                        Số điện thoại <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.phoneNumber && (
                                        <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                    Địa chỉ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.address && (
                                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                                        Tỉnh/Thành phố <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.city && (
                                        <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                                        Quận/Huyện <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="district"
                                        name="district"
                                        value={formData.district}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md ${errors.district ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.district && (
                                        <p className="text-red-500 text-sm mt-1">{errors.district}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">
                                        Phường/Xã <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="ward"
                                        name="ward"
                                        value={formData.ward}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md ${errors.ward ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.ward && (
                                        <p className="text-red-500 text-sm mt-1">{errors.ward}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                    Ghi chú
                                </label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn."
                                ></textarea>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-md font-semibold mb-2">Phương thức thanh toán</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <input
                                            id="cod"
                                            type="radio"
                                            name="paymentMethod"
                                            value="cod"
                                            checked={formData.paymentMethod === 'cod'}
                                            onChange={handlePaymentMethodChange}
                                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                                        />
                                        <label htmlFor="cod" className="ml-2 block text-sm text-gray-700">
                                            Thanh toán khi nhận hàng (COD)
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            id="banking"
                                            type="radio"
                                            name="paymentMethod"
                                            value="banking"
                                            checked={formData.paymentMethod === 'banking'}
                                            onChange={handlePaymentMethodChange}
                                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                                        />
                                        <label htmlFor="banking" className="ml-2 block text-sm text-gray-700">
                                            Chuyển khoản ngân hàng
                                        </label>
                                    </div>
                                </div>
                                {errors.paymentMethod && (
                                    <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-primary text-white py-3 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                                disabled={createOrderMutation.isPending}
                            >
                                {createOrderMutation.isPending ? 'Đang xử lý...' : 'Đặt hàng'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Order summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow p-6 sticky top-20">
                        <h2 className="text-lg font-semibold mb-4">Đơn hàng của bạn</h2>

                        <div className="space-y-4 mb-4">
                            {selectedProducts.map((item) => (
                                <div key={item._id} className="flex space-x-3">
                                    <div className="h-16 w-16 flex-shrink-0">
                                        <img
                                            src={item.product.images.find(img => img.isPrimary)?.imagePath || item.product.images[0]?.imagePath}
                                            alt={item.product.name}
                                            className="h-full w-full object-cover object-center"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/200x200?text=No+Image";
                                            }}
                                        />
                                    </div>

                                    <div className="flex-grow">
                                        <h3 className="text-sm text-gray-800 font-medium">{item.product.name}</h3>
                                        {item.variant && (
                                            <div className="text-xs text-gray-500">
                                                <span>{item.variant.size.name}, {item.variant.color.name}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm mt-1">
                                            <span>{formatPrice((item.product.salePrice || item.product.basePrice) + (item.variant?.additionalPrice || 0))} x {item.quantity}</span>
                                            <span className="font-semibold">
                                                {formatPrice(((item.product.salePrice || item.product.basePrice) + (item.variant?.additionalPrice || 0)) * item.quantity)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 pt-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tạm tính:</span>
                                <span>{formatPrice(calculateSubtotal())}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Phí vận chuyển:</span>
                                <span>{formatPrice(30000)}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-200 flex justify-between">
                                <span className="font-semibold">Tổng cộng:</span>
                                <span className="text-lg text-primary font-bold">{formatPrice(calculateSubtotal())}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
