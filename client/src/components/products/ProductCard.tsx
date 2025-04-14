import { Link } from 'react-router-dom';

interface Product {
    _id: string;
    name: string;
    slug: string;
    basePrice: number;
    salePrice: number | null;
    thumbnail: string;
    category?: {
        name: string;
    };
    brand?: {
        name: string;
    };
    status: string;
}

interface ProductCardProps {
    product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
    // Format price with Vietnamese currency
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Calculate discount percentage if there's a sale price
    const discountPercentage = () => {
        if (product.salePrice && product.basePrice > product.salePrice) {
            return Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100);
        }
        return 0;
    };

    return (
        <Link to={`/products/${product.slug}`} className="group">
            <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
                {/* Product Image with discount badge if applicable */}
                <div className="relative h-48 bg-gray-100">
                    <img
                        src={product.thumbnail || "/images/product-placeholder.png"}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/images/product-placeholder.png";
                        }}
                        loading='lazy'
                    />
                    {discountPercentage() > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            -{discountPercentage()}%
                        </div>
                    )}
                    {product.status !== 'active' && (
                        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white font-medium px-2 py-1 bg-red-500 rounded">Hết hàng</span>
                        </div>
                    )}
                </div>

                {/* Product Information */}
                <div className="p-4">
                    <h3 className="font-medium text-gray-800 mb-1 truncate">{product.name}</h3>

                    {product.category && (
                        <p className="text-gray-500 text-xs mb-2">{product.category.name}</p>
                    )}

                    <div className="flex items-center justify-between">
                        <div>
                            {/* Display sale price if available, otherwise base price */}
                            <p className="font-bold text-blue-600">
                                {formatPrice(product.salePrice || product.basePrice)}
                            </p>

                            {/* If there's a sale, show the original price with strikethrough */}
                            {product.salePrice && product.salePrice < product.basePrice && (
                                <p className="text-xs text-gray-500 line-through">
                                    {formatPrice(product.basePrice)}
                                </p>
                            )}
                        </div>

                        {/* Quick view button */}
                        <button
                            className="p-1 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500"
                            onClick={(e) => {
                                e.preventDefault();
                                // You could implement a quick view functionality here if needed
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;