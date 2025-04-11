import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAppSelector } from '../../store/hooks';
import userAPI from '../../services/userAPI';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface ProfileFormData {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
}

const ProfilePage = () => {
    const { user } = useAppSelector(state => state.auth);
    const [activeTab, setActiveTab] = useState('info');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Setup form with react-hook-form
    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ProfileFormData>();

    // Fetch user profile data
    const { data: profileData, isLoading, refetch } = useQuery({
        queryKey: ['user-profile'],
        queryFn: userAPI.getUserProfile,
        enabled: !!user,
    });

    // Initialize form with user data
    useEffect(() => {
        if (profileData?.data) {
            setValue('fullName', profileData.data.fullName || '');
            setValue('email', profileData.data.email || '');
            setValue('phone', profileData.data.phone || '');
            setValue('address', profileData.data.address || '');

            if (profileData.data.avatar) {
                setImagePreview(profileData.data.avatar);
            }
        }
    }, [profileData, setValue]);

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: (formData: FormData) => userAPI.updateProfile(formData),
        onSuccess: () => {
            toast.success('Thông tin tài khoản đã được cập nhật thành công');
            refetch();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
        }
    });

    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: (data: { currentPassword: string; newPassword: string }) =>
            userAPI.changePassword(data.currentPassword, data.newPassword),
        onSuccess: () => {
            toast.success('Mật khẩu đã được thay đổi thành công');
            reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi thay đổi mật khẩu');
        }
    });

    // Handle image selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Kích thước ảnh không được vượt quá 5MB');
            return;
        }

        setSelectedImage(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
    };

    // Handle profile update
    const handleProfileUpdate = (data: ProfileFormData) => {
        const formData = new FormData();
        formData.append('fullName', data.fullName);
        formData.append('phone', data.phone || '');
        formData.append('address', data.address || '');

        if (selectedImage) {
            formData.append('avatar', selectedImage);
        }

        updateProfileMutation.mutate(formData);
    };

    // Handle password change
    const handlePasswordChange = (data: ProfileFormData) => {
        if (data.newPassword !== data.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        if (data.currentPassword && data.newPassword) {
            changePasswordMutation.mutate({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Tài khoản của tôi</h1>

            {/* Tabs */}
            <div className="mb-6 border-b">
                <nav className="flex flex-wrap -mb-px">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'info'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Thông tin cá nhân
                    </button>
                    <button
                        onClick={() => setActiveTab('password')}
                        className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'password'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Đổi mật khẩu
                    </button>
                </nav>
            </div>

            {/* Profile info tab */}
            {activeTab === 'info' && (
                <div className="bg-white shadow rounded-lg p-6">
                    <form onSubmit={handleSubmit(handleProfileUpdate)} className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Avatar section */}
                            {/* <div className="w-full md:w-1/3 flex flex-col items-center">
                                <div className="w-40 h-40 rounded-full overflow-hidden mb-4 border-2 border-gray-200">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = "https://via.placeholder.com/150?text=Avatar";
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                            <svg className="h-20 w-20 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <label htmlFor="avatar" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition duration-300">
                                    Chọn ảnh đại diện
                                    <input
                                        type="file"
                                        id="avatar"
                                        name="avatar"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                                <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF tối đa 5MB</p>
                            </div> */}

                            {/* Personal info section */}
                            <div className="w-full md:w-2/3">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="">
                                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                                            Họ và tên <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="fullName"
                                            type="text"
                                            className={`p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 ${errors.fullName ? 'border-red-500' : ''}`}
                                            {...register('fullName', { required: 'Họ và tên là bắt buộc' })}
                                        />
                                        {errors.fullName && (
                                            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                            Email
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
                                            {...register('email')}
                                            disabled
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Email không thể thay đổi</p>
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                            Số điện thoại
                                        </label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                            {...register('phone')}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                            Địa chỉ
                                        </label>
                                        <textarea
                                            id="address"
                                            rows={3}
                                            className="p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                            {...register('address')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="cursor-pointer hover:text-white inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                disabled={updateProfileMutation.isPending}
                            >
                                {updateProfileMutation.isPending ? (
                                    <>
                                        <LoadingSpinner size="small" color="white" />
                                        <span className="ml-2 hover:text-white ">Đang cập nhật...</span>
                                    </>
                                ) : (
                                    'Cập nhật thông tin'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Password change tab */}
            {activeTab === 'password' && (
                <div className="bg-white shadow rounded-lg p-6">
                    <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-6">
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                                Mật khẩu hiện tại <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="currentPassword"
                                type="password"
                                className={`p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 ${errors.currentPassword ? 'border-red-500' : ''}`}
                                {...register('currentPassword', { required: 'Vui lòng nhập mật khẩu hiện tại' })}
                            />
                            {errors.currentPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                                Mật khẩu mới <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                className={`p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 ${errors.newPassword ? 'border-red-500' : ''}`}
                                {...register('newPassword', {
                                    required: 'Vui lòng nhập mật khẩu mới',
                                    minLength: {
                                        value: 6,
                                        message: 'Mật khẩu phải có ít nhất 6 ký tự'
                                    }
                                })}
                            />
                            {errors.newPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className={`p-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                {...register('confirmPassword', {
                                    required: 'Vui lòng xác nhận mật khẩu mới',
                                    validate: value => value === watch('newPassword') || 'Mật khẩu xác nhận không khớp'
                                })}
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                disabled={changePasswordMutation.isPending}
                            >
                                {changePasswordMutation.isPending ? (
                                    <>
                                        <LoadingSpinner size="small" color="white" />
                                        <span className="ml-2">Đang xử lý...</span>
                                    </>
                                ) : (
                                    'Đổi mật khẩu'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;