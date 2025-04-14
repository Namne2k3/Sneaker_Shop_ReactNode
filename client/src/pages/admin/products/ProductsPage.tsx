import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import productAPI, { ProductFilter } from '../../../services/productService';
import categoryAPI from '../../../services/categoryService';
import brandAPI from '../../../services/brandService';
import { useDebounce } from '../../../hooks/useDebounce';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import AlertMessage from '../../../components/common/AlertMessage';

const ProductsPage = () => {
    // State for filters
    const [filters, setFilters] = useState<ProductFilter>({
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'desc'
    });
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

    // Update filters when search query changes
    useEffect(() => {
        setFilters(prev => ({ ...prev, search: debouncedSearchQuery, page: 1 }));
    }, [debouncedSearchQuery]);

    // Fetch products
    const {
        data: productsResponse,
        isLoading: isLoadingProducts,
        isError: isProductError,
        error: productError,
        refetch: refetchProducts
    } = useQuery({
        queryKey: ['products', filters],
        queryFn: () => productAPI.getProducts(filters),
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

    const products = productsResponse?.data || [];
    const totalPages = productsResponse?.meta?.totalPages || 1;
    const totalProducts = productsResponse?.meta?.totalProducts || 0;
    const currentPage = productsResponse?.meta?.page || 1;
    const itemsPerPage = productsResponse?.meta?.limit || 10;

    const categories = categoriesResponse?.data || [];
    const brands = brandsResponse?.data || [];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, search: searchQuery, page: 1 }));
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsFilterOpen(false);
    };

    const handleFilterChange = (name: string, value: string | boolean | number) => {
        setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
    };

    const handleSortChange = (option: string) => {
        const [sort, order] = option.split('_');
        setFilters(prev => ({
            ...prev,
            sort: sort === 'name' ? 'name' : sort === 'price' ? 'basePrice' : 'createdAt',
            order: order as 'asc' | 'desc',
            page: 1
        }));
    };

    const resetFilters = () => {
        setFilters({
            page: 1,
            limit: 10,
            sort: 'createdAt',
            order: 'desc'
        });
        setSearchQuery('');
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedProducts(products.map(p => p._id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (id: string) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(selectedProducts.filter(productId => productId !== id));
        } else {
            setSelectedProducts([...selectedProducts, id]);
        }
    };

    const handleBulkAction = async (action: string) => {
        if (selectedProducts.length === 0) return;

        try {
            if (action === 'delete' && window.confirm('Bạn có chắc chắn muốn xóa các sản phẩm đã chọn?')) {
                await productAPI.bulkDeleteProducts(selectedProducts);
                setSelectedProducts([]);
                refetchProducts();
            } else if (action === 'activate') {
                await productAPI.bulkUpdateStatus(selectedProducts, 'active');
                refetchProducts();
            } else if (action === 'deactivate') {
                await productAPI.bulkUpdateStatus(selectedProducts, 'out_of_stock');
                refetchProducts();
            } else if (action === 'feature') {
                await productAPI.bulkUpdateFeatured(selectedProducts, true);
                refetchProducts();
            }
        } catch (error) {
            console.error('Bulk action failed:', error);
            // Show error notification
        }

        setIsActionMenuOpen(false);
    };

    const handleDeleteProduct = async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            try {
                await productAPI.deleteProduct(id);
                refetchProducts();
            } catch (error) {
                console.error('Delete failed:', error);
                // Show error notification
            }
        }
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString('vi-VN') + '₫';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        <div>
            {/* Header section with title and add button */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Quản lý sản phẩm</h1>
                    <p className="text-sm text-gray-600 mt-1">Quản lý và cập nhật thông tin sản phẩm của bạn</p>
                </div>
                <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Bộ lọc
                    </button>
                    <Link
                        to="/admin/products/import"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        Import
                    </Link>
                    <Link
                        to="/admin/products/export"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Export
                    </Link>
                    <Link
                        to="/admin/products/create"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        <svg
                            className="-ml-1 mr-2 h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Thêm sản phẩm mới
                    </Link>
                </div>
            </div>

            {/* Advanced filter panel */}
            {isFilterOpen && (
                <div className="mb-5 bg-white rounded-lg shadow-sm p-4">
                    <form onSubmit={handleFilterSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Danh mục</label>
                                <select
                                    id="category"
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                                    value={filters.category || ''}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    disabled={isLoadingCategories}
                                >
                                    <option value="">Tất cả danh mục</option>
                                    {categories.map((cat: { _id: string, name: string }) => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Thương hiệu</label>
                                <select
                                    id="brand"
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                                    value={filters.brand || ''}
                                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                                    disabled={isLoadingBrands}
                                >
                                    <option value="">Tất cả thương hiệu</option>
                                    {brands.map((brand: { _id: string, name: string }) => (
                                        <option key={brand._id} value={brand._id}>{brand.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Trạng thái</label>
                                <select
                                    id="status"
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                                    value={filters.status || ''}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="active">Đang bán</option>
                                    <option value="out_of_stock">Hết hàng</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="sort" className="block text-sm font-medium text-gray-700">Sắp xếp</label>
                                <select
                                    id="sort"
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                                    value={`${filters.sort}_${filters.order}`}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                >
                                    <option value="createdAt_desc">Mới nhất</option>
                                    <option value="createdAt_asc">Cũ nhất</option>
                                    <option value="name_asc">Tên A-Z</option>
                                    <option value="name_desc">Tên Z-A</option>
                                    <option value="basePrice_asc">Giá thấp đến cao</option>
                                    <option value="basePrice_desc">Giá cao đến thấp</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="price-range" className="block text-sm font-medium text-gray-700">Khoảng giá</label>
                                <div className="mt-1 flex rounded-md">
                                    <input
                                        type="number"
                                        name="min-price"
                                        id="min-price"
                                        className="focus:ring-primary focus:border-primary flex-1 block w-full rounded-l-md sm:text-sm border-gray-300"
                                        placeholder="Giá thấp nhất"
                                        value={filters.minPrice || ''}
                                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                    />
                                    <span className="inline-flex items-center px-3 bg-gray-50 text-gray-500 text-sm border border-l-0 border-gray-300">
                                        đến
                                    </span>
                                    <input
                                        type="number"
                                        name="max-price"
                                        id="max-price"
                                        className="focus:ring-primary focus:border-primary flex-1 block w-full rounded-r-md sm:text-sm border-gray-300"
                                        placeholder="Giá cao nhất"
                                        value={filters.maxPrice || ''}
                                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex items-end gap-2">
                                <input
                                    type="checkbox"
                                    id="featured"
                                    name="featured"
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    checked={filters.featured || false}
                                    onChange={(e) => handleFilterChange('featured', e.target.checked)}
                                />
                                <label htmlFor="featured" className="block text-sm font-medium text-gray-700">
                                    Chỉ sản phẩm nổi bật
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                onClick={resetFilters}
                            >
                                Đặt lại
                            </button>
                            <button
                                type="submit"
                                className="inline-flex justify-center px-4 py-2 text-sm font-medium bg-primary text-white border border-transparent rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                Áp dụng
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search and Bulk Actions */}
            <div className="mb-5 bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <form onSubmit={handleSearch} className="flex flex-grow gap-2">
                        <div className="flex-grow relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                id="search"
                                className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="Tìm kiếm sản phẩm theo tên, mã, danh mục..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-primary text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            Tìm kiếm
                        </button>
                    </form>

                    {/* Bulk Actions */}
                    <div className="relative">
                        <button
                            type="button"
                            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${selectedProducts.length > 0
                                ? 'border-primary text-primary hover:bg-primary hover:text-white'
                                : 'border-gray-300 text-gray-400 cursor-not-allowed'
                                }`}
                            onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                            disabled={selectedProducts.length === 0}
                        >
                            Hành động ({selectedProducts.length})
                            <svg className="ml-2 -mr-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isActionMenuOpen && selectedProducts.length > 0 && (
                            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                    <button
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => handleBulkAction('activate')}
                                    >
                                        Kích hoạt
                                    </button>
                                    <button
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => handleBulkAction('deactivate')}
                                    >
                                        Vô hiệu hóa
                                    </button>
                                    <button
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => handleBulkAction('feature')}
                                    >
                                        Đánh dấu nổi bật
                                    </button>
                                    <button
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                        onClick={() => handleBulkAction('delete')}
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Error State */}
            {isProductError && (
                <AlertMessage
                    type="error"
                    message={(productError as Error)?.message || 'Có lỗi xảy ra khi tải dữ liệu sản phẩm'}
                />
            )}

            {/* Product List */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-3 py-3 text-left">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                            checked={selectedProducts.length === products.length && products.length > 0}
                                            onChange={handleSelectAll}
                                            disabled={isLoadingProducts || products.length === 0}
                                        />
                                    </div>
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sản phẩm
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Danh mục/Thương hiệu
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Giá
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trạng thái
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày tạo
                                </th>
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoadingProducts ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center">
                                        <LoadingSpinner />
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center">
                                        <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="px-3 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                    checked={selectedProducts.includes(product._id)}
                                                    onChange={() => handleSelectProduct(product._id)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img loading='lazy' className="h-10 w-10 rounded-md object-cover" src={product.thumbnail} alt={product.name} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {product.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">SKU: #{product._id.substring(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{product.category.name}</div>
                                            <div className="text-sm text-gray-500">{product.brand.name}</div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">
                                                {formatPrice(product.basePrice)}
                                            </div>
                                            {product.salePrice > 0 && (
                                                <div className="text-xs text-red-500">
                                                    {formatPrice(product.salePrice)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                            >
                                                {product.status === 'active' ? 'Đang bán' : 'Hết hàng'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(product.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link to={`/admin/products/${product._id}`} className="text-primary hover:text-primary-dark mr-3">
                                                Xem
                                            </Link>
                                            <Link to={`/admin/products/${product.slug}/edit`} className="text-primary hover:text-primary-dark mr-3">
                                                Sửa
                                            </Link>
                                            <button
                                                className="text-red-600 hover:text-red-900"
                                                onClick={() => handleDeleteProduct(product._id)}
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoadingProducts && totalPages > 0 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Hiển thị <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> đến{' '}
                                    <span className="font-medium">
                                        {Math.min(currentPage * itemsPerPage, totalProducts)}
                                    </span> của{' '}
                                    <span className="font-medium">{totalProducts}</span> kết quả
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="sr-only">Trước</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                                                ? 'z-10 bg-primary border-primary text-white'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="sr-only">Sau</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsPage;
