import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userAPI from '../../../services/userAPI';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';

interface User {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    role: 'user' | 'admin';
    isActive: boolean;
    createdAt: string;
}

const UsersPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statusAction, setStatusAction] = useState<'activate' | 'deactivate'>('deactivate');
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const queryClient = useQueryClient();

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset page when search query changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearchQuery]);

    // Fetch users query
    const {
        data: usersResponse,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['users', { page, limit, search: debouncedSearchQuery }],
        queryFn: () => userAPI.getUsers({ page, limit, search: debouncedSearchQuery }),
    });

    // Change user status mutation
    const statusMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) =>
            userAPI.changeUserStatus(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsStatusModalOpen(false);
            setSelectedUser(null);
            setAlertMessage({
                type: 'success',
                message: statusAction === 'activate'
                    ? 'Người dùng đã được kích hoạt thành công'
                    : 'Người dùng đã bị vô hiệu hóa thành công'
            });

            // Auto-hide alert after 3 seconds
            setTimeout(() => setAlertMessage(null), 3000);
        },
        onError: (error: any) => {
            setAlertMessage({
                type: 'error',
                message: error.response?.data?.message || 'Không thể thực hiện thao tác này. Vui lòng thử lại.'
            });
        }
    });

    // Handle status change click
    const handleStatusClick = (user: User) => {
        setSelectedUser(user._id);
        setStatusAction(user.isActive ? 'deactivate' : 'activate');
        setIsStatusModalOpen(true);
    };

    // Confirm status change
    const confirmStatusChange = () => {
        if (selectedUser) {
            statusMutation.mutate({
                id: selectedUser,
                isActive: statusAction === 'activate'
            });
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // Get role display text
    const getRoleDisplay = (role: string) => {
        return role === 'admin' ? 'Quản trị viên' : 'Người dùng';
    };

    if (isLoading) {
        return <div className="py-10 text-center"><LoadingSpinner size="large" /></div>;
    }

    if (isError) {
        return <AlertMessage type="error" message={(error as Error)?.message || 'Có lỗi xảy ra khi tải người dùng'} />;
    }

    const users = usersResponse?.data || [];
    const pagination = usersResponse?.pagination || { page: 1, totalPages: 1 };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header section with title and add button */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Quản lý người dùng</h1>
                    <p className="text-sm text-gray-600 mt-1">Quản lý và cập nhật tài khoản người dùng</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link
                        to="/admin/users/create"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <svg
                            className="-ml-1 mr-2 h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Thêm người dùng
                    </Link>
                </div>
            </div>

            {/* Show alert message if exists */}
            {alertMessage && (
                <div className="mb-4">
                    <AlertMessage type={alertMessage.type} message={alertMessage.message} />
                </div>
            )}

            {/* Search and filter section */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="w-full md:w-1/3">
                        <label htmlFor="search" className="sr-only">Tìm kiếm</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                name="search"
                                id="search"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="Tìm theo tên, email hoặc số điện thoại"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Người dùng
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vai trò
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày đăng ký
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                        Không tìm thấy người dùng nào
                                    </td>
                                </tr>
                            ) : (
                                users.map((user: User) => (
                                    <tr key={user._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.fullName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {user.email}
                                                    </div>
                                                    {user.phone && (
                                                        <div className="text-xs text-gray-500">
                                                            {user.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {getRoleDisplay(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(user.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                to={`/admin/users/${user._id}`}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                Xem
                                            </Link>
                                            <button
                                                className={`${user.isActive
                                                        ? 'text-red-600 hover:text-red-900'
                                                        : 'text-green-600 hover:text-green-900'
                                                    }`}
                                                onClick={() => handleStatusClick(user)}
                                            >
                                                {user.isActive ? 'Khóa' : 'Kích hoạt'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-sm">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setPage(Math.max(page - 1, 1))}
                            disabled={page === 1}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            Trước
                        </button>
                        <button
                            onClick={() => setPage(Math.min(page + 1, pagination.totalPages))}
                            disabled={page === pagination.totalPages}
                            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            Sau
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Hiển thị <span className="font-medium">{(page - 1) * limit + 1}</span> đến <span className="font-medium">
                                    {Math.min(page * limit, pagination.totalUsers || 0)}
                                </span> trong <span className="font-medium">{pagination.totalUsers || 0}</span> kết quả
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setPage(1)}
                                    disabled={page === 1}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    <span className="sr-only">Đầu tiên</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setPage(Math.max(page - 1, 1))}
                                    disabled={page === 1}
                                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    <span className="sr-only">Trước</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>

                                {[...Array(pagination.totalPages)].map((_, i) => {
                                    // Show 5 pages around current page
                                    if (
                                        i + 1 === 1 ||
                                        i + 1 === pagination.totalPages ||
                                        (i + 1 >= page - 2 && i + 1 <= page + 2)
                                    ) {
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setPage(i + 1)}
                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === i + 1
                                                        ? 'z-10 bg-primary border-primary text-white'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        );
                                    } else if (
                                        (i + 1 === page - 3 && page > 4) ||
                                        (i + 1 === page + 3 && page < pagination.totalPages - 3)
                                    ) {
                                        return (
                                            <span
                                                key={i}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                            >
                                                ...
                                            </span>
                                        );
                                    }
                                    return null;
                                })}

                                <button
                                    onClick={() => setPage(Math.min(page + 1, pagination.totalPages))}
                                    disabled={page === pagination.totalPages}
                                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    <span className="sr-only">Sau</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setPage(pagination.totalPages)}
                                    disabled={page === pagination.totalPages}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    <span className="sr-only">Cuối cùng</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Change Confirmation Modal */}
            {isStatusModalOpen && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${statusAction === 'deactivate' ? 'bg-red-100' : 'bg-green-100'
                                        } sm:mx-0 sm:h-10 sm:w-10`}>
                                        <svg
                                            className={`h-6 w-6 ${statusAction === 'deactivate' ? 'text-red-600' : 'text-green-600'}`}
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d={
                                                    statusAction === 'deactivate'
                                                        ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                        : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                }
                                            />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            {statusAction === 'deactivate' ? 'Khóa tài khoản người dùng' : 'Kích hoạt tài khoản người dùng'}
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                {statusAction === 'deactivate'
                                                    ? 'Bạn có chắc chắn muốn khóa tài khoản người dùng này? Người dùng sẽ không thể đăng nhập vào hệ thống khi bị khóa.'
                                                    : 'Bạn có chắc chắn muốn kích hoạt tài khoản người dùng này? Người dùng sẽ có thể đăng nhập vào hệ thống sau khi được kích hoạt.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${statusAction === 'deactivate'
                                            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                                        } text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
                                    onClick={confirmStatusChange}
                                    disabled={statusMutation.isPending}
                                >
                                    {statusMutation.isPending ? (
                                        <>
                                            <LoadingSpinner size="small" color="white" />
                                            <span className="ml-2">Đang xử lý...</span>
                                        </>
                                    ) : (
                                        statusAction === 'deactivate' ? 'Khóa tài khoản' : 'Kích hoạt'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setIsStatusModalOpen(false)}
                                    disabled={statusMutation.isPending}
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

export default UsersPage;
