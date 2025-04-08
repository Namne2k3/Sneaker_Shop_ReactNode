import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import api from '../../services/api.ts';
import LoadingSpinner from '../../components/common/LoadingSpinner.tsx';

interface Product {
    _id: string;
    name: string;
    slug: string;
    basePrice: number;
    salePrice?: number;
    thumbnail?: string;
    category?: {
        _id: string;
        name: string;
    };
    brand?: {
        _id: string;
        name: string;
    };
    status: string;
}

interface Category {
    _id: string;
    name: string;
    slug: string;
    image: string;
    productCount?: number;
}

interface Brand {
    _id: string;
    name: string;
    slug: string;
    logo: string;
}

// API fetcher functions
const fetchCategories = async () => {
    const { data } = await api.get('/categories?includeProducts=true');
    return data.data;
};

const fetchFeaturedProducts = async () => {
    const { data } = await api.get('/products?featured=true&limit=4');
    return data.data;
};

const fetchNewProducts = async () => {
    const { data } = await api.get('/products?sort=createdAt&order=desc&limit=4');
    return data.data;
};

const fetchBrands = async () => {
    const { data } = await api.get('/brands');
    return data.data;
};

const HomePage = () => {
    // Use React Query's useQueries for parallel data fetching
    const results = useQueries({
        queries: [
            {
                queryKey: ['home-categories'],
                queryFn: fetchCategories,
                staleTime: 1000 * 60 * 5, // 5 minutes
                refetchOnWindowFocus: false,
                refetchOnMount: true
            },
            {
                queryKey: ['home-featured-products'],
                queryFn: fetchFeaturedProducts,
                staleTime: 0, // No stale time to ensure fresh data
                refetchOnWindowFocus: false,
                refetchOnMount: true
            },
            {
                queryKey: ['home-new-products'],
                queryFn: fetchNewProducts,
                staleTime: 0, // No stale time to ensure fresh data
                refetchOnWindowFocus: false,
                refetchOnMount: true
            },
            {
                queryKey: ['home-brands'],
                queryFn: fetchBrands,
                staleTime: 1000 * 60 * 5, // 5 minutes
                refetchOnWindowFocus: false,
                refetchOnMount: true
            },
        ],
    });

    // Extract data from results
    const [
        { isLoading: categoriesLoading, error: categoriesError, data: categories = [] },
        { isLoading: featuredLoading, error: featuredError, data: featuredProducts = [] },
        { isLoading: newProductsLoading, error: newProductsError, data: newProducts = [] },
        { isLoading: brandsLoading, error: brandsError, data: brands = [] },
    ] = results;

    // Check if any query is loading
    const isLoading = categoriesLoading || featuredLoading || newProductsLoading || brandsLoading;

    // Check for any errors
    const hasError = categoriesError || featuredError || newProductsError || brandsError;
    const errorMessage = hasError ? 'Không thể tải dữ liệu. Vui lòng thử lại sau!' : '';

    // Format price function
    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
            .format(price)
            .replace('₫', '') + '₫';
    };

    // Handle retry for all queries
    const handleRetry = () => {
        results.forEach((query) => {
            query.refetch();
        });
    };

    // Display loading spinner while fetching data
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <LoadingSpinner />
            </div>
        );
    }

    // Display error message if any
    if (hasError) {
        return (
            <div className="container mx-auto px-4 py-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{errorMessage}</p>
                    <button
                        onClick={handleRetry}
                        className="mt-2 bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    // Take only the first 4 categories
    const popularCategories = categories.slice(0, 4);
    // Take only the first 6 brands
    const popularBrands = brands.slice(0, 6);

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Hero Banner */}
            <div className="relative mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-96 rounded-lg overflow-hidden flex items-center">
                    <div className="container mx-auto px-6 flex flex-col md:flex-row items-center">
                        <div className="flex flex-col items-start md:w-1/2">
                            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                                Bộ Sưu Tập Giày Mới Nhất
                            </h1>
                            <p className="text-white text-lg mb-6">
                                Khám phá các xu hướng mới nhất và thiết kế đẳng cấp
                            </p>
                            <Link
                                to="/products"
                                className="bg-white text-blue-600 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition duration-300"
                            >
                                Mua sắm ngay
                            </Link>
                        </div>
                        <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center">
                            <img
                                className="w-3/4 h-auto object-contain"
                                src="/images/banner-shoes.png"
                                alt="Giày thể thao"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories Section */}
            <section className="mb-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Danh Mục Sản Phẩm</h2>
                    <Link to="/categories" className="text-blue-600 hover:text-blue-800">
                        Xem tất cả
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {popularCategories.map((category: Category) => (
                        <Link to={`/products?category=${category.slug}`} key={category._id} className="group">
                            <div className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-300">
                                <div className="relative h-40 bg-gray-100">
                                    <img
                                        src={category.image || "/images/placeholder.png"}
                                        alt={category.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                                <div className="p-4 bg-white text-center">
                                    <h3 className="font-medium text-lg">{category.name}</h3>
                                    {category.productCount !== undefined && (
                                        <p className="text-gray-500 text-sm">{category.productCount} sản phẩm</p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Featured Products Section */}
            <section className="mb-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Sản Phẩm Nổi Bật</h2>
                    <Link to="/products?featured=true" className="text-blue-600 hover:text-blue-800">
                        Xem tất cả
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {featuredProducts.map((product: Product) => (
                        <Link to={`/products/${product.slug}`} key={product._id}>
                            <div className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-300">
                                <div className="relative h-48 bg-gray-100">
                                    <img
                                        src={product.thumbnail || "/images/product-placeholder.png"}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-medium text-gray-800 mb-1 truncate">{product.name}</h3>
                                    {product.category && (
                                        <p className="text-gray-500 text-sm mb-2">{product.category.name}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-lg text-blue-600">
                                            {formatPrice(product.salePrice || product.basePrice)}
                                        </p>
                                        {product.salePrice && product.salePrice < product.basePrice && (
                                            <p className="text-sm text-gray-500 line-through">
                                                {formatPrice(product.basePrice)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Promotion Banner */}
            <section className="mb-12">
                <div className="bg-gray-100 rounded-lg p-6 md:p-8">
                    <div className="md:flex items-center justify-between">
                        <div className="md:w-2/3">
                            <h2 className="text-2xl md:text-3xl font-bold mb-4">Giảm giá đến 30% cho đơn hàng đầu tiên</h2>
                            <p className="text-gray-600 mb-6">
                                Đăng ký nhận bản tin của chúng tôi để nhận mã giảm giá độc quyền
                            </p>
                            <div className="flex flex-col md:flex-row gap-2">
                                <input
                                    type="email"
                                    placeholder="Địa chỉ email của bạn"
                                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-300">
                                    Đăng ký
                                </button>
                            </div>
                        </div>
                        <div className="hidden md:block md:w-1/3">
                            <img src="/images/discount.png" alt="Khuyến mãi" className="w-full" />
                        </div>
                    </div>
                </div>
            </section>

            {/* New Products Section */}
            <section className="mb-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Sản Phẩm Mới</h2>
                    <Link to="/products?sort=createdAt&order=desc" className="text-blue-600 hover:text-blue-800">
                        Xem tất cả
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {newProducts.map((product: Product) => (
                        <Link to={`/products/${product.slug}`} key={product._id}>
                            <div className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-300">
                                <div className="relative h-48 bg-gray-100">
                                    <img
                                        src={product.thumbnail || "/images/product-placeholder.png"}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-2 py-1">
                                        MỚI
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-medium text-gray-800 mb-1 truncate">{product.name}</h3>
                                    {product.category && (
                                        <p className="text-gray-500 text-sm mb-2">{product.category.name}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-lg text-blue-600">
                                            {formatPrice(product.salePrice || product.basePrice)}
                                        </p>
                                        {product.salePrice && (
                                            <p className="text-sm text-gray-500 line-through">
                                                {formatPrice(product.salePrice)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Brands Section */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Thương Hiệu Nổi Tiếng</h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {popularBrands.map((brand: Brand) => (
                        <Link to={`/products?brand=${brand.slug}`} key={brand._id} className="block">
                            <div className="bg-white h-24 rounded-md flex items-center justify-center p-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                                {brand.logo ? (
                                    <img
                                        src={brand.logo}
                                        alt={brand.name}
                                        className="max-h-full max-w-full opacity-80 hover:opacity-100 transition-opacity duration-300"
                                    />
                                ) : (
                                    <span className="text-center font-medium text-gray-700">{brand.name}</span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section className="mb-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex flex-col items-center text-center p-4">
                        <div className="text-blue-600 text-3xl mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">Miễn Phí Vận Chuyển</h3>
                        <p className="text-gray-600 text-sm">Cho đơn hàng trên 500.000đ</p>
                    </div>

                    <div className="flex flex-col items-center text-center p-4">
                        <div className="text-blue-600 text-3xl mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">Bảo Hành 30 Ngày</h3>
                        <p className="text-gray-600 text-sm">Đổi trả dễ dàng</p>
                    </div>

                    <div className="flex flex-col items-center text-center p-4">
                        <div className="text-blue-600 text-3xl mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">Thanh Toán An Toàn</h3>
                        <p className="text-gray-600 text-sm">Nhiều phương thức thanh toán</p>
                    </div>

                    <div className="flex flex-col items-center text-center p-4">
                        <div className="text-blue-600 text-3xl mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">Hỗ Trợ 24/7</h3>
                        <p className="text-gray-600 text-sm">Luôn sẵn sàng hỗ trợ bạn</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;