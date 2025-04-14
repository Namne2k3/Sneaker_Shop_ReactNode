import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import brandAPI from '../../../services/brandService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';

const BrandDetailPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Check for success message from navigation state
    useEffect(() => {
        if (location.state?.message) {
            setAlertMessage({
                type: location.state.type || 'success',
                message: location.state.message
            });

            // Clear the message after 3 seconds
            const timer = setTimeout(() => {
                setAlertMessage(null);
                navigate(location.pathname, { replace: true, state: {} });
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [location, navigate]);

    // Fetch brand with product count
    const {
        data: brandResponse,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['brand', slug, true],
        queryFn: () => slug ? brandAPI.getBrandBySlug(slug, true) : Promise.reject('No slug provided'),
        enabled: !!slug
    });

    const brand = brandResponse?.data;
    const products = brand?.products || [];
    const productCount = brand?.productCount || 0;

    if (isLoading) {
        return <div className="py-10 text-center"><LoadingSpinner size="large" /></div>;
    }

    if (isError) {
        return <AlertMessage type="error" message={(error as Error)?.message || 'Không thể tải thông tin thương hiệu'} />;
    }

    if (!brand) {
        return <AlertMessage type="error" message="Không tìm thấy thông tin thương hiệu" />;
    }

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Alert Message */}
            {alertMessage && (
                <div className="mb-6">
                    <AlertMessage type={alertMessage.type} message={alertMessage.message} />
                </div>
            )}

            {/* Header with actions */}
            <div className="flex flex-wrap items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">{brand.name}</h1>
                    <p className="text-sm text-gray-600 mt-1">Chi tiết thương hiệu</p>
                </div>

                <div className="flex space-x-3 mt-4 sm:mt-0">
                    <Link
                        to={`/admin/brands/${slug}/edit`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Chỉnh sửa
                    </Link>

                    <Link
                        to="/admin/brands"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Quay lại
                    </Link>
                </div>
            </div>

            {/* Brand Information Card */}
            <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Thông tin thương hiệu</h2>
                </div>

                <div className="p-6">
                    <div className="flex flex-col md:flex-row">
                        {/* Logo column */}
                        <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-6">
                            <div className="w-40 h-40 rounded-lg border overflow-hidden bg-gray-50 flex items-center justify-center">
                                {brand.logo ? (
                                    <img
                                        src={brand.logo}
                                        alt={`Logo ${brand.name}`}
                                        loading='lazy'
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-gray-400 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details column */}
                        <div className="flex-grow">
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Tên thương hiệu</dt>
                                    <dd className="mt-1 text-base text-gray-900">{brand.name}</dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Slug</dt>
                                    <dd className="mt-1 text-base text-gray-900 font-mono">{brand.slug}</dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
                                    <dd className="mt-1">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${brand.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {brand.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                                        </span>
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">ID</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-mono">{brand._id}</dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Ngày tạo</dt>
                                    <dd className="mt-1 text-base text-gray-900">
                                        {new Date(brand.createdAt).toLocaleDateString('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Cập nhật lần cuối</dt>
                                    <dd className="mt-1 text-base text-gray-900">
                                        {new Date(brand.updatedAt).toLocaleDateString('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </dd>
                                </div>

                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Mô tả</dt>
                                    <dd className="mt-1 text-base text-gray-900">{brand.description || 'Không có mô tả'}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">
                        Sản phẩm thuộc thương hiệu ({productCount})
                    </h2>

                    <Link
                        to={`/admin/products?brand=${brand._id}`}
                        className="text-sm text-primary hover:text-primary-dark"
                    >
                        Xem tất cả
                    </Link>
                </div>

                <div className="p-6">
                    {products.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-gray-500">Không có sản phẩm nào thuộc thương hiệu này</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((product: any) => (
                                <div key={product._id} className="border rounded-md overflow-hidden">
                                    <div className="h-48 bg-gray-200">
                                        <img
                                            src={product.thumbnail || 'https://via.placeholder.com/300x150?text=No+Image'}
                                            alt={product.name}
                                            loading='lazy'
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                                        <p className="mt-1 text-sm text-gray-500 truncate">{product.slug}</p>
                                        <div className="mt-2 flex justify-between items-center">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.basePrice)}
                                            </p>
                                            <Link
                                                to={`/admin/products/${product._id}`}
                                                className="text-xs text-primary hover:text-primary-dark"
                                            >
                                                Xem chi tiết
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrandDetailPage;
