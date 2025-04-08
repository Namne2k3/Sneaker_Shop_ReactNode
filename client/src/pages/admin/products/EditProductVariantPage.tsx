import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import productAPI from '../../../services/productService';
import sizeAPI from '../../../services/sizeService';
import colorAPI from '../../../services/colorService';
import AlertMessage from '../../../components/common/AlertMessage';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const EditProductVariantPage: React.FC = () => {
    const { id, variantId } = useParams<{ id: string, variantId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        sku: '',
        size: '',
        color: '',
        stock: 0,
        additionalPrice: 0,
        status: 'active',
    });

    // Fetch product data
    const {
        data: productResponse,
        isLoading: isLoadingProduct
    } = useQuery({
        queryKey: ['product', id],
        queryFn: () => id ? productAPI.getProductById(id) : Promise.reject('No product ID provided'),
        enabled: !!id
    });

    // Fetch variant data
    const {
        data: variantResponse,
        isLoading: isLoadingVariant,
        isError: isVariantError,
        error: variantError
    } = useQuery({
        queryKey: ['productVariant', variantId],
        queryFn: () => variantId ? productAPI.getProductVariantById(variantId) : Promise.reject('No variant ID provided'),
        enabled: !!variantId
    });

    // Fetch sizes
    const {
        data: sizesResponse,
        isLoading: isLoadingSizes
    } = useQuery({
        queryKey: ['sizes'],
        queryFn: () => sizeAPI.getSizes(),
    });

    // Fetch colors
    const {
        data: colorsResponse,
        isLoading: isLoadingColors
    } = useQuery({
        queryKey: ['colors'],
        queryFn: () => colorAPI.getColors(),
    });

    // Update variant mutation
    const updateMutation = useMutation({
        mutationFn: (data: any) => productAPI.updateProductVariant(variantId || '', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['productVariant', variantId] });
            queryClient.invalidateQueries({ queryKey: ['product', id] });
            navigate(`/admin/products/${id}`);
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật biến thể sản phẩm');
        }
    });

    // Initialize form data when variant is loaded
    useEffect(() => {
        if (variantResponse?.data) {
            const variant = variantResponse.data;
            setFormData({
                sku: variant.sku || '',
                size: variant.size?._id || '',
                color: variant.color?._id || '',
                stock: variant.stock || 0,
                additionalPrice: variant.additionalPrice || 0,
                status: variant.status || 'active',
            });
        }
    }, [variantResponse]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate form
        if (!formData.sku || !formData.size || !formData.color) {
            setError('Vui lòng điền đầy đủ thông tin biến thể');
            return;
        }

        try {
            // Only send the fields that need to be updated
            const updateData = {
                sku: formData.sku,
                stock: formData.stock,
                additionalPrice: formData.additionalPrice,
                status: formData.status,
            };

            // Submit the update
            updateMutation.mutate(updateData);
        } catch (err: any) {
            console.error("Error updating variant:", err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật biến thể sản phẩm');
        }
    };

    const product = productResponse?.data;
    const sizes = sizesResponse?.data || [];
    const colors = colorsResponse?.data || [];

    const isSubmitting = updateMutation.isPending;
    const isLoading = isLoadingProduct || isLoadingVariant || isLoadingSizes || isLoadingColors;

    if (isLoading) {
        return <div className="py-10 text-center"><LoadingSpinner size="large" /></div>;
    }

    if (isVariantError) {
        return <AlertMessage type="error" message={(variantError as Error)?.message || 'Không thể tải thông tin biến thể sản phẩm'} />;
    }

    // Get the size and color objects for display
    const selectedSize = sizes.find(s => s._id === formData.size);
    const selectedColor = colors.find(c => c._id === formData.color);

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Chỉnh sửa biến thể sản phẩm</h1>
                <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">{product?.name}</span> - {selectedSize?.name} ({selectedSize?.value}) - {selectedColor?.name}
                </p>
            </div>

            {error && <AlertMessage type="error" message={error} />}

            <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Thông tin biến thể</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                                    SKU <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="sku"
                                    id="sku"
                                    required
                                    className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                    placeholder="SKU"
                                    value={formData.sku}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                    Trạng thái
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="active">Còn hàng</option>
                                    <option value="out_of_stock">Hết hàng</option>
                                    <option value="inactive">Ngừng kinh doanh</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                                    Tồn kho <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    id="stock"
                                    required
                                    min="0"
                                    className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                    placeholder="0"
                                    value={formData.stock}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="additionalPrice" className="block text-sm font-medium text-gray-700 mb-1">
                                    Giá tăng thêm
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="additionalPrice"
                                        id="additionalPrice"
                                        min="0"
                                        className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                        placeholder="0"
                                        value={formData.additionalPrice}
                                        onChange={handleInputChange}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">₫</span>
                                    </div>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Giá bán = Giá gốc ({product?.basePrice.toLocaleString('vi-VN')}₫) + Giá tăng thêm = {(product?.basePrice + formData.additionalPrice).toLocaleString('vi-VN')}₫
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                                    Kích thước
                                </label>
                                <select
                                    id="size"
                                    name="size"
                                    disabled
                                    className="w-full px-4 py-2.5 rounded-md border-gray-300 bg-gray-100 shadow-sm"
                                    value={formData.size}
                                >
                                    {sizes.map(size => (
                                        <option key={size._id} value={size._id}>
                                            {size.name} ({size.value})
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">Không thể thay đổi kích thước</p>
                            </div>

                            <div>
                                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                                    Màu sắc
                                </label>
                                <select
                                    id="color"
                                    name="color"
                                    disabled
                                    className="w-full px-4 py-2.5 rounded-md border-gray-300 bg-gray-100 shadow-sm"
                                    value={formData.color}
                                >
                                    {colors.map(color => (
                                        <option key={color._id} value={color._id}>
                                            {color.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">Không thể thay đổi màu sắc</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="border-t border-gray-200 p-6">
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                className="bg-white py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                onClick={() => navigate(`/admin/products/${id}`)}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="inline-flex justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center">
                                        <LoadingSpinner size="small" color="white" />
                                        <span className="ml-2">Đang cập nhật...</span>
                                    </span>
                                ) : (
                                    'Cập nhật biến thể'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProductVariantPage;
