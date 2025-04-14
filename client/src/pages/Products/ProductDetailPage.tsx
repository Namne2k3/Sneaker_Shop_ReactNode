import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api.ts';
import LoadingSpinner from '../../components/common/LoadingSpinner.tsx';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/index.ts';
import { Product } from './ProductsClientPage.tsx';

interface ProductImage {
    _id: string;
    imagePath: string;
    isPrimary: boolean;
}

interface ProductVariant {
    _id: string;
    sku: string;
    size: {
        _id: string;
        name: string;
        value: string;
    };
    color: {
        _id: string;
        name: string;
        code: string;
    };
    stock: number;
    additionalPrice: number;
    status: string;
}
// Đây là một component đặc biệt trong trang chi tiết sản phẩm
// được thiết kế để cải thiện SEO thông qua việc triển khai Structured Data (Dữ liệu có cấu trúc)
// trong định dạng JSON-LD
// Mục tiêu:
// - Cung cấp dữ liệu có cấu trúc cho công cụ tìm kiếm
// - Khi gg và các công cụ tìm kiếm quét trang web của bạn, chúng tìm kiếm dữ liệu có cấu trúc
// để hiểu rõ hơn về nội dung. JSON-LD là một trong những định dạng phổ biến nhất cho dữ liệu có cấu trúc
// - Đoạn code tọa ra thẻ <script type="application/ld+json" /> với thông tin sản phẩm theo chuẩn Schema.org
// - Lợi ích cụ thể: 
// + Tăng tỷ lệ click (CTR): Rich Snippet nổi bật hơn trong kết quả tìm kiếm, thu hút người dùng click vào
// + Cung cấp thông tin sản phẩm chính xác: Giúp người dùng biết giá, đánh giá và tình trạng kho hàng giúp trước khi click và liên kết
// + Cải thiện xếp hạng SEO: Google ưu tiên các trang web cung cấp dữ liệu có cấu trúc rõ ràng

// Cách hoạt động
// - ProductJsonLd nhận dữ liệu sản phẩm từ parent component
// - Nó tạo một đối tượng JSON có cấu trúc theo tiêu chuẩn Schema.org
// - Sử dụng dangerouslySetInnerHTML để nhúng JSON-LD vào thẻ <script> trong trang HTML
// - Khi trang web được tải, các bot tìm kiếm sẽ đọc thông tin này nhưng nó không hiển thị cho người dùng
const ProductJsonLd = ({ product }) => {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org/",  // Định nghĩa schema
                    "@type": "Product", // Kiểu dữ liệu là sản phẩm
                    "name": product.name, // Tên sản phẩm
                    "image": product.thumbnail || product.gallery?.[0], // hình ảnh sản phẩm
                    "description": product.description, // mô tả sản phẩm
                    "brand": {
                        "@type": "Brand",
                        "name": product.brand?.name
                    },
                    "sku": product._id,
                    "offers": {
                        "@type": "Offer",
                        "url": `https://sneaker-shop-react-node.vercel.app/products/${product.slug}`,
                        "priceCurrency": "VND",
                        "price": product.salePrice || product.basePrice,
                        "availability": product.status === "active"
                            ? "https://schema.org/InStock"
                            : "https://schema.org/OutOfStock"
                    },
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": product.averageRating || 4.5,
                        "reviewCount": product.reviewCount || 10
                    }
                })
            }}
        />
    );
}

const ProductDetailClientPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const navigate = useNavigate();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    // Fetch product details
    const {
        data: productResponse,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['product-detail', slug],
        queryFn: async () => {
            const response = await api.get(`/products/slug/${slug}`);
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minute stale time
    });

    const product = productResponse?.data;
    const variants = product?.variants || [];
    const images = product?.images || [];
    const relatedProducts = product?.relatedProducts || [];

    // Add to cart mutation
    const addToCartMutation = useMutation({
        mutationFn: async (data: { productId: string; variantId?: string; quantity: number }) => {
            const response = await api.post('/wishlist/add', data);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Sản phẩm đã được thêm vào giỏ hàng thành công!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng');
        }
    });

    const handleImageClick = (imagePath: string) => {
        setSelectedImage(imagePath);
    };

    const handleVariantChange = (variantId: string) => {
        setSelectedVariant(variantId);
    };

    const incrementQuantity = () => {
        setQuantity(prev => prev + 1);
    };

    const decrementQuantity = () => {
        setQuantity(prev => (prev > 1 ? prev - 1 : 1));
    };

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            toast.info('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
            navigate('/login', { state: { from: `/products/${slug}` } });
            return;
        }

        if (variants.length > 0 && !selectedVariant) {
            toast.warning('Vui lòng chọn biến thể sản phẩm');
            return;
        }

        const productId = product._id;

        addToCartMutation.mutate({
            productId,
            variantId: selectedVariant || undefined,
            quantity
        });
    };

    // Format price with Vietnamese currency
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const getSelectedVariantPrice = () => {
        if (!selectedVariant) return product?.basePrice;

        const variant = variants.find((v: ProductVariant) => v._id === selectedVariant);
        if (variant) {
            return product.basePrice + (variant.additionalPrice || 0);
        }
        return product?.basePrice;
    };

    // Group variants by size for better selection UI
    const groupVariantsBySize = () => {
        const sizeGroups: Record<string, ProductVariant[]> = {};

        variants.forEach((variant: ProductVariant) => {
            if (!sizeGroups[variant.size._id]) {
                sizeGroups[variant.size._id] = [];
            }
            sizeGroups[variant.size._id].push(variant);
        });

        return sizeGroups;
    };

    const groupedVariants = groupVariantsBySize();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (isError || !product) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-600">
                        {(error as Error)?.message || 'Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.'}
                    </p>
                </div>
            </div>
        );
    }

    // Find the primary image or use the first one
    const primaryImage = selectedImage || images.find((img: ProductImage) => img.isPrimary)?.imagePath || images[0]?.imagePath;

    return (
        <>
            <ProductJsonLd product={product} />
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <nav className="flex mb-6" aria-label="Breadcrumb">
                    <ol itemScope itemType="https://schema.org/BreadcrumbList" className="inline-flex items-center space-x-1 md:space-x-3">
                        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" className="inline-flex items-center">
                            <Link to="/" className="text-gray-600 hover:text-gray-900">
                                <span itemProp="name">Trang chủ</span>
                            </Link>
                            <meta itemProp="position" content="1" />
                        </li>
                        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                            <div className="flex items-center">
                                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                </svg>
                                <Link itemProp="item" to="/products" className="text-gray-600 hover:text-gray-900 ml-1 md:ml-2">
                                    <span itemProp="name">Sản phẩm</span>
                                </Link>
                                <meta itemProp="position" content="2" />
                            </div>
                        </li>
                        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" aria-current="page">
                            <div className="flex items-center">
                                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                                </svg>
                                <span itemProp="name" className="text-gray-500 ml-1 md:ml-2">{product.name}</span>
                                <meta itemProp="position" content="3" />
                            </div>
                        </li>
                    </ol>
                </nav>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Product Images */}
                    <div>
                        {/* Main Image */}
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100 mb-4">
                            <img
                                src={primaryImage}
                                alt={product.name}
                                loading='lazy'
                                className="h-full w-full object-cover object-center"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://via.placeholder.com/600x600?text=No+Image";
                                }}
                            />
                        </div>

                        {/* Thumbnail Gallery */}
                        {images.length > 1 && (
                            <div className="grid grid-cols-5 gap-2">
                                {images.map((image: ProductImage, index: number) => (
                                    <div
                                        key={image._id}
                                        className={`aspect-w-1 aspect-h-1 overflow-hidden rounded-md cursor-pointer ${primaryImage === image.imagePath ? 'ring-2 ring-primary' : ''
                                            }`}
                                        onClick={() => handleImageClick(image.imagePath)}
                                    >
                                        <img
                                            loading='lazy'
                                            src={image.imagePath}
                                            alt={`${product.name} - Hình ảnh ${index + 1} - ${product.brand?.name}`}
                                            className="h-full w-full object-cover object-center"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = "https://via.placeholder.com/100x100?text=No+Image";
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

                        {/* Price Info */}
                        <div className="mb-4">
                            <p className="text-3xl font-bold text-primary">
                                {formatPrice(getSelectedVariantPrice() || product.salePrice || product.basePrice)}
                            </p>
                            {product.salePrice && product.salePrice < product.basePrice && !selectedVariant && (
                                <p className="text-gray-500 line-through">
                                    {formatPrice(product.basePrice)}
                                </p>
                            )}
                        </div>

                        {/* Category & Brand */}
                        <div className="mb-6">
                            {product.category && (
                                <p className="text-gray-600 mb-1">
                                    <span className="font-medium">Danh mục:</span> {product.category.name}
                                </p>
                            )}
                            {product.brand && (
                                <p className="text-gray-600">
                                    <span className="font-medium">Thương hiệu:</span> {product.brand.name}
                                </p>
                            )}
                        </div>

                        {/* Variant Selection */}
                        {variants.length > 0 && (
                            <div className="mb-6">
                                {/* Size Selection */}
                                <div className="mb-4">
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Kích thước:</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(groupedVariants).map(sizeId => {
                                            const firstVariant = groupedVariants[sizeId][0];
                                            return (
                                                <button
                                                    key={sizeId}
                                                    type="button"
                                                    className={`px-4 py-2 border ${selectedVariant && groupedVariants[sizeId].some(v => v._id === selectedVariant)
                                                        ? 'border-primary bg-primary-light text-primary'
                                                        : 'border-gray-300 bg-white text-gray-700'
                                                        } rounded-md focus:outline-none`}
                                                    onClick={() => {
                                                        // Select the first available variant for this size
                                                        const availableVariant = groupedVariants[sizeId].find(v => v.status === 'active');
                                                        if (availableVariant) {
                                                            handleVariantChange(availableVariant._id);
                                                        }
                                                    }}
                                                >
                                                    {firstVariant.size.name} ({firstVariant.size.value})
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Color Selection */}
                                <div className="mb-4">
                                    <h3 className="text-sm font-medium text-gray-900 mb-2">Màu sắc:</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedVariant && (
                                            // Find the size ID of the selected variant
                                            (() => {
                                                const selectedVariantObj = variants.find((v: ProductVariant) => v._id === selectedVariant);
                                                if (!selectedVariantObj) return null;

                                                const sizeId = selectedVariantObj.size._id;
                                                return groupedVariants[sizeId].map(variant => (
                                                    <button
                                                        key={variant._id}
                                                        type="button"
                                                        className={`w-10 h-10 rounded-full focus:outline-none ${variant._id === selectedVariant
                                                            ? 'ring-2 ring-offset-2 ring-primary'
                                                            : ''
                                                            } ${variant.status !== 'active' ? 'opacity-40 cursor-not-allowed' : ''}`}
                                                        style={{ backgroundColor: variant.color.code }}
                                                        onClick={() => {
                                                            if (variant.status === 'active') {
                                                                handleVariantChange(variant._id);
                                                            }
                                                        }}
                                                        disabled={variant.status !== 'active'}
                                                        title={variant.color.name}
                                                    >
                                                        <span className="sr-only">{variant.color.name}</span>
                                                    </button>
                                                ));
                                            })()
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quantity Selector */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Số lượng:</h3>
                            <div className="flex items-center">
                                <button
                                    aria-label='Giảm số lượng'
                                    className="w-10 h-10 border border-gray-300 rounded-l-md flex items-center justify-center text-gray-600 hover:bg-gray-100"
                                    onClick={decrementQuantity}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
                                    </svg>
                                </button>
                                <input
                                    type="number"
                                    className="w-16 h-10 border-t border-b border-gray-300 text-center [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                                    value={quantity}
                                    min="1"
                                    readOnly
                                />
                                <button
                                    aria-label='Tăng số lượng'
                                    className="w-10 h-10 border border-gray-300 rounded-r-md flex items-center justify-center text-gray-600 hover:bg-gray-100"
                                    onClick={incrementQuantity}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <div className="flex space-x-4 mb-6">
                            <button
                                type="button"
                                className="cursor-pointer flex-1 bg-primary text-white py-3 px-8 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-center"
                                onClick={handleAddToCart}
                                disabled={addToCartMutation.isPending || (variants.length > 0 && !selectedVariant)}
                            >
                                {addToCartMutation.isPending ? (
                                    <>
                                        <LoadingSpinner size="small" color="white" />
                                        <span className="ml-2">Đang xử lý...</span>
                                    </>
                                ) : (
                                    'Thêm vào giỏ hàng'
                                )}
                            </button>
                            {/* <button
                                type="button"
                                className="w-12 h-12 rounded-md border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                </svg>
                            </button> */}
                        </div>

                        {/* Stock Status */}
                        {selectedVariant ? (
                            <div className="mb-6">
                                <p className="text-sm">
                                    <span className="font-medium">Trạng thái: </span>
                                    <span className={`${variants.find((v: ProductVariant) => v._id === selectedVariant)?.stock ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {variants.find((v: ProductVariant) => v._id === selectedVariant)?.stock ? 'Còn hàng' : 'Hết hàng'}
                                    </span>
                                </p>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <p className="text-sm">
                                    <span className="font-medium">Trạng thái: </span>
                                    <span className={`${product.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                        {product.status === 'active' ? 'Còn hàng' : 'Hết hàng'}
                                    </span>
                                </p>
                            </div>
                        )}

                        {/* Product Description */}
                        <div className="border-t border-gray-200 pt-6 mb-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Mô tả sản phẩm</h3>
                            <div className="prose prose-sm max-w-none">
                                <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
                            </div>
                        </div>

                        {/* Product Features */}
                        {product.features && (
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Đặc điểm nổi bật</h3>
                                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                                    {product.features.split('\n').map((feature: string, index: number) => (
                                        <li key={index}>{feature}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-xl font-bold mb-6">Sản phẩm tương tự</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {relatedProducts.map((product: Product) => (
                                <Link to={`/products/${product.slug}`} key={product._id} className="group">
                                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100 mb-4">
                                        <img
                                            loading='lazy'
                                            src={product.thumbnail || product.images?.[0]?.imagePath}
                                            alt={product.name}
                                            className="h-full w-full object-cover object-center group-hover:opacity-75"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = "https://via.placeholder.com/300x300?text=No+Image";
                                            }}
                                        />
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                                    <p className="mt-1 text-sm font-medium text-primary">{formatPrice(product.salePrice || product.basePrice)}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </>
    );
};

export default ProductDetailClientPage;
