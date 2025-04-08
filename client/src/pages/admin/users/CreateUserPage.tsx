import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import userAPI from '../../../services/userAPI';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';

const CreateUserPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'user',
        isActive: true
    });
    const [error, setError] = useState<string | null>(null);

    // Create user mutation
    const createMutation = useMutation({
        mutationFn: (userData: any) => userAPI.createUser(userData),
        onSuccess: () => {
            navigate('/admin/users', {
                state: { message: 'Người dùng đã được tạo thành công', type: 'success' }
            });
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo người dùng');
        }
    });

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const target = e.target as HTMLInputElement;
            setFormData(prev => ({
                ...prev,
                [name]: target.checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate form
        if (!formData.fullName.trim()) {
            setError('Vui lòng nhập họ tên');
            return;
        }

        if (!formData.email.trim()) {
            setError('Vui lòng nhập email');
            return;
        }

        if (!formData.password) {
            setError('Vui lòng nhập mật khẩu');
            return;
        }

        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        // Create user object (excluding confirmPassword)
        const { confirmPassword, ...userData } = formData;

        // Submit the form
        createMutation.mutate(userData);
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header section */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Tạo người dùng mới</h1>
                    <p className="text-sm text-gray-600 mt-1">Thêm tài khoản người dùng mới vào hệ thống</p>
                </div>
                <div className="mt-4 sm:mt-0">
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
                </div>
            </div>

            {/* Show error message if exists */}
            {error && (
                <div className="mb-4">
                    <AlertMessage type="error" message={error} />
                </div>
            )}

            {/* User creation form */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Thông tin cơ bản</h2>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Full Name field */}
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
                                required
                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                placeholder="Nhập họ và tên"
                            />
                        </div>

                        {/* Email field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                placeholder="Nhập email"
                            />
                        </div>

                        {/* Password field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                minLength={6}
                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                            />
                        </div>

                        {/* Confirm Password field */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Xác nhận mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                placeholder="Nhập lại mật khẩu"
                            />
                        </div>

                        {/* Phone field */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                Số điện thoại
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                placeholder="Nhập số điện thoại (tùy chọn)"
                            />
                        </div>

                        {/* Role field */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                Vai trò
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                            >
                                <option value="user">Người dùng</option>
                                <option value="admin">Quản trị viên</option>
                            </select>
                        </div>

                        {/* Active status */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                                Tài khoản hoạt động
                            </label>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="border-t border-gray-200 p-6">
                        <div className="flex justify-end space-x-3">
                            <Link
                                to="/admin/users"
                                className="bg-white py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                Hủy
                            </Link>
                            <button
                                type="submit"
                                className="inline-flex justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? (
                                    <span className="flex items-center">
                                        <LoadingSpinner size="small" color="white" />
                                        <span className="ml-2">Đang tạo...</span>
                                    </span>
                                ) : (
                                    'Tạo người dùng'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUserPage;
