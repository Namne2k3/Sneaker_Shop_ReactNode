import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { FiChevronLeft } from 'react-icons/fi';
import api from '../../../services/api';
import AlertMessage from '../../../components/common/AlertMessage';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const CreateCouponPage = () => {
    const navigate = useNavigate();
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage',
        value: 0,
        minOrderAmount: 0,
        maxUsage: 0,
        startDate: new Date().toISOString().split('T')[0], // Today in YYYY-MM-DD format
        endDate: '',
        isActive: true
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Create coupon mutation
    const createMutation = useMutation({
        mutationFn: (data: typeof formData) => api.post('/coupons', data),
        onSuccess: () => {
            setAlertMessage({ type: 'success', message: 'Tạo mã giảm giá thành công!' });
            setTimeout(() => {
                navigate('/admin/coupons');
            }, 1500);
        },
        onError: (error: any) => {
            setAlertMessage({
                type: 'error',
                message: error.response?.data?.message || 'Có lỗi xảy ra khi tạo mã giảm giá.'
            });
        }
    });

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.code.trim()) {
            newErrors.code = 'Mã giảm giá không được để trống';
        } else if (formData.code.includes(' ')) {
            newErrors.code = 'Mã giảm giá không được chứa khoảng trắng';
        }

        if (formData.value <= 0) {
            newErrors.value = 'Giá trị giảm giá phải lớn hơn 0';
        }

        if (formData.type === 'percentage' && formData.value > 100) {
            newErrors.value = 'Giảm giá theo phần trăm không thể vượt quá 100%';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'Ngày kết thúc là bắt buộc';
        }

        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        if (endDate <= startDate) {
            newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        // Handle checkbox separately
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }

        // Handle number inputs
        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            createMutation.mutate(formData);
        }
    };

    return (
        <div className="p-4">
            <div className="mb-6">
                <button
                    onClick={() => navigate('/admin/coupons')}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                >
                    <FiChevronLeft className="mr-1" />
                    <span>Quay lại danh sách mã giảm giá</span>
                </button>
                <h1 className="text-2xl font-bold mt-2">Tạo mã giảm giá mới</h1>
            </div>

            {alertMessage && (
                <div className="mb-4">
                    <AlertMessage type={alertMessage.type} message={alertMessage.message} />
                </div>
            )}

            <div className="bg-white p-6 rounded shadow">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Mã giảm giá */}
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                                Mã giảm giá <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="code"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                className={`w-full p-2 border rounded ${errors.code ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="Nhập mã giảm giá (vd: SUMMER2023)"
                            />
                            {errors.code && <p className="mt-1 text-sm text-red-500">{errors.code}</p>}
                            <p className="mt-1 text-xs text-gray-500">
                                Mã giảm giá phải là duy nhất và không chứa khoảng trắng. Sẽ tự động chuyển thành chữ hoa.
                            </p>
                        </div>

                        {/* Loại giảm giá */}
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                                Loại giảm giá <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="percentage">Phần trăm (%)</option>
                                <option value="fixed">Số tiền cố định (VNĐ)</option>
                            </select>
                        </div>

                        {/* Giá trị */}
                        <div>
                            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                                Giá trị <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    id="value"
                                    name="value"
                                    value={formData.value}
                                    onChange={handleChange}
                                    min="0"
                                    step={formData.type === 'percentage' ? '1' : '1000'}
                                    className={`w-full p-2 border rounded ${errors.value ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                <span className="ml-2">
                                    {formData.type === 'percentage' ? '%' : 'VNĐ'}
                                </span>
                            </div>
                            {errors.value && <p className="mt-1 text-sm text-red-500">{errors.value}</p>}
                            <p className="mt-1 text-xs text-gray-500">
                                {formData.type === 'percentage'
                                    ? 'Nhập % giảm giá (0-100)'
                                    : 'Nhập số tiền giảm giá cố định'}
                            </p>
                        </div>

                        {/* Giá trị đơn hàng tối thiểu */}
                        <div>
                            <label htmlFor="minOrderAmount" className="block text-sm font-medium text-gray-700 mb-1">
                                Giá trị đơn hàng tối thiểu
                            </label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    id="minOrderAmount"
                                    name="minOrderAmount"
                                    value={formData.minOrderAmount}
                                    onChange={handleChange}
                                    min="0"
                                    step="100000"
                                    className="w-full p-2 border border-gray-300 rounded"
                                />
                                <span className="ml-2">VNĐ</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Đặt 0 nếu không yêu cầu giá trị đơn hàng tối thiểu
                            </p>
                        </div>

                        {/* Số lần sử dụng tối đa */}
                        <div>
                            <label htmlFor="maxUsage" className="block text-sm font-medium text-gray-700 mb-1">
                                Số lần sử dụng tối đa
                            </label>
                            <input
                                type="number"
                                id="maxUsage"
                                name="maxUsage"
                                value={formData.maxUsage}
                                onChange={handleChange}
                                min="0"
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Đặt 0 nếu không giới hạn số lần sử dụng
                            </p>
                        </div>

                        {/* Ngày bắt đầu */}
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Ngày bắt đầu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>

                        {/* Ngày kết thúc */}
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Ngày kết thúc <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className={`w-full p-2 border rounded ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
                        </div>

                        {/* Trạng thái kích hoạt */}
                        <div className="md:col-span-2">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                                    Kích hoạt ngay
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/coupons')}
                            className="px-4 py-2 border border-gray-300 rounded shadow mr-2 hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending ? (
                                <span className="flex items-center">
                                    <LoadingSpinner size="small" color="white" />
                                    <span className="ml-2">Đang xử lý...</span>
                                </span>
                            ) : (
                                'Tạo mã giảm giá'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCouponPage;