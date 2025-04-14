import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import productAPI from '../../../services/productService';
import categoryAPI from '../../../services/categoryService';
import brandAPI from '../../../services/brandService';
import sizeAPI from '../../../services/sizeService';
import colorAPI from '../../../services/colorService';
import AlertMessage from '../../../components/common/AlertMessage';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

// Define the variant interface
interface ProductVariant {
    size: string;
    color: string;
    sku: string;
    stock: number;
    additionalPrice: number;
}

const CreateProductPage: React.FC = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

    // State for sizes and colors
    // const [sizes, setSizes] = useState<{ _id: string, name: string, value: string }[]>([]);
    // const [colors, setColors] = useState<{ _id: string, name: string, code: string }[]>([]);

    // New state for variants
    const [variants, setVariants] = useState<ProductVariant[]>([
        { size: '', color: '', sku: '', stock: 0, additionalPrice: 0 }
    ]);

    // Form state
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

    // Fetch categories, brands, sizes and colors
    const {
        data: categoriesResponse,
        isLoading: isLoadingCategories,
        isError: isCategoriesError
    } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryAPI.getCategories(),
    });

    const {
        data: brandsResponse,
        isLoading: isLoadingBrands,
        isError: isBrandsError
    } = useQuery({
        queryKey: ['brands'],
        queryFn: () => brandAPI.getBrands(),
    });

    const {
        data: sizesResponse,
        isLoading: isLoadingSizes,
    } = useQuery({
        queryKey: ['sizes'],
        queryFn: () => sizeAPI.getSizes(),
    });

    const {
        data: colorsResponse,
        isLoading: isLoadingColors,
    } = useQuery({
        queryKey: ['colors'],
        queryFn: () => colorAPI.getColors(),
    });

    const categories = categoriesResponse?.data || [];
    const brands = brandsResponse?.data || [];
    const sizes = sizesResponse?.data || [];
    const colors = colorsResponse?.data || [];

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

    // Handle variant changes
    const handleVariantChange = (index: number, field: keyof ProductVariant, value: string | number) => {
        const updatedVariants = [...variants];
        updatedVariants[index] = {
            ...updatedVariants[index],
            [field]: typeof value === 'string' && field !== 'sku' && !isNaN(Number(value))
                ? Number(value)
                : value
        };
        setVariants(updatedVariants);
    };

    // Add a new variant
    const addVariant = () => {
        setVariants([...variants, { size: '', color: '', sku: '', stock: 0, additionalPrice: 0 }]);
    };

    // Remove a variant
    const removeVariant = (index: number) => {
        const updatedVariants = [...variants];
        updatedVariants.splice(index, 1);
        setVariants(updatedVariants.length ? updatedVariants : [{ size: '', color: '', sku: '', stock: 0, additionalPrice: 0 }]);
    };

    // Generate SKU based on product name and variant details
    const generateSku = (index: number) => {
        const variant = variants[index];
        if (!formData.name || !variant.size || !variant.color) return;

        const productPrefix = formData.name.substring(0, 3).toUpperCase();

        // Find the size and color objects to use their values in the SKU
        const sizeObj = sizes.find(s => s._id === variant.size);
        const colorObj = colors.find(c => c._id === variant.color);

        if (!sizeObj || !colorObj) return;

        const sizeCode = sizeObj.value.substring(0, 1).toUpperCase();
        const colorCode = colorObj.name.substring(0, 3).toUpperCase();
        const randomNum = Math.floor(1000 + Math.random() * 9000);

        const sku = `${productPrefix}-${sizeCode}${colorCode}-${randomNum}`;
        handleVariantChange(index, 'sku', sku);
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

    const validateVariants = () => {
        // Filter out empty variants
        const filledVariants = variants.filter(v => v.size && v.color && v.sku);

        if (filledVariants.length === 0) {
            setError('Vui lòng thêm ít nhất một biến thể sản phẩm');
            return false;
        }

        // Check for duplicate SKUs
        const skus = new Set();
        for (const variant of filledVariants) {
            if (skus.has(variant.sku)) {
                setError('Mã SKU không được trùng lặp');
                return false;
            }
            skus.add(variant.sku);
        }

        // Check for duplicate size/color combinations
        const combinations = new Set();
        for (const variant of filledVariants) {
            const combo = `${variant.size}-${variant.color}`;
            if (combinations.has(combo)) {
                setError('Kết hợp kích thước và màu sắc không được trùng lặp');
                return false;
            }
            combinations.add(combo);
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Validate form
        if (!formData.name || !formData.description || formData.basePrice <= 0) {
            setError('Vui lòng điền đầy đủ thông tin sản phẩm');
            setIsSubmitting(false);
            return;
        }

        if (selectedFiles.length === 0) {
            setError('Vui lòng chọn ít nhất một ảnh sản phẩm');
            setIsSubmitting(false);
            return;
        }

        // Validate variants
        if (!validateVariants()) {
            setIsSubmitting(false);
            return;
        }

        try {
            // Prepare form data for API request
            const productFormData = new FormData();

            // Add text fields
            Object.entries(formData).forEach(([key, value]) => {
                productFormData.append(key, value.toString());
            });

            // Add variants - filter out empty variants and ensure they have the right data format
            const validVariants = variants.filter(v => v.size && v.color && v.sku);
            productFormData.append('variants', JSON.stringify(validVariants));

            // Add image files
            selectedFiles.forEach(file => {
                productFormData.append('images', file);
            });

            // Log form data for debugging
            // console.log('FORM DATA:');
            // console.log('Basic product info:', formData);
            // console.log('Variants:', validVariants);
            // console.log('Number of images:', selectedFiles.length);

            // For debugging, show image names
            // const imageNames = selectedFiles.map(file => file.name);
            // console.log('Image names:', imageNames);

            // Making the actual API call
            const response = await productAPI.createProductWithVariants(productFormData);

            // Navigate back to products page on success
            if (response.success) {
                navigate('/admin/products', { state: { message: 'Sản phẩm đã được tạo thành công' } });
            } else {
                setError(response.message || 'Có lỗi xảy ra khi tạo sản phẩm');
            }

        } catch (err: any) {
            console.error("API Error:", err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo sản phẩm');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingCategories || isLoadingBrands || isLoadingSizes || isLoadingColors) {
        return <div className="py-10 text-center"><LoadingSpinner size="large" /></div>;
    }

    if (isCategoriesError || isBrandsError) {
        return <AlertMessage type="error" message="Không thể tải danh mục và thương hiệu. Vui lòng thử lại sau." />;
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">Thêm sản phẩm mới</h1>
                <p className="text-sm text-gray-600 mt-1">Nhập thông tin chi tiết về sản phẩm mới</p>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                            <div className="flex items-center">
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
                    </div>

                    {/* Images Section */}
                    <div className="border-t border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Ảnh sản phẩm</h2>
                        </div>

                        <div className="p-6">
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

                            {/* Image previews */}
                            {imagePreviewUrls.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Ảnh đã chọn:</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {imagePreviewUrls.map((url, index) => (
                                            <div key={index} className="relative group">
                                                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200">
                                                    <img
                                                        src={url}
                                                        loading='lazy'
                                                        alt={`Preview ${index}`}
                                                        className="h-full w-full object-cover object-center group-hover:opacity-75"
                                                    />
                                                </div>
                                                {index === 0 && (
                                                    <div className="absolute top-0 left-0 bg-primary text-white text-xs font-bold px-2 py-1 rounded-br-md">
                                                        Ảnh chính
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-1"
                                                    onClick={() => removeImage(index)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">Ảnh đầu tiên sẽ là ảnh chính của sản phẩm.</p>
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
                                onClick={addVariant}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Thêm biến thể
                            </button>
                        </div>

                        <div className="p-6">
                            {variants.map((variant, index) => (
                                <div key={index} className="mb-6 p-4 border border-gray-200 rounded-md relative">
                                    <div className="absolute top-2 right-2">
                                        <button
                                            type="button"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => removeVariant(index)}
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
                                                value={variant.size}
                                                onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
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
                                                value={variant.color}
                                                onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
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
                                                    value={variant.sku}
                                                    onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-4 py-2.5 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                                                    onClick={() => generateSku(index)}
                                                >
                                                    Tạo
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tồn kho <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full px-4 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                                                placeholder="Số lượng"
                                                value={variant.stock}
                                                onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
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
                                                    value={variant.additionalPrice}
                                                    onChange={(e) => handleVariantChange(index, 'additionalPrice', e.target.value)}
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 sm:text-sm">₫</span>
                                                </div>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Giá bán = Giá gốc + Giá tăng thêm = {formData.basePrice + variant.additionalPrice}₫
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {variants.length === 0 && (
                                <div className="text-center py-4">
                                    <p className="text-gray-500">Chưa có biến thể nào. Nhấn "Thêm biến thể" để tạo mới.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div class="border-t border-gray-200 p-6">
                        <div class="flex justify-end space-x-3">
                            <button
                                type="button"
                                class="bg-white py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                onClick={() => navigate('/admin/products')}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                class="inline-flex justify-center py-2.5 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span class="flex items-center">
                                        <LoadingSpinner size="small" color="white" />
                                        <span class="ml-2">Đang xử lý...</span>
                                    </span>
                                ) : (
                                    'Tạo sản phẩm'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProductPage;
