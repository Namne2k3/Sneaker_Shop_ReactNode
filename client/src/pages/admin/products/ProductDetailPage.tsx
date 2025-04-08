import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import productAPI from '../../../services/productService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';

const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'variants' | 'images'>('info');

    // Fetch product details
    const {
        data: productResponse,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['product', id],
        queryFn: () => id ? productAPI.getProductById(id) : Promise.reject('No product ID provided'),
        enabled: !!id
    });

    // Soft delete mutation
    const deleteMutation = useMutation({
        mutationFn: (productId: string) => productAPI.softDeleteProduct(productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            navigate('/admin/products', {
                state: {
                    message: 'Sản phẩm đã được ẩn thành công',
                    type: 'success'
                }
            });
        }
    });

    const product = productResponse?.data;

    const handleSoftDelete = async () => {
        if (!id) return;
        deleteMutation.mutate(id);
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString('vi-VN') + '₫';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (isError || !product) {
        return (
            <AlertMessage
                type="error"
                message={(error as Error)?.message || 'Không thể tải thông tin sản phẩm'}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header with actions */}
            <div className="mb-6 flex flex-wrap justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">{product.name}</h1>
                    <p className="text-sm text-gray-600">ID: {product._id}</p>
                </div>
                <div className="flex space-x-2 mt-2 sm:mt-0">
                    <Link
                        to={`/admin/products/${id}/edit`}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Chỉnh sửa
                    </Link>
                    <button
                        onClick={() => setDeleteConfirm(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Ẩn sản phẩm
                    </button>
                    <Link
                        to="/admin/products"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Quay lại
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`py-4 px-6 font-medium text-sm ${activeTab === 'info'
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Thông tin sản phẩm
                        </button>
                        <button
                            onClick={() => setActiveTab('variants')}
                            className={`py-4 px-6 font-medium text-sm ${activeTab === 'variants'
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Biến thể ({product.variants?.length || 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('images')}
                            className={`py-4 px-6 font-medium text-sm ${activeTab === 'images'
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Hình ảnh ({product.images?.length || 0})
                        </button>
                    </nav>
                </div>

                {/* Tab content */}
                <div className="p-6">
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Thông tin cơ bản</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Tên sản phẩm</p>
                                        <p className="mt-1">{product.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Giá gốc</p>
                                        <p className="mt-1">{formatPrice(product.basePrice)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Giá khuyến mãi</p>
                                        <p className="mt-1">{product.salePrice > 0 ? formatPrice(product.salePrice) : 'Không có'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                                        <p className="mt-1">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {product.status === 'active' ? 'Đang bán' : 'Hết hàng'}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Sản phẩm nổi bật</p>
                                        <p className="mt-1">{product.featured ? 'Có' : 'Không'}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Phân loại</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Danh mục</p>
                                        <p className="mt-1">{product.category?.name || 'Không có'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Thương hiệu</p>
                                        <p className="mt-1">{product.brand?.name || 'Không có'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                                        <p className="mt-1">{formatDate(product.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Cập nhật lần cuối</p>
                                        <p className="mt-1">{formatDate(product.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <h3 className="text-lg font-semibold mb-4">Mô tả</h3>
                                <div className="prose max-w-full">
                                    <p className="mt-1 whitespace-pre-line">{product.description}</p>
                                </div>
                            </div>
                            {product.features && (
                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-semibold mb-4">Đặc điểm</h3>
                                    <div className="prose max-w-full">
                                        <ul className="list-disc pl-5">
                                            {product.features.split('\n').map((feature, index) => (
                                                <li key={index} className="mt-1">{feature}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'variants' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Biến thể sản phẩm</h3>
                                <Link
                                    to={`/admin/products/${id}/variants`}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
                                >
                                    Quản lý biến thể
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kích thước</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Màu sắc</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Chỉnh sửa</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {product.variants && product.variants.length > 0 ? (
                                            product.variants.map((variant: any) => (
                                                <tr key={variant._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{variant.sku}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{variant.size?.name} ({variant.size?.value})</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex items-center">
                                                            <div
                                                                className="h-4 w-4 rounded-full mr-2"
                                                                style={{ backgroundColor: variant.color?.code || '#ccc' }}
                                                            ></div>
                                                            {variant.color?.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{variant.stock}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatPrice(product.basePrice + (variant.additionalPrice || 0))}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${variant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {variant.status === 'active' ? 'Còn hàng' : 'Hết hàng'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link to={`/admin/products/${id}/variants/${variant._id}/edit`} className="text-primary hover:text-primary-dark">
                                                            Chỉnh sửa
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    Sản phẩm này chưa có biến thể nào.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'images' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Hình ảnh sản phẩm</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {product.images && product.images.length > 0 ? (
                                    product.images.map((image: any, index: number) => (
                                        <div key={image._id || index} className="relative group">
                                            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200">
                                                <img
                                                    src={image.imagePath}
                                                    alt={`${product.name} - Hình ${index + 1}`}
                                                    className="h-full w-full object-cover object-center"
                                                />
                                            </div>
                                            {image.isPrimary && (
                                                <div className="absolute top-0 left-0 bg-primary text-white text-xs font-bold px-2 py-1 rounded-br-md">
                                                    Ảnh chính
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-8 text-gray-500">
                                        Chưa có hình ảnh nào cho sản phẩm này
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Ẩn sản phẩm</h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Bạn có chắc chắn muốn ẩn sản phẩm này? Sản phẩm sẽ không hiển thị trên trang web, nhưng dữ liệu vẫn được lưu trữ và có thể khôi phục sau này.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={handleSoftDelete}
                                    disabled={deleteMutation.isPending}
                                >
                                    {deleteMutation.isPending ? 'Đang xử lý...' : 'Ẩn sản phẩm'}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setDeleteConfirm(false)}
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

export default ProductDetailPage;
