import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { format } from 'date-fns';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi'; // Thêm react-icons
import api from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';
import { formatPrice } from '../../../utils';

interface Coupon {
    _id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minOrderAmount: number;
    maxUsage: number;
    usageCount: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    isValid: boolean;
    createdAt: string;
    updatedAt: string;
}

interface CouponsResponse {
    data: Coupon[];
    meta: {
        page: number;
        limit: number;
        totalPages: number;
        totalCoupons: number;
    };
}

const CouponsPage = () => {
    const queryClient = useQueryClient();

    // State for filters and pagination
    const [searchCode, setSearchCode] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Fetch coupons
    const { data, isLoading, isError } = useQuery({
        queryKey: ['coupons', page, limit, status, searchCode, sortBy, sortOrder],
        queryFn: async () => {
            const params = {
                page,
                limit,
                sort: sortBy,
                order: sortOrder,
                ...(status && { isActive: status === 'active' ? true : false }),
                ...(searchCode && { code: searchCode })
            };

            const response = await api.get<CouponsResponse>('/coupons', { params });
            return response.data;
        },
    });

    // Delete coupon mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/coupons/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            setIsDeleteModalOpen(false);
            setCouponToDelete(null);
            setAlertMessage({ type: 'success', message: 'Xóa mã giảm giá thành công!' });
            setTimeout(() => setAlertMessage(null), 3000);
        },
        onError: (error: any) => {
            setAlertMessage({
                type: 'error',
                message: error.response?.data?.message || 'Có lỗi xảy ra khi xóa mã giảm giá.'
            });
            setTimeout(() => setAlertMessage(null), 3000);
        }
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // Reset to first page when searching
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatus(e.target.value);
        setPage(1);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        // console.log(e.target.value)
        const [newSortBy, newSortOrder] = e.target.value.split('-');
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const openDeleteModal = (coupon: Coupon) => {
        setCouponToDelete(coupon);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (couponToDelete) {
            deleteMutation.mutate(couponToDelete._id);
        }
    };

    const coupons = data?.data || [];
    const totalPages = data?.meta?.totalPages || 0;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };
    return (
        <div className="p-4">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Quản lý mã giảm giá</h1>
                <p className="text-gray-600">Quản lý và tạo mã giảm giá cho cửa hàng</p>
            </div>

            {/* Alert message */}
            {alertMessage && (
                <div className="mb-4">
                    <AlertMessage type={alertMessage.type} message={alertMessage.message} />
                </div>
            )}

            {/* Action buttons */}
            <div className="mb-6">
                <Link
                    to="/admin/coupons/create"
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
                    style={{ width: "fit-content" }}
                >
                    <FiPlus className="mr-2" />
                    Thêm mã giảm giá mới
                </Link>
            </div>

            {/* Filter and sort controls */}
            <div className="bg-white p-4 rounded shadow mb-6">
                <form onSubmit={handleSearchSubmit}>
                    <div className="flex gap-4 items-center">
                        <div className='flex-grow'>
                            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                                Tìm kiếm mã giảm giá
                            </label>
                            <div className="flex items-center rounded mt-2">
                                <input
                                    type="text"
                                    id="search"
                                    className="p-2 w-full focus:ring-0"
                                    placeholder="Tìm kiếm theo mã giảm giá"
                                    value={searchCode}
                                    onChange={(e) => setSearchCode(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                Lọc theo trạng thái
                            </label>
                            <select
                                id="status-filter"
                                value={status}
                                onChange={handleStatusChange}
                                className="w-full border rounded p-2"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="active">Đang kích hoạt</option>
                                <option value="inactive">Không kích hoạt</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">
                                Sắp xếp
                            </label>
                            <select
                                id="sort-order"
                                value={`${sortBy}-${sortOrder}`}
                                onChange={handleSortChange}
                                className="w-full border rounded p-2"
                            >
                                <option value="createdAt-desc">Mới nhất trước</option>
                                <option value="createdAt-asc">Cũ nhất trước</option>
                                <option value="code-asc">Mã giảm giá (A-Z)</option>
                                <option value="code-desc">Mã giảm giá (Z-A)</option>
                                <option value="value-desc">Giá trị cao đến thấp</option>
                                <option value="value-asc">Giá trị thấp đến cao</option>
                                <option value="endDate-asc">Sắp hết hạn trước</option>
                            </select>
                        </div>
                    </div>
                </form>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="flex justify-center items-center p-8">
                    <LoadingSpinner size="large" />
                </div>
            )}

            {/* Error state */}
            {isError && (
                <div className="p-4">
                    <AlertMessage type="error" message="Đã xảy ra lỗi khi tải dữ liệu mã giảm giá." />
                </div>
            )}

            {/* No coupons found */}
            {!isLoading && !isError && coupons.length === 0 && (
                <div className="bg-white p-6 rounded shadow text-center">
                    <div className="flex justify-center mb-4">
                        <FiSearch className="text-gray-400 text-5xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Không tìm thấy mã giảm giá</h3>
                    <p className="mt-1 text-gray-500">
                        Bắt đầu tạo mã giảm giá mới cho khách hàng của bạn.
                    </p>
                    <div className="mt-6">
                        <Link
                            to="/admin/coupons/create"
                            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 mx-auto"
                            style={{ width: "fit-content" }}
                        >
                            <FiPlus className="mr-2" />
                            Thêm mã giảm giá mới
                        </Link>
                    </div>
                </div>
            )}

            {/* Coupons table */}
            {!isLoading && !isError && coupons.length > 0 && (
                <div className="bg-white rounded shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-3 px-6 text-left font-medium text-gray-600">Mã giảm giá</th>
                                    <th className="py-3 px-6 text-left font-medium text-gray-600">Loại & Giá trị</th>
                                    <th className="py-3 px-6 text-left font-medium text-gray-600">Đơn hàng tối thiểu</th>
                                    <th className="py-3 px-6 text-left font-medium text-gray-600">Thời hạn</th>
                                    <th className="py-3 px-6 text-left font-medium text-gray-600">Sử dụng</th>
                                    <th className="py-3 px-6 text-left font-medium text-gray-600">Trạng thái</th>
                                    <th className="py-3 px-6 text-center font-medium text-gray-600">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((coupon, index) => (
                                    <tr
                                        key={coupon._id}
                                        className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}
                                    >
                                        <td className="py-4 px-6 border-t border-gray-200">
                                            <div className="font-semibold text-gray-800">{coupon.code}</div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                {formatDate(coupon.createdAt)}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 border-t border-gray-200">
                                            {coupon.type === 'percentage' ? (
                                                <div className="flex items-center">
                                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                                                        Phần trăm
                                                    </span>
                                                    <span className="font-medium">{coupon.value}%</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center">
                                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2">
                                                        Tiền mặt
                                                    </span>
                                                    <span className="font-medium">{formatPrice(coupon.value)}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 border-t border-gray-200">
                                            <div className="text-sm text-gray-800">
                                                {coupon.minOrderAmount > 0
                                                    ? <span className="font-medium">{formatPrice(coupon.minOrderAmount)}</span>
                                                    : <span className="text-gray-500">Không giới hạn</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 border-t border-gray-200">
                                            <div className="text-sm">
                                                <div className="flex items-center mb-1">
                                                    <span className="w-16 text-gray-500">Từ:</span>
                                                    <span>{formatDate(coupon.startDate)}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-16 text-gray-500">Đến:</span>
                                                    <span>{formatDate(coupon.endDate)}</span>
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                {coupon.isValid ? (
                                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                        Còn hiệu lực
                                                    </span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                                        Hết hiệu lực
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 border-t border-gray-200">
                                            <div className="flex items-center">
                                                <span className="font-medium text-gray-800">{coupon.usageCount}</span>
                                                <span className="mx-1 text-gray-400">/</span>
                                                <span>{coupon.maxUsage > 0 ? coupon.maxUsage : '∞'}</span>
                                            </div>
                                            {coupon.maxUsage > 0 && (
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                                    <div
                                                        className="bg-blue-600 h-1.5 rounded-full"
                                                        style={{ width: `${(coupon.usageCount / coupon.maxUsage) * 100}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 border-t border-gray-200">
                                            {coupon.isActive ? (
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                    Kích hoạt
                                                </span>
                                            ) : (
                                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                                    Chưa kích hoạt
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 border-t border-gray-200">
                                            <div className="flex justify-center space-x-3">
                                                <Link
                                                    to={`/admin/coupons/edit/${coupon._id}`}
                                                    className="text-blue-600 hover:text-blue-800 flex items-center"
                                                >
                                                    <FiEdit className="mr-1" />
                                                    <span>Sửa</span>
                                                </Link>
                                                <button
                                                    onClick={() => openDeleteModal(coupon)}
                                                    className="text-red-600 hover:text-red-800 flex items-center"
                                                >
                                                    <FiTrash2 className="mr-1" />
                                                    <span>Xóa</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Trang <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span>
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className={`px-4 py-2 rounded ${page === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'}`}
                                >
                                    Trước
                                </button>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className={`px-4 py-2 rounded ${page === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'}`}
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded shadow-lg max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-start">
                                <div className="mr-4">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                        <FiTrash2 className="h-6 w-6 text-red-600" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Xóa mã giảm giá
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            Bạn có chắc chắn muốn xóa mã giảm giá <span className="font-semibold">{couponToDelete?.code}</span>? Hành động này không thể hoàn tác.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 flex justify-end space-x-3">
                            <button
                                type="button"
                                className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                                onClick={() => setIsDeleteModalOpen(false)}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                                onClick={confirmDelete}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? (
                                    <div className="flex items-center">
                                        <LoadingSpinner size="small" color="white" />
                                        <span className="ml-2">Đang xóa...</span>
                                    </div>
                                ) : (
                                    'Xóa'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CouponsPage;