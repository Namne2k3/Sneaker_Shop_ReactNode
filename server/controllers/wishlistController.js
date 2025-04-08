import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import {
    okResponse,
    createdResponse,
    notFoundResponse,
    badRequestResponse,
    handleError
} from '../utils/response.js';

// Get current user's wishlist
export const getUserWishlist = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find wishlist and populate product details
        let wishlist = await Wishlist.findOne({ user: userId })
            .populate({
                path: 'products.product',
                select: 'name slug images basePrice salePrice status brand category'
            })
            .populate({
                path: 'products.variant',
                select: 'size color stock price sku additionalPrice'
            });

        // If wishlist doesn't exist, create an empty one
        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: userId,
                products: []
            });
        }

        return okResponse(res, 'Lấy giỏ hàng thành công', wishlist);
    } catch (error) {
        return handleError(res, error);
    }
};

// Add product to wishlist or increase quantity if already exists
export const addToWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, variantId, quantity = 1 } = req.body;

        // Validate product exists
        const product = await Product.findById(productId);
        if (!product) {
            return notFoundResponse(res, 'Sản phẩm không tồn tại');
        }

        // Validate variant if provided
        if (variantId) {
            const variant = await ProductVariant.findById(variantId);
            if (!variant) {
                return notFoundResponse(res, 'Biến thể sản phẩm không tồn tại');
            }

            // kiểm tra xem biến thể này có thuộc sản phẩm hay không
            if (variant.product.toString() !== productId) {
                return badRequestResponse(res, 'Biến thể không thuộc về sản phẩm này');
            }

            if (variant.stock < quantity) {
                return badRequestResponse(res, 'Số lượng sản phẩm vượt quá số lượng tồn kho');
            }
        }

        // vì một wishlist chứa thông tin của user và nhiều sản phẩm của user đó
        // nên nếu user đó chưa có wishlist thì tạo mới một wishlist chứa thông tin của user đó
        // khi thêm sản phẩm thì chỉ cần tìm wishlist chứa user đó và thêm sản phẩm vào trong wishlist đó
        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: userId,
                products: [{
                    product: productId,
                    variant: variantId || null,
                    quantity: parseInt(quantity)
                }]
            });
        } else {
            // Check if product (with same variant if applicable) already in wishlist
            const existingProductIndex = wishlist.products.findIndex(item =>
                item.product.toString() === productId &&
                ((variantId && item.variant && item.variant.toString() === variantId) ||
                    (!variantId && !item.variant))
            );

            if (existingProductIndex > -1) {
                // Product exists, increase quantity
                wishlist.products[existingProductIndex].quantity += parseInt(quantity);
            } else {
                // Product doesn't exist, add new item
                wishlist.products.push({
                    product: productId,
                    variant: variantId || null,
                    quantity: parseInt(quantity)
                });
            }

            await wishlist.save();
        }

        // Get updated wishlist with populated products
        const updatedWishlist = await Wishlist.findById(wishlist._id)
            .populate({
                path: 'products.product',
                select: 'name slug images basePrice discountPrice status brand category'
            })
            .populate({
                path: 'products.variant',
                select: 'size color stock price sku'
            });

        return createdResponse(res, 'Thêm sản phẩm vào giỏ hàng thành công', updatedWishlist);
    } catch (error) {
        return handleError(res, error);
    }
};

// Update product quantity in wishlist
export const updateWishlistItemQuantity = async (req, res) => {
    try {
        const userId = req.user._id;
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return badRequestResponse(res, 'Số lượng phải lớn hơn 0');
        }

        // Find wishlist
        const wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            return notFoundResponse(res, 'Không tìm thấy giỏ hàng');
        }

        // Find the product item in wishlist
        const productItem = wishlist.products.id(itemId);
        if (!productItem) {
            return notFoundResponse(res, 'Không tìm thấy sản phẩm trong giỏ hàng');
        }

        // If variant exists, check stock
        if (productItem.variant) {
            const variant = await ProductVariant.findById(productItem.variant);
            if (variant && variant.stock < quantity) {
                return badRequestResponse(res, 'Số lượng sản phẩm vượt quá số lượng tồn kho');
            }
        }

        // Update quantity
        productItem.quantity = parseInt(quantity);
        await wishlist.save();

        // Get updated wishlist
        const updatedWishlist = await Wishlist.findById(wishlist._id)
            .populate({
                path: 'products.product',
                select: 'name slug images basePrice discountPrice status brand category'
            })
            .populate({
                path: 'products.variant',
                select: 'size color stock price sku'
            });

        return okResponse(res, 'Cập nhật số lượng thành công', updatedWishlist);
    } catch (error) {
        return handleError(res, error);
    }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { itemId } = req.params;

        // Find wishlist
        const wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            return notFoundResponse(res, 'Không tìm thấy giỏ hàng');
        }

        // Remove the item from products array
        const initialLength = wishlist.products.length;
        wishlist.products = wishlist.products.filter(item => item._id.toString() !== itemId);

        // Check if item was found and removed
        if (wishlist.products.length === initialLength) {
            return notFoundResponse(res, 'Không tìm thấy sản phẩm trong giỏ hàng');
        }

        await wishlist.save();

        // Get updated wishlist
        const updatedWishlist = await Wishlist.findById(wishlist._id)
            .populate({
                path: 'products.product',
                select: 'name slug images basePrice discountPrice status brand category'
            })
            .populate({
                path: 'products.variant',
                select: 'size color stock price sku'
            });

        return okResponse(res, 'Xóa sản phẩm khỏi giỏ hàng thành công', updatedWishlist);
    } catch (error) {
        return handleError(res, error);
    }
};

// Clear wishlist
export const clearWishlist = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find wishlist
        const wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            return notFoundResponse(res, 'Không tìm thấy giỏ hàng');
        }

        // Clear products array
        wishlist.products = [];
        await wishlist.save();

        return okResponse(res, 'Đã xóa tất cả sản phẩm khỏi giỏ hàng', wishlist);
    } catch (error) {
        return handleError(res, error);
    }
};
