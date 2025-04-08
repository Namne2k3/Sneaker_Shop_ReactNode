import { useQueries } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner.tsx';
import ProductCard from '../../components/products/ProductCard.tsx';
import api from '../../services/api.ts';
import productAPI from '../../services/productService.ts';

export interface Product {
    _id: string;
    name: string;
    slug: string;
    basePrice: number;
    salePrice: number | null;
    thumbnail: string;
    images: Array<{ imagePath: string, isPrimary: boolean }>;
    status: string;
    category: {
        _id: string;
        name: string;
        slug: string;
    };
    brand: {
        _id: string;
        name: string;
        slug: string;
    };
}

interface Category {
    _id: string;
    name: string;
    slug: string;
    productCount?: number;
}

interface Brand {
    _id: string;
    name: string;
    slug: string;
}

const sortOptions = [
    { value: 'featured', label: 'Nổi bật' },
    { value: 'newest', label: 'Mới nhất' },
    { value: 'price_asc', label: 'Giá: Thấp đến cao' },
    { value: 'price_desc', label: 'Giá: Cao đến thấp' },
    { value: 'name_asc', label: 'Tên: A-Z' },
    { value: 'name_desc', label: 'Tên: Z-A' },
];

const ProductsClientPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Local filter state - initialized from URL once
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        searchParams.getAll('categories') || []
    );
    const [selectedBrands, setSelectedBrands] = useState<string[]>(
        searchParams.getAll('brands') || []
    );
    const [priceRange, setPriceRange] = useState<[number, number]>([
        parseInt(searchParams.get('minPrice') || '0'),
        parseInt(searchParams.get('maxPrice') || '10000000')
    ]);
    const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'featured');
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Derive this value instead of storing in state
    const isFilterApplied =
        selectedCategories.length > 0 ||
        selectedBrands.length > 0 ||
        priceRange[0] > 0 ||
        priceRange[1] < 10000000 ||
        searchParams.get('q') !== null;

    // Get search query directly from URL when needed
    const searchQuery = searchParams.get('q') || '';

    // Determine sort and order from sortOption
    const getSortParams = (option: string) => {
        switch (option) {
            case 'newest': return { sort: 'createdAt', order: 'desc' };
            case 'price_asc': return { sort: 'basePrice', order: 'asc' };
            case 'price_desc': return { sort: 'basePrice', order: 'desc' };
            case 'name_asc': return { sort: 'name', order: 'asc' };
            case 'name_desc': return { sort: 'name', order: 'desc' };
            default: return { sort: 'featured', order: 'desc' };
        }
    };

    const { sort, order } = getSortParams(sortOption);

    // Update URL when filters change - but with proper dependency tracking
    useEffect(() => {
        const params = new URLSearchParams();

        // Only add parameters that have values
        selectedCategories.forEach(cat => params.append('categories', cat));
        selectedBrands.forEach(brand => params.append('brands', brand));

        if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
        if (priceRange[1] < 10000000) params.set('maxPrice', priceRange[1].toString());
        if (searchQuery) params.set('q', searchQuery);
        if (sortOption !== 'featured') params.set('sort', sortOption);
        if (currentPage > 1) params.set('page', currentPage.toString());

        setSearchParams(params, { replace: true });
    }, [selectedCategories, selectedBrands, priceRange, sortOption, currentPage, searchQuery, setSearchParams]);

    // Fetch data with React Query
    const results = useQueries({
        queries: [
            {
                queryKey: ['products-client', {
                    categories: selectedCategories,
                    brands: selectedBrands,
                    minPrice: priceRange[0],
                    maxPrice: priceRange[1],
                    search: searchQuery,
                    sort,
                    order,
                    page: currentPage
                }],
                queryFn: async () => {
                    // Create filter object aligned with what the server expects
                    const filters = {
                        // Use 'categories' and 'brands' parameter names for arrays of slugs
                        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
                        brands: selectedBrands.length > 0 ? selectedBrands : undefined,
                        minPrice: priceRange[0] > 0 ? priceRange[0].toString() : undefined,
                        maxPrice: priceRange[1] < 10000000 ? priceRange[1].toString() : undefined,
                        search: searchQuery || undefined,
                        sort,
                        order,
                        page: currentPage,
                        limit: 12
                    };

                    const response = await productAPI.getProducts(filters);
                    return response;
                },
                staleTime: 0,
                refetchOnWindowFocus: false,
                refetchOnMount: true,
            },
            {
                queryKey: ['categories-client'],
                queryFn: async () => {
                    const response = await api.get('/categories?includeProducts=true');
                    return response.data;
                },
                staleTime: 1000 * 60 * 10, // 10 minutes
                refetchOnWindowFocus: false,
                refetchOnMount: true,
            },
            {
                queryKey: ['brands-client'],
                queryFn: async () => {
                    const response = await api.get('/brands');
                    return response.data;
                },
                staleTime: 1000 * 60 * 10, // 10 minutes
                refetchOnWindowFocus: false,
                refetchOnMount: true,
            },
        ],
    });

    const [productsResult, categoriesResult, brandsResult] = results;

    // Extract data
    const products = productsResult.data?.data || [];
    const categories = categoriesResult.data?.data || [];
    const brands = brandsResult.data?.data || [];
    const totalProducts = productsResult.data?.meta?.totalProducts || 0;
    const totalPages = productsResult.data?.meta?.totalPages || 1;
    const filteredCategories = categories.filter((cat: Category) => cat.productCount && cat.productCount > 0);
    const filteredBrands = brands.filter((brand: Brand) => brand.name);

    // Handler functions
    const handleCategoryChange = (slug: string) => {
        if (selectedCategories.includes(slug)) {
            setSelectedCategories(selectedCategories.filter(cat => cat !== slug));
        } else {
            setSelectedCategories([...selectedCategories, slug]);
        }
        setCurrentPage(1);
    };

    const handleBrandChange = (slug: string) => {
        if (selectedBrands.includes(slug)) {
            setSelectedBrands(selectedBrands.filter(b => b !== slug));
        } else {
            setSelectedBrands([...selectedBrands, slug]);
        }
        setCurrentPage(1);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSortOption(e.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Scroll to top of page
        window.scrollTo(0, 0);
    };

    const resetFilters = () => {
        setSelectedCategories([]);
        setSelectedBrands([]);
        setPriceRange([0, 10000000]);
        setCurrentPage(1);
        setSortOption('featured');
    };


    // Show loading state
    if (productsResult.isLoading || categoriesResult.isLoading || brandsResult.isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return (
        <div className="bg-white">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sản phẩm</h1>
                        <p className="text-gray-500 mt-1">
                            {totalProducts} sản phẩm{searchQuery ? ` cho "${searchQuery}"` : ''}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 w-full md:w-auto flex items-center">
                        <button
                            type="button"
                            className="mr-4 text-sm flex items-center font-medium text-gray-700 md:hidden"
                            onClick={() => setFiltersOpen(!filtersOpen)}
                        >
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                            Bộ lọc {isFilterApplied && <span className="ml-1 text-blue-600">(Đang áp dụng)</span>}
                        </button>
                        <div className="w-full md:w-auto flex items-center">
                            <label htmlFor="sort-by" className="text-sm text-gray-700 mr-2 hidden md:block">
                                Sắp xếp:
                            </label>
                            <select
                                id="sort-by"
                                name="sort-by"
                                value={sortOption}
                                onChange={handleSortChange}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="lg:grid lg:grid-cols-4 lg:gap-x-8">
                    {/* Mobile filter dialog */}
                    <div className={`fixed inset-0 flex z-40 lg:hidden ${filtersOpen ? '' : 'hidden'}`}>
                        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setFiltersOpen(false)}></div>
                        <div className="ml-auto relative max-w-xs w-full h-full bg-white shadow-xl py-4 pb-12 flex flex-col overflow-y-auto">
                            <div className="px-4 flex items-center justify-between">
                                <h2 className="text-lg font-medium text-gray-900">Bộ lọc</h2>
                                <button
                                    type="button"
                                    className="-mr-2 w-10 h-10 p-2 flex items-center justify-center text-gray-400 hover:text-gray-500"
                                    onClick={() => setFiltersOpen(false)}
                                >
                                    <span className="sr-only">Đóng menu</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Mobile filter options */}
                            <div className="mt-4 border-t border-gray-200">
                                {/* Price Range Filter */}
                                {/* <div className="px-4 py-6 border-b border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-900">Giá</h3>
                                    <div className="mt-4">
                                        <RangeSlider
                                            min={0}
                                            max={10000000}
                                            step={100000}
                                            values={priceRange}
                                            onChange={handlePriceChange}
                                        />
                                        <div className="flex justify-between mt-2 text-sm text-gray-600">
                                            <span>{formatCurrency(priceRange[0])}</span>
                                            <span>{formatCurrency(priceRange[1])}</span>
                                        </div>
                                    </div>
                                </div> */}

                                {/* Categories Filter */}
                                <div className="px-4 py-6 border-b border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-900">Danh mục</h3>
                                    <div className="mt-4 space-y-2">
                                        {filteredCategories.map((category: Category) => (
                                            <div key={category._id} className="flex items-center">
                                                <input
                                                    id={`category-${category.slug}`}
                                                    name={`category-${category.slug}`}
                                                    type="checkbox"
                                                    checked={selectedCategories.includes(category.slug)}
                                                    onChange={() => handleCategoryChange(category.slug)}
                                                    className="h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                                                />
                                                <label
                                                    htmlFor={`category-${category.slug}`}
                                                    className="ml-3 text-sm text-gray-600"
                                                >
                                                    {category.name}
                                                    {category.productCount && (
                                                        <span className="ml-1 text-gray-400">({category.productCount})</span>
                                                    )}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Brands Filter */}
                                <div className="px-4 py-6 border-b border-gray-200">
                                    <h3 className="text-sm font-medium text-gray-900">Thương hiệu</h3>
                                    <div className="mt-4 space-y-2">
                                        {filteredBrands.map((brand: Brand) => (
                                            <div key={brand._id} className="flex items-center">
                                                <input
                                                    id={`brand-${brand.slug}`}
                                                    name={`brand-${brand.slug}`}
                                                    type="checkbox"
                                                    checked={selectedBrands.includes(brand.slug)}
                                                    onChange={() => handleBrandChange(brand.slug)}
                                                    className="h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                                                />
                                                <label
                                                    htmlFor={`brand-${brand.slug}`}
                                                    className="ml-3 text-sm text-gray-600"
                                                >
                                                    {brand.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Reset Filters Button */}
                                <div className="px-4 py-6">
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Xóa bộ lọc
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop filter section */}
                    <div className="hidden lg:block">
                        <div className="space-y-6">
                            {/* Price Range Filter */}
                            {/* <div>
                                <h3 className="text-sm font-medium text-gray-900">Giá</h3>
                                <div className="mt-4">
                                    <RangeSlider
                                        min={0}
                                        max={10000000}
                                        step={100000}
                                        values={priceRange}
                                        onChange={handlePriceChange}
                                    />
                                    <div className="flex justify-between mt-2 text-sm text-gray-600">
                                        <span>{formatCurrency(priceRange[0])}</span>
                                        <span>{formatCurrency(priceRange[1])}</span>
                                    </div>
                                </div>
                            </div> */}

                            {/* Categories Filter */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Danh mục</h3>
                                <div className="mt-4 space-y-2">
                                    {filteredCategories.map((category: Category) => (
                                        <div key={category._id} className="flex items-center">
                                            <input
                                                id={`desktop-category-${category.slug}`}
                                                name={`desktop-category-${category.slug}`}
                                                type="checkbox"
                                                checked={selectedCategories.includes(category.slug)}
                                                onChange={() => handleCategoryChange(category.slug)}
                                                className="h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <label
                                                htmlFor={`desktop-category-${category.slug}`}
                                                className="ml-3 text-sm text-gray-600"
                                            >
                                                {category.name}
                                                {category.productCount && (
                                                    <span className="ml-1 text-gray-400">({category.productCount})</span>
                                                )}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Brands Filter */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-900">Thương hiệu</h3>
                                <div className="mt-4 space-y-2">
                                    {filteredBrands.map((brand: Brand) => (
                                        <div key={brand._id} className="flex items-center">
                                            <input
                                                id={`desktop-brand-${brand.slug}`}
                                                name={`desktop-brand-${brand.slug}`}
                                                type="checkbox"
                                                checked={selectedBrands.includes(brand.slug)}
                                                onChange={() => handleBrandChange(brand.slug)}
                                                className="h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <label
                                                htmlFor={`desktop-brand-${brand.slug}`}
                                                className="ml-3 text-sm text-gray-600"
                                            >
                                                {brand.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reset Filters Button */}
                            {isFilterApplied && (
                                <div>
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Xóa bộ lọc
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product grid */}
                    <div className="mt-6 lg:mt-0 lg:col-span-3">
                        {products.length === 0 ? (
                            <div className="flex flex-col items-center py-12 text-center">
                                <svg
                                    className="w-16 h-16 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">Không có sản phẩm nào</h3>
                                <p className="mt-1 text-gray-500">Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.</p>
                                {isFilterApplied && (
                                    <button
                                        onClick={resetFilters}
                                        className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Xóa bộ lọc
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
                                    {products.map((product) => (
                                        <ProductCard key={product._id} product={product} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="mt-8 flex justify-center">
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Phân trang">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="sr-only">Previous</span>
                                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>

                                            {/* Generate page numbers */}
                                            {[...Array(totalPages)].map((_, i) => {
                                                // Display: first, last, current, and pages around current
                                                const pageNum = i + 1;
                                                const isVisible =
                                                    pageNum === 1 ||
                                                    pageNum === totalPages ||
                                                    Math.abs(pageNum - currentPage) <= 1;

                                                if (!isVisible) {
                                                    if (pageNum === 2 || pageNum === totalPages - 1) {
                                                        // Show ellipsis but only once between gaps
                                                        return (
                                                            <span key={`ellipsis-${pageNum}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                                ...
                                                            </span>
                                                        );
                                                    }
                                                    return null;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}

                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="sr-only">Next</span>
                                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </nav>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductsClientPage;
