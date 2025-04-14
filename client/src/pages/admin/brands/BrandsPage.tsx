import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import brandAPI, { Brand } from '../../../services/brandService';
import { useDebounce } from '../../../hooks/useDebounce';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';

const BrandsPage = () => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState<string | null>(null);
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const debouncedSearch = useDebounce(search, 500);
    const queryClient = useQueryClient();

    // Fetch brands
    const { data: brandsResponse, isLoading, isError, error } = useQuery({
        queryKey: ['brands', debouncedSearch, statusFilter, sortOrder],
        queryFn: () => brandAPI.getBrands({
            search: debouncedSearch,
            status: statusFilter,
            sort: 'name',
            order: sortOrder
        }),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (brandId: string) => brandAPI.deleteBrand(brandId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
            setAlertMessage({ type: 'success', message: 'Thương hiệu đã được xóa thành công' });
            setTimeout(() => setAlertMessage(null), 3000);
        },
        onError: (error: { response: { data: { message: string } } }) => {
            setAlertMessage({
                type: 'error',
                message: error.response?.data?.message || 'Có lỗi xảy ra khi xóa thương hiệu'
            });
            setTimeout(() => setAlertMessage(null), 3000);
        }
    });

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value);
    };

    const handleSortOrderToggle = () => {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    };

    const openDeleteModal = (brandId: string) => {
        setBrandToDelete(brandId);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setBrandToDelete(null);
    };

    const confirmDelete = () => {
        if (brandToDelete) {
            deleteMutation.mutate(brandToDelete);
            closeDeleteModal();
        }
    };

    const brands = brandsResponse?.data || [];

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Quản lý thương hiệu</h1>
                    <p className="text-sm text-gray-600 mt-1">Quản lý các thương hiệu trong hệ thống</p>
                </div>
                <div className="mt-4 md:mt-0">
                    <Link
                        to="/admin/brands/create"
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
                        Thêm thương hiệu mới
                    </Link>
                </div>
            </div>

            {/* Alert Message */}
            {alertMessage && (
                <div className="mb-4">
                    <AlertMessage type={alertMessage.type} message={alertMessage.message} />
                </div>
            )}

            {/* Filters */}
            <div className="bg-white shadow-sm rounded-lg mb-6 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-grow">
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
                                className="focus:ring-primary focus:border-primary block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                                placeholder="Tìm kiếm theo tên thương hiệu"
                                value={search}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-48">
                        <label htmlFor="status" className="sr-only">Trạng thái</label>
                        <select
                            id="status"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                            value={statusFilter}
                            onChange={handleStatusFilterChange}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Không hoạt động</option>
                        </select>
                    </div>

                    <button
                        className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        onClick={handleSortOrderToggle}
                    >
                        <span>Sắp xếp</span>
                        {sortOrder === 'asc' ? (
                            <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                            </svg>
                        ) : (
                            <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 12a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 17.586V12z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Brands List */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-6 text-center">
                        <LoadingSpinner size="large" />
                    </div>
                ) : isError ? (
                    <div className="p-6">
                        <AlertMessage
                            type="error"
                            message={(error as Error)?.message || 'Không thể tải danh sách thương hiệu'}
                        />
                    </div>
                ) : brands.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-gray-500">Không tìm thấy thương hiệu nào</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Logo
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tên thương hiệu
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mô tả
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày tạo
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Thao tác</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {brands.map((brand: Brand) => (
                                    <tr key={brand._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                {brand.logo ? (
                                                    <img
                                                        className="h-10 w-10 rounded-full object-contain bg-gray-100"
                                                        src={brand.logo}
                                                        loading='lazy'
                                                        alt={brand.name}
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-500">
                                                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                                            <div className="text-xs text-gray-500">{brand.slug}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 line-clamp-2">
                                                {brand.description || 'Không có mô tả'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${brand.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {brand.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(brand.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                to={`/admin/brands/${brand.slug}`}
                                                className="text-primary hover:text-primary-dark mr-3"
                                            >
                                                Xem
                                            </Link>
                                            <Link
                                                to={`/admin/brands/${brand.slug}/edit`}
                                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                            >
                                                Sửa
                                            </Link>
                                            <button
                                                onClick={() => openDeleteModal(brand._id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
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
                                        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Xóa thương hiệu</h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                Bạn có chắc chắn muốn xóa thương hiệu này? Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
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
                                >
                                    {deleteMutation.isPending ? (
                                        <span className="flex items-center">
                                            <LoadingSpinner size="small" color="white" />
                                            <span className="ml-2">Đang xóa...</span>
                                        </span>
                                    ) : (
                                        'Xóa'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={closeDeleteModal}
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

export default BrandsPage;
