import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import brandAPI from '../../../services/brandService';
import AlertMessage from '../../../components/common/AlertMessage';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const CreateBrandPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active'
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Create brand mutation
    const createMutation = useMutation({
        mutationFn: (data: FormData) => brandAPI.createBrand(data),
        onSuccess: (response) => {
            navigate('/admin/brands', {
                state: { message: 'Thương hiệu đã được tạo thành công', type: 'success' }
            });
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo thương hiệu');
        }
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Create image preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate form
        if (!formData.name) {
            setError('Vui lòng nhập tên thương hiệu');
            return;
        }

        if (!selectedFile) {
            setError('Vui lòng chọn logo cho thương hiệu');
            return;
        }

        // Create FormData object for API submission
        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('description', formData.description);
        submitData.append('status', formData.status);
        if (selectedFile) {
            submitData.append('image', selectedFile);
        }

        // Submit the form
        createMutation.mutate(submitData);
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Thêm thương hiệu mới</h1>
                <p className="text-sm text-gray-600 mt-1">Tạo thương hiệu mới trong hệ thống</p>
            </div>

            {error && <AlertMessage type="error" message={error} />}

            <div className="bg-white rounded-lg shadow-sm mb-6">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Thông tin thương hiệu</h2>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Brand name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Tên thương hiệu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                placeholder="Nhập tên thương hiệu"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Mô tả
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                value={formData.description}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                placeholder="Mô tả về thương hiệu"
                            />
                        </div>

                        {/* Logo upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Logo thương hiệu <span className="text-red-500">*</span>
                            </label>

                            <div className="mt-2">
                                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 relative">
                                    <input
                                        type="file"
                                        id="logo"
                                        name="logo"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="text-center">
                                        <svg
                                            className="mx-auto h-12 w-12 text-gray-400"
                                            stroke="currentColor"
                                            fill="none"
                                            viewBox="0 0 48 48"
                                        >
                                            <path
                                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                strokeWidth={2}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Kéo thả ảnh vào đây hoặc <span className="text-primary font-medium">chọn ảnh</span>
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF (tối đa 2MB)</p>
                                    </div>
                                </div>
                            </div>

                            {/* Image preview */}
                            {imagePreview && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Xem trước:</p>
                                    <div className="w-32 h-32 rounded-lg border overflow-hidden bg-gray-50">
                                        <img
                                            src={imagePreview}
                                            alt="Logo preview"
                                            loading='lazy'
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                Trạng thái
                            </label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                            >
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Không hoạt động</option>
                            </select>
                        </div>
                    </div>

                    {/* Form actions */}
                    <div className="border-t border-gray-200 p-6">
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                className="bg-white py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                onClick={() => navigate('/admin/brands')}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="inline-flex justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? (
                                    <span className="flex items-center">
                                        <LoadingSpinner size="small" color="white" />
                                        <span className="ml-2">Đang xử lý...</span>
                                    </span>
                                ) : (
                                    'Tạo thương hiệu'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBrandPage;
