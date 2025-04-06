import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import {
    okResponse,
    createdResponse,
    notFoundResponse,
    badRequestResponse,
    handleError
} from '../utils/response.js';

export const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            basePrice,
            category,
            brand,
            thumbnail,
            gallery,
            specifications,
            tags,
            featured,
            status
        } = req.body;

        // Check if category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return notFoundResponse(res, 'Danh mục không tồn tại');
        }

        // Check if brand exists
        const brandExists = await Brand.findById(brand);
        if (!brandExists) {
            return notFoundResponse(res, 'Thương hiệu không tồn tại');
        }

        const product = await Product.create({
            name,
            description,
            basePrice,
            category,
            brand,
            thumbnail,
            gallery: gallery || [],
            specifications: specifications || [],
            tags: tags || [],
            featured: featured || false,
            status: status || 'active'
        });

        return createdResponse(res, 'Tạo sản phẩm thành công', product);
    } catch (error) {
        return handleError(res, error);
    }
};

export const getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = 'createdAt',
            order = 'desc',
            category,
            brand,
            minPrice,
            maxPrice,
            featured,
            status,
            search,
            inStock = false
        } = req.query;

        // Build filter object
        const filter = {};

        if (category) filter.category = category;
        if (brand) filter.brand = brand;
        if (featured) filter.featured = featured === 'true';
        if (status) filter.status = status;

        // Price filter
        if (minPrice || maxPrice) {
            filter.basePrice = {};
            if (minPrice) filter.basePrice.$gte = Number(minPrice);
            if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
        }

        // Text search
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Prepare sort object
        const sortOption = {};
        sortOption[sort] = order === 'asc' ? 1 : -1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Find products with variants info if inStock is true
        let query = Product.find(filter)
            .populate('category', 'name')
            .populate('brand', 'name')
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        // Get products
        const products = await query.exec();

        // If inStock parameter is set, we need to check inventory
        if (inStock === 'true') {
            // For each product, get variants and check if any has stock
            const productsWithStock = await Promise.all(
                products.map(async (product) => {
                    const variants = await ProductVariant.find({
                        product: product._id,
                        stock: { $gt: 0 },
                        status: 'active'
                    });

                    // If this product has at least one variant with stock, include it
                    if (variants.length > 0) {
                        return {
                            ...product.toObject(),
                            hasStock: true,
                            variantsCount: variants.length
                        };
                    }
                    return null;
                })
            );

            // Filter out products with no stock
            const filteredProducts = productsWithStock.filter(p => p !== null);

            // Count total matching products with stock
            const totalProducts = await Product.countDocuments(filter);

            return okResponse(res, 'Lấy danh sách sản phẩm thành công', filteredProducts, {
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalProducts / parseInt(limit)),
                totalProducts
            });
        }

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(filter);

        return okResponse(res, 'Lấy danh sách sản phẩm thành công', products, {
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalProducts / parseInt(limit)),
            totalProducts
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const getProductById = async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await Product.findById(productId)
            .populate('category', 'name slug')
            .populate('brand', 'name slug');

        if (!product) {
            return notFoundResponse(res, 'Không tìm thấy sản phẩm');
        }

        // Increment view count
        product.viewCount += 1;
        await product.save();

        // Get variants
        const variants = await ProductVariant.find({ product: productId })
            .populate('size', 'name value')
            .populate('color', 'name code');

        // Get related products from same category
        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: productId }
        })
            .limit(4)
            .select('name slug thumbnail basePrice averageRating');

        // Return the product with variants and related products
        return okResponse(res, 'Lấy sản phẩm thành công', {
            ...product.toObject(),
            variants,
            relatedProducts
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const product = await Product.findOne({ slug })
            .populate('category', 'name slug')
            .populate('brand', 'name slug');

        if (!product) {
            return notFoundResponse(res, 'Không tìm thấy sản phẩm');
        }

        // Increment view count
        product.viewCount += 1;
        await product.save();

        // Get variants
        const variants = await ProductVariant.find({ product: product._id })
            .populate('size', 'name value')
            .populate('color', 'name code');

        // Get related products from same category
        const relatedProducts = await Product.find({
            category: product.category,
            _id: { $ne: product._id }
        })
            .limit(4)
            .select('name slug thumbnail basePrice averageRating');

        // Return the product with variants and related products
        return okResponse(res, 'Lấy sản phẩm thành công', {
            ...product.toObject(),
            variants,
            relatedProducts
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const updateData = req.body;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return notFoundResponse(res, 'Không tìm thấy sản phẩm');
        }

        // If changing category, check if new category exists
        if (updateData.category && updateData.category !== product.category.toString()) {
            const categoryExists = await Category.findById(updateData.category);
            if (!categoryExists) {
                return notFoundResponse(res, 'Danh mục không tồn tại');
            }
        }

        // If changing brand, check if new brand exists
        if (updateData.brand && updateData.brand !== product.brand.toString()) {
            const brandExists = await Brand.findById(updateData.brand);
            if (!brandExists) {
                return notFoundResponse(res, 'Thương hiệu không tồn tại');
            }
        }

        // Update the product
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        return okResponse(res, 'Cập nhật sản phẩm thành công', updatedProduct);
    } catch (error) {
        return handleError(res, error);
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return notFoundResponse(res, 'Không tìm thấy sản phẩm');
        }

        // Delete all related variants
        await ProductVariant.deleteMany({ product: productId });

        // Delete the product
        await Product.findByIdAndDelete(productId);

        return okResponse(res, 'Xóa sản phẩm thành công');
    } catch (error) {
        return handleError(res, error);
    }
};

export const createProductVariant = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { size, color, sku, price, comparePrice, stock, images } = req.body;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return notFoundResponse(res, 'Không tìm thấy sản phẩm');
        }

        // Check for duplicate variant
        const existingVariant = await ProductVariant.findOne({
            product: productId,
            size,
            color
        });

        if (existingVariant) {
            return badRequestResponse(res, 'Biến thể sản phẩm với size và màu này đã tồn tại');
        }

        // Check for duplicate SKU
        const skuExists = await ProductVariant.findOne({ sku });
        if (skuExists) {
            return badRequestResponse(res, 'SKU đã tồn tại');
        }

        // Create the variant
        const variant = await ProductVariant.create({
            product: productId,
            size,
            color,
            sku,
            price,
            comparePrice: comparePrice || price, // Set comparePrice to price if not provided
            stock,
            images: images || [],
            status: stock > 0 ? 'active' : 'out_of_stock'
        });

        const populatedVariant = await ProductVariant.findById(variant._id)
            .populate('size', 'name value')
            .populate('color', 'name code');

        return createdResponse(res, 'Tạo biến thể sản phẩm thành công', populatedVariant);
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateProductVariant = async (req, res) => {
    try {
        const { id: variantId } = req.params;
        const updateData = req.body;

        // Check if variant exists
        const variant = await ProductVariant.findById(variantId);
        if (!variant) {
            return notFoundResponse(res, 'Không tìm thấy biến thể sản phẩm');
        }

        // Check if changing SKU and if it already exists
        if (updateData.sku && updateData.sku !== variant.sku) {
            const skuExists = await ProductVariant.findOne({
                sku: updateData.sku,
                _id: { $ne: variantId }
            });

            if (skuExists) {
                return badRequestResponse(res, 'SKU đã tồn tại');
            }
        }

        // Check if changing size and color creates a duplicate variant
        if ((updateData.size || updateData.color) &&
            (updateData.size !== variant.size.toString() || updateData.color !== variant.color.toString())) {

            const existingVariant = await ProductVariant.findOne({
                product: variant.product,
                size: updateData.size || variant.size,
                color: updateData.color || variant.color,
                _id: { $ne: variantId }
            });

            if (existingVariant) {
                return badRequestResponse(res, 'Biến thể sản phẩm với size và màu này đã tồn tại');
            }
        }

        // Update the status based on stock if it's being updated
        if (updateData.stock !== undefined) {
            updateData.status = updateData.stock > 0 ? 'active' : 'out_of_stock';
        }

        // Update the variant
        const updatedVariant = await ProductVariant.findByIdAndUpdate(
            variantId,
            { $set: updateData },
            { new: true, runValidators: true }
        )
            .populate('size', 'name value')
            .populate('color', 'name code');

        return okResponse(res, 'Cập nhật biến thể sản phẩm thành công', updatedVariant);
    } catch (error) {
        return handleError(res, error);
    }
};

export const deleteProductVariant = async (req, res) => {
    try {
        const { id: variantId } = req.params;

        // Check if variant exists
        const variant = await ProductVariant.findById(variantId);
        if (!variant) {
            return notFoundResponse(res, 'Không tìm thấy biến thể sản phẩm');
        }

        // Get product to check if it has other variants
        const variantsCount = await ProductVariant.countDocuments({
            product: variant.product
        });

        if (variantsCount <= 1) {
            return badRequestResponse(
                res,
                'Không thể xóa biến thể cuối cùng của sản phẩm. Sản phẩm phải có ít nhất một biến thể.'
            );
        }

        // Delete the variant
        await ProductVariant.findByIdAndDelete(variantId);

        return okResponse(res, 'Xóa biến thể sản phẩm thành công');
    } catch (error) {
        return handleError(res, error);
    }
};
