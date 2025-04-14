import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';
import categoryAPI from '../../../services/categoryService';
import { useDebounce } from '../../../hooks/useDebounce';

interface Category {
    _id: string;
    name: string;
    slug: string;
    description: string;
    parent: string | null;
    image: string;
    createdAt: string;
    updatedAt: string;
    children?: Category[];
    productCount?: number;
}

const CategoriesPage = () => {
    const queryClient = useQueryClient();
    // State for filters and pagination
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Fetch categories
    const {
        data: categoriesResponse,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['categories', { includeProducts: true, includeChildren: true }],
        queryFn: () => categoryAPI.getCategories(true, true),
    });

    // Filter categories based on search
    const filteredCategories = categoriesResponse?.data?.filter((category: Category) =>
        category.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    ) || [];

    // Delete category mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoryAPI.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setIsDeleteModalOpen(false);
            setSelectedCategory(null);
            setAlertMessage({ type: 'success', message: 'Danh mục đã được xóa thành công' });

            // Auto-hide alert after 3 seconds
            setTimeout(() => setAlertMessage(null), 3000);
        },
        onError: (error: any) => {
            setAlertMessage({
                type: 'error',
                message: error.response?.data?.message || 'Không thể xóa danh mục. Vui lòng thử lại.'
            });
        }
    });

    const handleDeleteClick = (id: string) => {
        setSelectedCategory(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (selectedCategory) {
            deleteMutation.mutate(selectedCategory);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    if (isLoading) {
        return <div className="py-10 text-center"><LoadingSpinner size="large" /></div>;
    }

    if (isError) {
        return <AlertMessage type="error" message={(error as Error)?.message || 'Có lỗi xảy ra khi tải danh mục'} />;
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header section with title and add button */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Quản lý danh mục</h1>
                    <p className="text-sm text-gray-600 mt-1">Quản lý và cập nhật danh mục sản phẩm</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link
                        to="/admin/categories/create"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <svg
                            className="-ml-1 mr-2 h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Thêm danh mục
                    </Link>
                </div>
            </div>

            {/* Alert message */}
            {alertMessage && (
                <div className="mb-4">
                    <AlertMessage type={alertMessage.type} message={alertMessage.message} />
                </div>
            )}

            {/* Search box */}
            <div className="mb-5 bg-white rounded-lg shadow-sm p-4">
                <div className="max-w-md">
                    <label htmlFor="search" className="sr-only">Tìm kiếm</label>
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            id="search"
                            className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="Tìm kiếm danh mục theo tên..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Categories List */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Danh mục
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Số lượng sản phẩm
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Danh mục cha
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày tạo
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center">
                                        <p className="text-gray-500">Không tìm thấy danh mục nào</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map((category: Category) => (
                                    <tr key={category._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img
                                                        className="h-10 w-10 rounded-md object-cover"
                                                        src={category.image}
                                                        alt={category.name}
                                                        loading='lazy'
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = "https://via.placeholder.com/40x40?text=No+Image";
                                                        }}
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {category.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {category.slug}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {category.productCount !== undefined ? category.productCount : 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {category.parent ? "Có" : "Danh mục gốc"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(category.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                to={`/admin/categories/${category.slug}`}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                Xem
                                            </Link>
                                            <Link
                                                to={`/admin/categories/${category.slug}/edit`}
                                                className="text-primary hover:text-primary-dark mr-3"
                                            >
                                                Sửa
                                            </Link>
                                            <button
                                                className="text-red-600 hover:text-red-900"
                                                onClick={() => handleDeleteClick(category._id)}
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
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
                                                Bạn có chắc chắn muốn xóa danh mục này? Tất cả sản phẩm liên quan sẽ không còn thuộc danh mục này nữa. Hành động này không thể hoàn tác.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={confirmDelete}
                                    disabled={deleteMutation.isPending}
                                >
                                    {deleteMutation.isPending ? 'Đang xử lý...' : 'Xóa'}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setIsDeleteModalOpen(false)}
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

export default CategoriesPage;