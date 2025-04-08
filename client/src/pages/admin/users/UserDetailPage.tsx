import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
    avatar?: string;
    address?: string;
    createdAt: string;
    updatedAt: string;
}

const UserDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const {
        data: userResponse,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['user', id],
        queryFn: () => userAPI.getUserById(id as string),
        enabled: !!id,
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) =>
            userAPI.changeUserStatus(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', id] });
            setIsStatusModalOpen(false);
            setAlertMessage({
                type: 'success',
                message: userResponse?.data.isActive
                    ? 'Tài khoản đã được vô hiệu hóa thành công'
                    : 'Tài khoản đã được kích hoạt thành công'
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

    const handleStatusChange = () => {
        setIsStatusModalOpen(true);
    };

    const confirmStatusChange = () => {
        if (id) {
            statusMutation.mutate({
                id: id,
                isActive: !userResponse?.data.isActive
            });
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return <div className="py-10 text-center"><LoadingSpinner size="large" /></div>;
    }

    if (isError || !userResponse?.data) {
        return <AlertMessage type="error" message={(error as Error)?.message || 'Có lỗi xảy ra khi tải thông tin người dùng'} />;
    }

    const user: User = userResponse.data;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header section with title and actions */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Thông tin người dùng</h1>
                    <p className="text-sm text-gray-600 mt-1">Chi tiết thông tin tài khoản</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                    <Link
                        to="/admin/users"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <svg
                            className="-ml-1 mr-2 h-5 w-5 text-gray-500"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Quay lại
                    </Link>
                    <button
                        onClick={handleStatusChange}
                        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${user.isActive
                            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    >
                        {user.isActive ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                    </button>
                </div>
            </div>

            {/* Show alert message if exists */}
            {alertMessage && (
                <div className="mb-4">
                    <AlertMessage type={alertMessage.type} message={alertMessage.message} />
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Thông tin tài khoản
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            Thông tin chi tiết về người dùng và tài khoản của họ.
                        </p>
                    </div>
                    <div>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                    </div>
                </div>
                <div className="border-t border-gray-200">
                    <dl>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                                Họ và tên
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {user.fullName}
                            </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                                Email
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {user.email}
                            </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                                Số điện thoại
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {user.phone || 'Chưa cung cấp'}
                            </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                                Vai trò
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                                </span>
                            </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                                Địa chỉ
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {user.address || 'Chưa cung cấp'}
                            </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                                Ngày đăng ký
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {formatDate(user.createdAt)}
                            </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">
                                Cập nhật gần đây
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {formatDate(user.updatedAt)}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

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
                                    <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${user.isActive ? 'bg-red-100' : 'bg-green-100'
                                        } sm:mx-0 sm:h-10 sm:w-10`}>
                                        <svg
                                            className={`h-6 w-6 ${user.isActive ? 'text-red-600' : 'text-green-600'}`}
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
                                                    user.isActive
                                                        ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                        : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                }
                                            />
                                        </svg>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            {user.isActive ? 'Khóa tài khoản người dùng' : 'Kích hoạt tài khoản người dùng'}
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                {user.isActive
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
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${user.isActive
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
                                        user.isActive ? 'Khóa tài khoản' : 'Kích hoạt'
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

export default UserDetailPage;
