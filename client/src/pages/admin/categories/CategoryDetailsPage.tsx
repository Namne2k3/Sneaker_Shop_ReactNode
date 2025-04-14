import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';
import categoryAPI from '../../../services/categoryService';

interface Product {
    _id: string;
    name: string;
    slug: string;
    basePrice: number;
    salePrice: number;
    thumbnail: string;
    status: string;
}

interface Category {
    _id: string;
    name: string;
    slug: string;
    description: string;
    parent: {
        _id: string;
        name: string;
        slug: string;
    } | null;
    image: string;
    createdAt: string;
    updatedAt: string;
    children: Category[];
    products: Product[];
    productCount: number;
}

const CategoryDetailsPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'products' | 'subcategories'>('info');

    const {
        data: categoryResponse,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['category', slug],
        queryFn: () => slug ? categoryAPI.getCategoryBySlug(slug, true, true) : Promise.reject('No category slug provided'),
        enabled: !!slug
    });

    const category: Category = categoryResponse?.data;

    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoryAPI.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            navigate('/admin/categories', {
                state: {
                    message: 'Danh mục đã được xóa thành công',
                    type: 'success'
                }
            });
        }
    });

    const handleDelete = () => {
        if (category) {
            deleteMutation.mutate(category._id);
        }
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

    const formatPrice = (price: number) => {
        return price.toLocaleString('vi-VN') + '₫';
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (isError || !category) {
        return (
            <AlertMessage
                type="error"
                message={(error as Error)?.message || 'Không thể tải thông tin danh mục'}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header with actions */}
            <div className="mb-6 flex flex-wrap justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">{category.name}</h1>
                    <p className="text-sm text-gray-600">ID: {category._id}</p>
                </div>
                <div className="flex space-x-2 mt-2 sm:mt-0">
                    <Link
                        to={`/admin/categories/${slug}/edit`}
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
                        Xóa danh mục
                    </button>
                    <Link
                        to="/admin/categories"
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
                            Thông tin danh mục
                        </button>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`py-4 px-6 font-medium text-sm ${activeTab === 'products'
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Sản phẩm ({category?.products?.length || 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('subcategories')}
                            className={`py-4 px-6 font-medium text-sm ${activeTab === 'subcategories'
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Danh mục con ({category.children?.length || 0})
                        </button>
                    </nav>
                </div>

                {/* Tab content */}
                <div className="p-6">
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 mb-4">
                                    <img
                                        src={category.image}
                                        alt={category.name}
                                        loading='lazy'
                                        className="h-full w-full object-cover object-center"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "https://via.placeholder.com/300x300?text=No+Image";
                                        }}
                                    />
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-2">Thông tin tóm tắt</h3>
                                    <div className="space-y-2">
                                        <p><span className="font-medium">Số sản phẩm: </span>{category.productCount || 0}</p>
                                        <p><span className="font-medium">Số danh mục con: </span>{category.children?.length || 0}</p>
                                        <p><span className="font-medium">Ngày tạo: </span>{formatDate(category.createdAt)}</p>
                                        <p><span className="font-medium">Cập nhật cuối: </span>{formatDate(category.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin chi tiết</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Tên danh mục</h4>
                                            <p className="mt-1 text-sm text-gray-900">{category.name}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Slug</h4>
                                            <p className="mt-1 text-sm text-gray-900">{category.slug}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Danh mục cha</h4>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {category.parent ? (
                                                    <Link to={`/admin/categories/${category.parent.slug}`} className="text-primary hover:underline">
                                                        {category.parent.name}
                                                    </Link>
                                                ) : (
                                                    <span className="text-gray-500">Không có danh mục cha</span>
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Mô tả</h4>
                                            <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                                                {category.description || <span className="text-gray-500 italic">Không có mô tả</span>}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Sản phẩm thuộc danh mục</h3>
                                <Link
                                    to="/admin/products/create"
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
                                >
                                    <svg className="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Thêm sản phẩm mới
                                </Link>
                            </div>

                            {category.products && category.products.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {category.products.map(product => (
                                                <tr key={product._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <img
                                                                    loading='lazy'
                                                                    className="h-10 w-10 rounded-md object-cover"
                                                                    src={product.images?.find(img => img.isPrimary == true).imagePath || "https://via.placeholder.com/100"}
                                                                    alt={product.name}
                                                                />
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                                <div className="text-sm text-gray-500">{product.slug}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {formatPrice(product.basePrice)}
                                                        </div>
                                                        {product.salePrice > 0 && (
                                                            <div className="text-xs text-red-500">
                                                                {formatPrice(product.salePrice)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                            ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                                        >
                                                            {product.status === 'active' ? 'Đang bán' : 'Hết hàng'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link
                                                            to={`/admin/products/${product._id}`}
                                                            className="text-primary hover:text-primary-dark mr-3"
                                                        >
                                                            Xem chi tiết
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có sản phẩm nào</h3>
                                    <p className="mt-1 text-sm text-gray-500">Danh mục này chưa có sản phẩm nào.</p>
                                    <div className="mt-6">
                                        <Link
                                            to="/admin/products/create"
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                        >
                                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                            Thêm sản phẩm mới
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'subcategories' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Danh mục con</h3>
                                <Link
                                    to="/admin/categories/create"
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark"
                                >
                                    <svg className="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Thêm danh mục con
                                </Link>
                            </div>

                            {category.children && category.children.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {category.children.map((child) => (
                                        <div key={child._id} className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                                            <div className="h-32 w-full overflow-hidden">
                                                <img
                                                    src={child.image || "https://via.placeholder.com/300x150?text=No+Image"}
                                                    alt={child.name}
                                                    loading='lazy'
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = "https://via.placeholder.com/300x150?text=No+Image";
                                                    }}
                                                />
                                            </div>
                                            <div className="p-4">
                                                <h4 className="text-lg font-medium text-gray-900 mb-2">{child.name}</h4>
                                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{child.description || "Không có mô tả"}</p>
                                                <div className="flex justify-end">
                                                    <Link
                                                        to={`/admin/categories/${child.slug}`}
                                                        className="text-primary hover:text-primary-dark text-sm font-medium"
                                                    >
                                                        Xem chi tiết →
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có danh mục con</h3>
                                    <p className="mt-1 text-sm text-gray-500">Danh mục này chưa có danh mục con nào.</p>
                                    <div className="mt-6">
                                        <Link
                                            to="/admin/categories/create"
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                        >
                                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                            Thêm danh mục con
                                        </Link>
                                    </div>
                                </div>
                            )}
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
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Xóa danh mục</h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác.
                                                {category.productCount > 0 && (
                                                    <span className="block mt-2 font-semibold">
                                                        Cảnh báo: Danh mục này có {category.productCount} sản phẩm liên kết.
                                                    </span>
                                                )}
                                                {category.children?.length > 0 && (
                                                    <span className="block mt-2 font-semibold">
                                                        Cảnh báo: Danh mục này có {category.children.length} danh mục con.
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending}
                                >
                                    {deleteMutation.isPending ? 'Đang xử lý...' : 'Xóa'}
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

export default CategoryDetailsPage;