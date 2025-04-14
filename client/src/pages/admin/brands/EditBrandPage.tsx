import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import brandAPI from '../../../services/brandService';
import AlertMessage from '../../../components/common/AlertMessage';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const EditBrandPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'active'
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [currentLogo, setCurrentLogo] = useState<string | null>(null);
    const [uploadNewLogo, setUploadNewLogo] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch brand data
    const {
        data: brandResponse,
        isLoading: isLoadingBrand,
        isError: isBrandError,
        error: brandError
    } = useQuery({
        queryKey: ['brand', slug],
        queryFn: () => slug ? brandAPI.getBrandBySlug(slug) : Promise.reject('No slug provided'),
        enabled: !!slug
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: FormData) => {
            if (!brandResponse?.data?._id) throw new Error('Brand ID is missing');
            return brandAPI.updateBrand(brandResponse.data._id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brand'] });
            queryClient.invalidateQueries({ queryKey: ['brands'] });
            navigate(`/admin/brands/${slug}`, {
                state: { message: 'Cập nhật thương hiệu thành công', type: 'success' }
            });
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thương hiệu');
        }
    });

    // Initialize form with brand data
    useEffect(() => {
        if (brandResponse?.data) {
            const brand = brandResponse.data;
            setFormData({
                name: brand.name || '',
                description: brand.description || '',
                status: brand.status || 'active'
            });

            if (brand.logo) {
                setCurrentLogo(brand.logo);
                setImagePreview(brand.logo);
            }
        }
    }, [brandResponse]);

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

        // Create FormData object for API submission
        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('description', formData.description);
        submitData.append('status', formData.status);

        // Only include logo if uploading a new one
        if (uploadNewLogo && selectedFile) {
            submitData.append('image', selectedFile);
        }

        // Submit the form
        updateMutation.mutate(submitData);
    };

    if (isLoadingBrand) {
        return <div className="py-10 text-center"><LoadingSpinner size="large" /></div>;
    }

    if (isBrandError) {
        return <AlertMessage type="error" message={(brandError as Error)?.message || 'Không thể tải thông tin thương hiệu'} />;
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Chỉnh sửa thương hiệu</h1>
                <p className="text-sm text-gray-600 mt-1">Cập nhật thông tin cho thương hiệu {formData.name}</p>
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
                                Logo thương hiệu
                            </label>

                            {/* Current logo */}
                            {currentLogo && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-700 mb-2">Logo hiện tại:</p>
                                    <div className="w-32 h-32 rounded-lg border overflow-hidden bg-gray-50">
                                        <img
                                            src={currentLogo}
                                            loading='lazy'
                                            alt="Current logo"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center mb-2">
                                <input
                                    id="uploadNewLogo"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    checked={uploadNewLogo}
                                    onChange={(e) => setUploadNewLogo(e.target.checked)}
                                />
                                <label htmlFor="uploadNewLogo" className="ml-2 block text-sm text-gray-700">
                                    Tải lên logo mới
                                </label>
                            </div>

                            {uploadNewLogo && (
                                <>
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

                                    {/* New logo preview */}
                                    {selectedFile && imagePreview && (
                                        <div className="mt-4">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Logo mới:</p>
                                            <div className="w-32 h-32 rounded-lg border overflow-hidden bg-gray-50">
                                                <img
                                                    src={imagePreview}
                                                    loading='lazy'
                                                    alt="New logo preview"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
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

                        <div className="mt-2 text-xs text-gray-500">
                            <p>Slug: <span className="font-mono">{brandResponse?.data?.slug}</span></p>
                            <p className="mt-1">ID: <span className="font-mono">{brandResponse?.data?._id}</span></p>
                        </div>
                    </div>

                    {/* Form actions */}
                    <div className="border-t border-gray-200 p-6">
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                className="bg-white py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                onClick={() => navigate(`/admin/brands/${slug}`)}
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
                                    'Cập nhật thương hiệu'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditBrandPage;
