import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';
import categoryAPI from '../../../services/categoryService';

interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    parent?: string | null;
    image?: string;
}

const EditCategoryPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parent: '',
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [uploadNewImage, setUploadNewImage] = useState(false);

    // Fetch current category data
    const {
        data: categoryResponse,
        isLoading,
        isError,
        error: categoryError
    } = useQuery({
        queryKey: ['category', slug],
        queryFn: () => slug ? categoryAPI.getCategoryBySlug(slug, false, false) : Promise.reject('No category slug provided'),
        enabled: !!slug
    });

    // Fetch categories for parent selection
    const {
        data: categoriesResponse,
        isLoading: isLoadingCategories
    } = useQuery({
        queryKey: ['categories', { parent: 'all' }],
        queryFn: () => categoryAPI.getCategories(),
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (formData: FormData) => {
            if (!categoryResponse?.data?._id) throw new Error('Category ID is missing');
            return categoryAPI.updateCategory(categoryResponse.data._id, formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['category'] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            navigate(`/admin/categories/${slug}`, {
                state: { message: 'Cập nhật danh mục thành công', type: 'success' }
            });
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật danh mục');
        }
    });

    // Initialize form with category data
    useEffect(() => {
        if (categoryResponse?.data) {
            const category = categoryResponse.data;
            setFormData({
                name: category.name || '',
                description: category.description || '',
                parent: category.parent?._id || category.parent || '',
            });

            if (category.image) {
                setImagePreview(category.image);
            }
        }
    }, [categoryResponse]);

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setImagePreview(URL.createObjectURL(file));
            setUploadNewImage(true);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            // Validate required fields
            if (!formData.name.trim()) {
                setError('Tên danh mục không được để trống');
                return;
            }

            // Create FormData object for submission
            const submitFormData = new FormData();
            submitFormData.append('name', formData.name);
            submitFormData.append('description', formData.description || '');

            // Handle parent category - allow null
            if (formData.parent) {
                submitFormData.append('parent', formData.parent);
            } else {
                submitFormData.append('parent', 'null'); // Send as null string to backend
            }

            // Only include the image if uploading a new one
            if (uploadNewImage && selectedFile) {
                submitFormData.append('image', selectedFile);
            }

            // Submit the update
            await updateMutation.mutateAsync(submitFormData);
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra khi cập nhật danh mục');
        }
    };

    // Helper to filter out current category and its children from parent options
    const filterValidParents = (categories: Category[] = [], currentId: string): Category[] => {
        return categories.filter(cat => {
            // Don't include self as parent option
            return cat._id !== currentId;
        });
    };

    // Find parent category name for display
    const getParentCategoryName = () => {
        if (!formData.parent || !categoriesResponse?.data) return 'Không có';

        const parentCategory = categoriesResponse.data.find(
            (cat: Category) => cat._id === formData.parent
        );

        return parentCategory ? parentCategory.name : 'Không có';
    };

    if (isLoading || isLoadingCategories) {
        return <div className="py-10 text-center"><LoadingSpinner size="large" /></div>;
    }

    if (isError) {
        return <AlertMessage type="error" message={(categoryError as Error)?.message || 'Không thể tải thông tin danh mục'} />;
    }

    const category = categoryResponse?.data;
    const categories = categoriesResponse?.data || [];
    const validParentOptions = filterValidParents(categories, category._id);

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Chỉnh sửa danh mục</h1>
                <p className="text-sm text-gray-600 mt-1">Cập nhật thông tin cho danh mục {category.name}</p>
            </div>

            {error && <AlertMessage type="error" message={error} />}

            <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Thông tin cơ bản</h2>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Name field */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Tên danh mục <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                placeholder="Nhập tên danh mục"
                            />
                        </div>

                        {/* Description field */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Mô tả
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                placeholder="Mô tả về danh mục"
                            />
                        </div>

                        {/* Parent category field */}
                        <div>
                            <label htmlFor="parent" className="block text-sm font-medium text-gray-700 mb-1">
                                Danh mục cha
                            </label>
                            <select
                                id="parent"
                                name="parent"
                                value={formData.parent}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                            >
                                <option value="">Không có (Danh mục gốc)</option>
                                {validParentOptions.map(category => (
                                    <option key={category._id} value={category._id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            <div className="mt-1 text-xs text-gray-500">
                                {formData.parent ? `Danh mục cha hiện tại: ${getParentCategoryName()}` : 'Đây là danh mục gốc'}
                            </div>
                        </div>

                        {/* Category image field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hình ảnh danh mục
                            </label>

                            {/* Current image preview */}
                            {imagePreview && (
                                <div className="mb-3">
                                    <div className="relative w-40 h-40 rounded-lg overflow-hidden bg-gray-100 mb-2">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {uploadNewImage ? 'Hình ảnh mới đã chọn' : 'Hình ảnh hiện tại'}
                                    </div>
                                </div>
                            )}

                            <div className="mt-2">
                                <div className="flex items-center mb-2">
                                    <input
                                        id="uploadNewImage"
                                        type="checkbox"
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                        checked={uploadNewImage}
                                        onChange={(e) => setUploadNewImage(e.target.checked)}
                                    />
                                    <label htmlFor="uploadNewImage" className="ml-2 block text-sm text-gray-700">
                                        Tải lên hình ảnh mới
                                    </label>
                                </div>

                                {uploadNewImage && (
                                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 relative">
                                        <input
                                            type="file"
                                            id="image"
                                            name="image"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleFileChange}
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
                                            <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF (tối đa 5MB)</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                            <p>Slug: <span className="font-mono">{category.slug}</span></p>
                            <p className="mt-1">ID: <span className="font-mono">{category._id}</span></p>
                        </div>
                    </div>

                    {/* Form actions */}
                    <div className="border-t border-gray-200 p-6">
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                className="bg-white py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                onClick={() => navigate(`/admin/categories/${slug}`)}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="inline-flex justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? (
                                    <span className="flex items-center">
                                        <LoadingSpinner size="small" color="white" />
                                        <span className="ml-2">Đang cập nhật...</span>
                                    </span>
                                ) : (
                                    'Cập nhật danh mục'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCategoryPage;