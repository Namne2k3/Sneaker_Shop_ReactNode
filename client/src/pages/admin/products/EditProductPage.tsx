import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import productAPI from '../../../services/productService';
import categoryAPI from '../../../services/categoryService';
import brandAPI from '../../../services/brandService';
import sizeAPI from '../../../services/sizeService';
import colorAPI from '../../../services/colorService';
import AlertMessage from '../../../components/common/AlertMessage';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

// Define the variant interface
interface ProductVariant {
    _id?: string;
    size: string;
    color: string;
    sku: string;
    stock: number;
    additionalPrice: number;
    status?: string;
    isNew?: boolean;
    isDeleted?: boolean;
}

interface SizeOption {
    _id: string;
    name: string;
    value: string;
}

interface ColorOption {
    _id: string;
    name: string;
    code: string;
}

const EditProductPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<Array<{
        _id: string;
        imagePath: string;
        isPrimary: boolean;
    }>>([]);
    const [replaceImages, setReplaceImages] = useState(false);
    const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        features: '',
        basePrice: 0,
        salePrice: 0,
        category: '',
        brand: '',
        status: 'active',
        featured: false,
    });

    // Variants state
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [isAddingVariant, setIsAddingVariant] = useState(false);
    const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
    const [newVariant, setNewVariant] = useState<ProductVariant>({
        size: '',
        color: '',
        sku: '',
        stock: 0,
        additionalPrice: 0,
        isNew: true,
    });

    // Fetch product data
    const {
        data: productResponse,
        isLoading: isLoadingProduct,
        isError: isProductError,
        error: productError
    } = useQuery({
        queryKey: ['product', slug],
        queryFn: () => slug ? productAPI.getProductBySlug(slug) : Promise.reject('No product ID provided'),
        enabled: !!slug
    });

    // Fetch categories
    const {
        data: categoriesResponse,
        isLoading: isLoadingCategories
    } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryAPI.getCategories(),
    });

    // Fetch brands
    const {
        data: brandsResponse,
        isLoading: isLoadingBrands
    } = useQuery({
        queryKey: ['brands'],
        queryFn: () => brandAPI.getBrands(),
    });

    // Fetch sizes
    const {
        data: sizesResponse,
        isLoading: isLoadingSizes
    } = useQuery({
        queryKey: ['sizes'],
        queryFn: () => sizeAPI.getSizes(),
    });

    // Fetch colors
    const {
        data: colorsResponse,
        isLoading: isLoadingColors
    } = useQuery({
        queryKey: ['colors'],
        queryFn: () => colorAPI.getColors(),
    });

    // Update product mutation
    const updateMutation = useMutation({
        mutationFn: (data: FormData) => productAPI.updateProduct(productResponse.data._id || '', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product', productResponse.data._id] });
            queryClient.invalidateQueries({ queryKey: ['products'] });

            alert("Cập nhật dữ liệu sản phẩm thành công!")
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sản phẩm');
            alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sản phẩm');
        }
    });

    // Create variant mutation
    const createVariantMutation = useMutation({
        mutationFn: (data: ProductVariant) => productAPI.createProductVariant(productResponse.data._id || '', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product', productResponse.data._id] });
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi thêm biến thể sản phẩm');
        }
    });

    // Update variant mutation
    const updateVariantMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: unknown }) =>
            productAPI.updateProductVariant(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product', productResponse.data._id] });
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật biến thể sản phẩm');
        }
    });

    // Delete variant mutation
    const deleteVariantMutation = useMutation({
        mutationFn: (id: string) => productAPI.deleteProductVariant(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product', productResponse.data._id] });
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Có lỗi xảy ra khi xóa biến thể sản phẩm');
        }
    });

    // Initialize form data when product is loaded
    useEffect(() => {
        if (productResponse?.data) {
            const product = productResponse.data;
            setFormData({
                name: product.name || '',
                description: product.description || '',
                features: product.features || '',
                basePrice: product.basePrice || 0,
                salePrice: product.salePrice || 0,
                category: product.category?._id || '',
                brand: product.brand?._id || '',
                status: product.status || 'active',
                featured: product.featured || false,
            });

            if (product.images && product.images.length > 0) {
                setExistingImages(product.images);
                const primaryImage = product.images.find(img => img.isPrimary);
                if (primaryImage) {
                    setPrimaryImageId(primaryImage._id);
                }
            }

            // Initialize variants if available
            if (product.variants && product.variants.length > 0) {
                setVariants(product.variants.map((variant: any) => ({
                    _id: variant._id,
                    size: variant.size?._id || '',
                    color: variant.color?._id || '',
                    sku: variant.sku || '',
                    stock: variant.stock || 0,
                    additionalPrice: variant.additionalPrice || 0,
                    status: variant.status || 'active',
                })));
            }
        }
    }, [productResponse]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const fileArray: File[] = Array.from(files);
        setSelectedFiles(prevFiles => [...prevFiles, ...fileArray]);

        // Create image previews
        const newImagePreviews = fileArray.map(file => URL.createObjectURL(file));
        setImagePreviewUrls(prevUrls => [...prevUrls, ...newImagePreviews]);
    };

    const removeImage = (index: number) => {
        setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));

        // Revoke object URL to avoid memory leaks
        URL.revokeObjectURL(imagePreviewUrls[index]);
        setImagePreviewUrls(prevUrls => prevUrls.filter((_, i) => i !== index));
    };

    const handleSetPrimaryImage = (imageId: string) => {
        setPrimaryImageId(imageId);
    };

    const handleRemoveExistingImage = (imageId: string) => {
        setExistingImages(prev => prev.filter(img => img._id !== imageId));
        if (primaryImageId === imageId) {
            const newPrimaryImage = existingImages.find(img => img._id !== imageId);
            setPrimaryImageId(newPrimaryImage?._id || null);
        }
    };

    // Generate SKU based on product name and variant details
    const generateSku = (variant: ProductVariant) => {
        if (!formData.name || !variant.size || !variant.color) return '';

        const productPrefix = formData.name.substring(0, 3).toUpperCase();
        const sizes = sizesResponse?.data || [];
        const colors = colorsResponse?.data || [];

        // Find the size and color objects to use their values in the SKU
        const sizeObj = sizes.find(s => s._id === variant.size);
        const colorObj = colors.find(c => c._id === variant.color);

        if (!sizeObj || !colorObj) return '';

        const sizeCode = sizeObj.value.substring(0, 1).toUpperCase();
        const colorCode = colorObj.name.substring(0, 3).toUpperCase();
        const randomNum = Math.floor(1000 + Math.random() * 9000);

        return `${productPrefix}-${sizeCode}${colorCode}-${randomNum}`;
    };

    // Variant management
    const handleNewVariantChange = (field: keyof ProductVariant, value: string | number) => {
        setNewVariant(prev => ({
            ...prev,
            [field]: typeof value === 'string' && field !== 'sku' && !isNaN(Number(value))
                ? Number(value)
                : value
        }));
    };

    const handleEditVariantChange = (variantId: string, field: keyof ProductVariant, value: string | number) => {
        setVariants(variants.map(v =>
            v._id === variantId
                ? {
                    ...v,
                    [field]: typeof value === 'string' && field !== 'sku' && !isNaN(Number(value))
                        ? Number(value)
                        : value
                }
                : v
        ));
    };

    const handleEditVariant = (variantId: string) => {
        setActiveVariantId(variantId);
    };

    const handleCancelEdit = () => {
        setActiveVariantId(null);
    };

    const handleSaveVariant = async (variant: ProductVariant) => {
        if (!variant.sku || !variant.size || !variant.color) {
            setError('Vui lòng điền đầy đủ thông tin biến thể');
            return;
        }

        try {
            if (variant._id) {
                // Update existing variant
                const updateData = {
                    sku: variant.sku,
                    stock: variant.stock,
                    additionalPrice: variant.additionalPrice,
                    status: variant.status || 'active'
                };

                await updateVariantMutation.mutateAsync({
                    id: variant._id,
                    data: updateData
                });

                setActiveVariantId(null);
            }
        } catch (err) {
            console.error("Error saving variant:", err);
        }
    };

    const handleDeleteVariant = async (variantId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa biến thể này?')) {
            try {
                await deleteVariantMutation.mutateAsync(variantId);
                setVariants(variants.filter(v => v._id !== variantId));
            } catch (err) {
                console.error("Error deleting variant:", err);
            }
        }
    };

    const handleAddVariant = async () => {
        if (!isAddingVariant) {
            setIsAddingVariant(true);
            return;
        }

        if (!newVariant.sku || !newVariant.size || !newVariant.color) {
            setError('Vui lòng điền đầy đủ thông tin biến thể');
            return;
        }

        // Check for duplicate size/color combinations
        const isDuplicate = variants.some(v =>
            v.size === newVariant.size && v.color === newVariant.color && !v.isDeleted
        );

        if (isDuplicate) {
            setError('Kết hợp kích thước và màu sắc này đã tồn tại');
            return;
        }

        try {
            await createVariantMutation.mutateAsync(newVariant);

            // Reset form after successful addition
            setNewVariant({
                size: '',
                color: '',
                sku: '',
                stock: 0,
                additionalPrice: 0,
                isNew: true
            });

            setIsAddingVariant(false);
        } catch (err) {
            console.error("Error adding variant:", err);
        }
    };

    const handleCancelAddVariant = () => {
        setIsAddingVariant(false);
        setNewVariant({
            size: '',
            color: '',
            sku: '',
            stock: 0,
            additionalPrice: 0,
            isNew: true
        });
    };

    const handleGenerateSkuForNewVariant = () => {
        const sku = generateSku(newVariant);
        if (sku) {
            setNewVariant(prev => ({ ...prev, sku }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate form
        if (!formData.name || !formData.description || formData.basePrice <= 0) {
            setError('Vui lòng điền đầy đủ thông tin sản phẩm');
            return;
        }

        try {
            const productFormData = new FormData();

            // Add text fields
            Object.entries(formData).forEach(([key, value]) => {
                productFormData.append(key, value.toString());
            });

            // Add image replacement preference
            productFormData.append('replaceImages', replaceImages.toString());

            // Add updated existing images (with primary status)
            const updatedImages = existingImages.map(img => ({
                ...img,
                isPrimary: img._id === primaryImageId
            }));
            productFormData.append('existingImages', JSON.stringify(updatedImages));

            // Add new images
            selectedFiles.forEach(file => {
                productFormData.append('images', file);
            });

            // Submit the update for base product information
            await updateMutation.mutateAsync(productFormData);

            await Promise.all(variants.map(async (variant) => handleSaveVariant(variant)))

        } catch (err: any) {
            console.error("Error updating product:", err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sản phẩm');
        }
    };

    const categories = categoriesResponse?.data || [];
    const brands = brandsResponse?.data || [];
    const sizes = sizesResponse?.data || [] as SizeOption[];
    const colors = colorsResponse?.data || [] as ColorOption[];

    const isSubmitting = updateMutation.isPending;
    const isLoading = isLoadingProduct || isLoadingCategories || isLoadingBrands ||
        isLoadingSizes || isLoadingColors;

    if (isLoading) {
        return <div className="py-10 text-center"><LoadingSpinner size="large" /></div>;
    }

    if (isProductError) {
        return <AlertMessage type="error" message={(productError as Error)?.message || 'Không thể tải thông tin sản phẩm'} />;
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Chỉnh sửa sản phẩm</h1>
                <p className="text-sm text-gray-600 mt-1">Cập nhật thông tin sản phẩm</p>
            </div>

            {error && <AlertMessage type="error" message={error} />}

            <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Thông tin cơ bản</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên sản phẩm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                    placeholder="Nhập tên sản phẩm"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-1">
                                    Giá gốc <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="basePrice"
                                        id="basePrice"
                                        required
                                        min="0"
                                        className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                        placeholder="0"
                                        value={formData.basePrice || ''}
                                        onChange={handleInputChange}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">₫</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-1">
                                    Giá khuyến mãi
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="salePrice"
                                        id="salePrice"
                                        min="0"
                                        className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                        placeholder="0"
                                        value={formData.salePrice || ''}
                                        onChange={handleInputChange}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">₫</span>
                                    </div>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Để 0 nếu không có giá khuyến mãi</p>
                            </div>

                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                    Trạng thái
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="active">Đang bán</option>
                                    <option value="draft">Nháp</option>
                                    <option value="out_of_stock">Hết hàng</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Mô tả sản phẩm <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                required
                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                placeholder="Mô tả chi tiết về sản phẩm"
                                value={formData.description}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="features" className="block text-sm font-medium text-gray-700 mb-1">
                                Đặc điểm sản phẩm
                            </label>
                            <textarea
                                id="features"
                                name="features"
                                rows={3}
                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                placeholder="Nhập các đặc điểm chính của sản phẩm, phân tách bằng dòng mới"
                                value={formData.features}
                                onChange={handleInputChange}
                            />
                            <p className="mt-1 text-xs text-gray-500">Mỗi dòng sẽ là một đặc điểm riêng biệt</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                    Danh mục <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    required
                                    className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                >
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map(category => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                                    Thương hiệu <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="brand"
                                    name="brand"
                                    required
                                    className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                    value={formData.brand}
                                    onChange={handleInputChange}
                                >
                                    <option value="">-- Chọn thương hiệu --</option>
                                    {brands.map(brand => (
                                        <option key={brand._id} value={brand._id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center mb-6">
                            <input
                                id="featured"
                                name="featured"
                                type="checkbox"
                                className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                                checked={formData.featured}
                                onChange={handleCheckboxChange}
                            />
                            <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                                Đánh dấu là sản phẩm nổi bật
                            </label>
                        </div>
                    </div>

                    {/* Images Section */}
                    <div className="border-t border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Hình ảnh sản phẩm</h2>
                        </div>

                        <div className="p-6">
                            {/* Existing images */}
                            {existingImages.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-md font-medium text-gray-700 mb-2">Hình ảnh hiện có</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                                        {existingImages.map((image) => (
                                            <div key={image._id} className="relative group">
                                                <div className={`aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200 ${image._id === primaryImageId ? 'ring-2 ring-primary' : ''}`}>
                                                    <img
                                                        loading='lazy'
                                                        src={image.imagePath}
                                                        alt="Product preview"
                                                        className="h-full w-full object-cover object-center"
                                                    />
                                                </div>
                                                <div className="absolute top-0 right-0 p-1">
                                                    <button
                                                        type="button"
                                                        className="bg-red-500 text-white rounded-full p-1"
                                                        onClick={() => handleRemoveExistingImage(image._id)}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={`mt-1 text-xs w-full py-1 rounded ${image._id === primaryImageId ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                                                    onClick={() => handleSetPrimaryImage(image._id)}
                                                >
                                                    {image._id === primaryImageId ? 'Ảnh chính' : 'Đặt làm ảnh chính'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center mb-4">
                                        <input
                                            id="replaceImages"
                                            type="checkbox"
                                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                            checked={replaceImages}
                                            onChange={(e) => setReplaceImages(e.target.checked)}
                                        />
                                        <label htmlFor="replaceImages" className="ml-2 block text-sm text-gray-700">
                                            Thay thế tất cả hình ảnh hiện có bằng hình ảnh mới
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Upload new images */}
                            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 relative">
                                <input
                                    type="file"
                                    id="images"
                                    name="images"
                                    multiple
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                                <div className="text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Kéo thả ảnh vào đây hoặc <span className="text-primary font-medium">chọn ảnh</span>
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        PNG, JPG, JPEG (Tối đa 5MB)
                                    </p>
                                </div>
                            </div>

                            {/* Preview new images */}
                            {imagePreviewUrls.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Ảnh mới đã chọn:</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {imagePreviewUrls.map((url, index) => (
                                            <div key={index} className="relative group">
                                                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200">
                                                    <img
                                                        src={url}
                                                        loading='lazy'
                                                        alt={`Preview ${index}`}
                                                        className="h-full w-full object-cover object-center"
                                                    />
                                                </div>
                                                <div className="absolute top-0 right-0 p-1">
                                                    <button
                                                        type="button"
                                                        className="bg-red-500 text-white rounded-full p-1"
                                                        onClick={() => removeImage(index)}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Variants Section */}
                    <div className="border-t border-gray-200">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-medium text-gray-900">Biến thể sản phẩm</h2>
                            <button
                                type="button"
                                className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                onClick={handleAddVariant}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Thêm biến thể
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Add New Variant Form */}
                            {isAddingVariant && (
                                <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-md font-medium text-gray-800">Thêm biến thể mới</h3>
                                        <button
                                            type="button"
                                            className="text-gray-500 hover:text-gray-700"
                                            onClick={handleCancelAddVariant}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Kích thước <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                value={newVariant.size}
                                                onChange={(e) => handleNewVariantChange('size', e.target.value)}
                                                required
                                            >
                                                <option value="">-- Chọn kích thước --</option>
                                                {sizes.map(size => (
                                                    <option key={size._id} value={size._id}>
                                                        {size.name} ({size.value})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Màu sắc <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                value={newVariant.color}
                                                onChange={(e) => handleNewVariantChange('color', e.target.value)}
                                                required
                                            >
                                                <option value="">-- Chọn màu sắc --</option>
                                                {colors.map(color => (
                                                    <option key={color._id} value={color._id}>
                                                        {color.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                SKU <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex">
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-2.5 rounded-l-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                    placeholder="Mã SKU"
                                                    value={newVariant.sku}
                                                    onChange={(e) => handleNewVariantChange('sku', e.target.value)}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-4 py-2.5 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                                                    onClick={handleGenerateSkuForNewVariant}
                                                >
                                                    Tạo
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tồn kho <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                placeholder="Số lượng"
                                                value={newVariant.stock}
                                                onChange={(e) => handleNewVariantChange('stock', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Giá tăng thêm
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                    placeholder="0"
                                                    value={newVariant.additionalPrice}
                                                    onChange={(e) => handleNewVariantChange('additionalPrice', e.target.value)}
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 sm:text-sm">₫</span>
                                                </div>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Giá bán = Giá gốc + Giá tăng thêm = {(formData.basePrice + (newVariant.additionalPrice || 0)).toLocaleString('vi-VN')}₫
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-4">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                            onClick={handleAddVariant}
                                        >
                                            {createVariantMutation.isPending ? (
                                                <span className="flex items-center">
                                                    <LoadingSpinner size="small" color="white" />
                                                    <span className="ml-2">Đang xử lý...</span>
                                                </span>
                                            ) : (
                                                'Thêm biến thể'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Existing Variants */}
                            {variants.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kích thước</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Màu sắc</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá bán</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                                <th scope="col" className="relative px-6 py-3">
                                                    <span className="sr-only">Thao tác</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {variants.map((variant) => {
                                                const variantSize = sizes.find(s => s._id === variant.size);
                                                const variantColor = colors.find(c => c._id === variant.color);
                                                const isEditing = activeVariantId === variant._id;

                                                return (
                                                    <tr key={variant._id} className={isEditing ? 'bg-blue-50' : ''}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {isEditing ? (
                                                                <input
                                                                    type="text"
                                                                    className="w-full px-2 py-1 border-gray-300 rounded-md"
                                                                    value={variant.sku}
                                                                    onChange={(e) => handleEditVariantChange(variant._id as string, 'sku', e.target.value)}
                                                                />
                                                            ) : (
                                                                <div className="text-sm font-medium text-gray-900">{variant.sku}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {variantSize ? `${variantSize.name} (${variantSize.value})` : 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                {variantColor && (
                                                                    <div
                                                                        className="h-4 w-4 rounded-full mr-2"
                                                                        style={{ backgroundColor: variantColor.code || '#ccc' }}
                                                                    ></div>
                                                                )}
                                                                <div className="text-sm text-gray-900">
                                                                    {variantColor ? variantColor.name : 'N/A'}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {isEditing ? (
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="w-20 px-2 py-1 border-gray-300 rounded-md"
                                                                    value={variant.stock}
                                                                    onChange={(e) => handleEditVariantChange(variant._id as string, 'stock', e.target.value)}
                                                                />
                                                            ) : (
                                                                <div className="text-sm text-gray-900">{variant.stock}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {isEditing ? (
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        className="w-24 px-2 py-1 border-gray-300 rounded-md"
                                                                        value={variant.additionalPrice}
                                                                        onChange={(e) => handleEditVariantChange(variant._id as string, 'additionalPrice', e.target.value)}
                                                                    />
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        {(formData.basePrice + (variant.additionalPrice || 0)).toLocaleString('vi-VN')}₫
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm text-gray-900">
                                                                    {(formData.basePrice + (variant.additionalPrice || 0)).toLocaleString('vi-VN')}₫
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {isEditing ? (
                                                                <select
                                                                    className="w-full px-2 py-1 border-gray-300 rounded-md"
                                                                    value={variant.status}
                                                                    onChange={(e) => handleEditVariantChange(variant._id as string, 'status', e.target.value)}
                                                                >
                                                                    <option value="active">Còn hàng</option>
                                                                    <option value="out_of_stock">Hết hàng</option>
                                                                    <option value="inactive">Ngừng kinh doanh</option>
                                                                </select>
                                                            ) : (
                                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                    ${variant.status === 'active' ? 'bg-green-100 text-green-800' :
                                                                        variant.status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                                                                            'bg-gray-100 text-gray-800'}`}
                                                                >
                                                                    {variant.status === 'active' ? 'Còn hàng' :
                                                                        variant.status === 'out_of_stock' ? 'Hết hàng' :
                                                                            'Ngừng kinh doanh'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            {isEditing ? (
                                                                <div className="flex space-x-2 justify-end">
                                                                    <button
                                                                        type="button"
                                                                        className="text-primary hover:text-primary-dark"
                                                                        onClick={() => handleSaveVariant(variant)}
                                                                    >
                                                                        Lưu
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="text-gray-600 hover:text-gray-800"
                                                                        onClick={handleCancelEdit}
                                                                    >
                                                                        Hủy
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex space-x-3 justify-end">
                                                                    <button
                                                                        type="button"
                                                                        className="text-primary hover:text-primary-dark"
                                                                        onClick={() => handleEditVariant(variant._id as string)}
                                                                    >
                                                                        Sửa
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="text-red-600 hover:text-red-800"
                                                                        onClick={() => handleDeleteVariant(variant._id as string)}
                                                                    >
                                                                        Xóa
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">Sản phẩm này chưa có biến thể nào. Nhấn "Thêm biến thể" để tạo mới.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="border-t border-gray-200 p-6">
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                className="bg-white py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                onClick={() => navigate(`/admin/products/${productResponse.data._id}`)}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="inline-flex justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center">
                                        <LoadingSpinner size="small" color="white" />
                                        <span className="ml-2">Đang cập nhật...</span>
                                    </span>
                                ) : (
                                    'Cập nhật sản phẩm'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProductPage;
