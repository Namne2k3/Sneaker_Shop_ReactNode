import Product from '../models/Product.js';
import ProductVariant from '../models/ProductVariant.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import mongoose from 'mongoose';
import { uploadFile, uploadMultipleFiles } from '../services/cdnService.js';
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
            features,
            brand,
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

        if (req.files.length > 0) {
            const galleryUrls = await uploadMultipleFiles(req.files, 'products');
            if (!galleryUrls) {
                return badRequestResponse(res, 'Tải ảnh lên thất bại');
            }

            // Create product images array with the first one marked as primary
            const productImages = galleryUrls.map((url, index) => ({
                imagePath: url,
                isPrimary: index === 0 // First image is primary
            }));

            const product = await Product.create({
                name,
                description,
                basePrice,
                category,
                brand,
                features: features || [],
                images: productImages,
                status: status || 'active'
            });

            return createdResponse(res, 'Tạo sản phẩm thành công', product);
        } else {
            return badRequestResponse(res, 'Không có ảnh nào được tải lên');
        }
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
            category, // Now expecting category slug
            brand,    // Now expecting brand slug
            categories, // Array of category slugs
            brands,     // Array of brand slugs
            minPrice,
            maxPrice,
            featured,
            status,
            search,
            inStock = false
        } = req.query;

        // Build filter object
        const filter = {};

        // Handle category filter by slug instead of ID
        if (category) {
            // Find the category by slug first
            const categoryObj = await Category.findOne({ slug: category });
            if (categoryObj) {
                filter.category = categoryObj._id;
            } else {
                // If no matching category, return empty result (no error)
                return okResponse(res, 'Lấy danh sách sản phẩm thành công', [], {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: 0,
                    totalProducts: 0
                });
            }
        } else if (categories) {
            // Handle comma-separated list of category slugs
            const categoryArray = categories.split(',');
            if (categoryArray.length > 0) {
                // Find all categories by their slugs
                const categoryObjects = await Category.find({
                    slug: { $in: categoryArray }
                });

                if (categoryObjects.length > 0) {
                    const categoryIds = categoryObjects.map(cat => cat._id);
                    filter.category = { $in: categoryIds };
                } else {
                    // If no matching categories, return empty result
                    return okResponse(res, 'Lấy danh sách sản phẩm thành công', [], {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: 0,
                        totalProducts: 0
                    });
                }
            }
        }

        // Handle brand filter by slug instead of ID
        if (brand) {
            // Find the brand by slug first
            const brandObj = await Brand.findOne({ slug: brand });
            if (brandObj) {
                filter.brand = brandObj._id;
            } else {
                // If no matching brand, return empty result (no error)
                return okResponse(res, 'Lấy danh sách sản phẩm thành công', [], {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: 0,
                    totalProducts: 0
                });
            }
        } else if (brands) {
            // Handle comma-separated list of brand slugs
            const brandArray = brands.split(',');
            if (brandArray.length > 0) {
                // Find all brands by their slugs
                const brandObjects = await Brand.find({
                    slug: { $in: brandArray }
                });

                if (brandObjects.length > 0) {
                    const brandIds = brandObjects.map(b => b._id);
                    filter.brand = { $in: brandIds };
                } else {
                    // If no matching brands, return empty result
                    return okResponse(res, 'Lấy danh sách sản phẩm thành công', [], {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: 0,
                        totalProducts: 0
                    });
                }
            }
        }

        // Handle other filters
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
                { features: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Prepare sort object
        const sortOption = {};
        sortOption[sort] = order === 'asc' ? 1 : -1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Find products with variants info if inStock is true
        let query = Product.find(filter)
            .populate('category', 'name slug')  // Include slug in populated fields
            .populate('brand', 'name slug')     // Include slug in populated fields
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        // Get products
        const products = await query.exec();

        // Transform products to include primary image
        const transformedProducts = products.map(product => {
            const productObj = product.toObject();
            return {
                ...productObj,
                thumbnail: product.primaryImage
            };
        });

        // If inStock parameter is set, we need to check inventory
        if (inStock === 'true') {
            // For each product, get variants and check if any has stock
            const productsWithStock = await Promise.all(
                transformedProducts.map(async (product) => {
                    const variants = await ProductVariant.find({
                        product: product._id,
                        stock: { $gt: 0 },
                        status: 'active'
                    });

                    // If this product has at least one variant with stock, include it
                    if (variants.length > 0) {
                        return {
                            ...product,
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

        return okResponse(res, 'Lấy danh sách sản phẩm thành công', transformedProducts, {
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
        if (product.viewCount !== undefined) {
            product.viewCount += 1;
            await product.save();
        }

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
            .select('name slug images basePrice');

        // Transform related products to include thumbnails
        const transformedRelatedProducts = relatedProducts.map(relatedProduct => {
            const productObj = relatedProduct.toObject();
            return {
                ...productObj,
                thumbnail: relatedProduct.primaryImage
            };
        });

        // Return the product with variants and related products
        return okResponse(res, 'Lấy sản phẩm thành công', {
            ...product.toObject(),
            variants,
            relatedProducts: transformedRelatedProducts
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
        if (product.viewCount !== undefined) {
            product.viewCount += 1;
            await product.save();
        }

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
            .select('name slug images basePrice');

        // Transform related products to include thumbnails
        const transformedRelatedProducts = relatedProducts.map(relatedProduct => {
            const productObj = relatedProduct.toObject();
            return {
                ...productObj,
                thumbnail: relatedProduct.primaryImage
            };
        });

        // Return the product with variants and related products
        return okResponse(res, 'Lấy sản phẩm thành công', {
            ...product.toObject(),
            variants,
            relatedProducts: transformedRelatedProducts
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

        // Handle image upload if there are new files
        if (req.files && req.files.length > 0) {
            const galleryUrls = await uploadMultipleFiles(req.files, 'products');

            if (galleryUrls) {
                // Create new product images array with existing images
                const newImages = galleryUrls.map(url => ({
                    imagePath: url,
                    isPrimary: false // New images are not primary by default
                }));

                // Combine with existing images or replace if specified
                if (updateData.replaceImages === 'true') {
                    updateData.images = newImages;
                    // Make first image primary if there are no existing images
                    if (newImages.length > 0) {
                        newImages[0].isPrimary = true;
                    }
                } else {
                    updateData.images = [...(product.images || []), ...newImages];
                }
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
        console.log("Check req >>> ", req.body)
        const { id: productId } = req.params;
        const { size, color, sku, additionalPrice, stock } = req.body;

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
            additionalPrice: additionalPrice || 0,
            stock,
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

// New function to get all variants for a product
export const getProductVariants = async (req, res) => {
    try {
        const { id: productId } = req.params;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return notFoundResponse(res, 'Không tìm thấy sản phẩm');
        }

        // Get all variants for this product
        const variants = await ProductVariant.find({ product: productId })
            .populate('size', 'name value')
            .populate('color', 'name code')
            .sort({ 'size.value': 1, 'color.name': 1 });

        // Calculate availability and stock status
        const variantsWithInfo = variants.map(variant => {
            const variantObj = variant.toObject();
            return {
                ...variantObj,
                inStock: variant.stock > 0,
                stockStatus: variant.stock > 10 ? 'Còn nhiều' : variant.stock > 0 ? 'Sắp hết' : 'Hết hàng'
            };
        });

        return okResponse(res, 'Lấy danh sách biến thể sản phẩm thành công', variantsWithInfo);
    } catch (error) {
        return handleError(res, error);
    }
};

// Function to get all available sizes for a product
export const getProductSizes = async (req, res) => {
    try {
        const { id: productId } = req.params;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return notFoundResponse(res, 'Không tìm thấy sản phẩm');
        }

        // Get all variants for this product and extract unique sizes
        const variants = await ProductVariant.find({
            product: productId,
            stock: { $gt: 0 },  // Only consider variants with stock
            status: 'active'
        }).populate('size', 'name value');

        // Extract unique sizes from variants
        const sizes = [];
        const sizeIds = new Set();

        variants.forEach(variant => {
            const sizeId = variant.size._id.toString();
            if (!sizeIds.has(sizeId)) {
                sizeIds.add(sizeId);
                sizes.push({
                    _id: variant.size._id,
                    name: variant.size.name,
                    value: variant.size.value
                });
            }
        });

        // Sort sizes by value
        sizes.sort((a, b) => {
            // Try to parse as numbers first
            const aNum = parseFloat(a.value);
            const bNum = parseFloat(b.value);

            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }

            // Fall back to string comparison
            return a.value.localeCompare(b.value);
        });

        return okResponse(res, 'Lấy danh sách kích cỡ thành công', sizes);
    } catch (error) {
        return handleError(res, error);
    }
};

// Function to get all available colors for a product
export const getProductColors = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { sizeId } = req.query;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return notFoundResponse(res, 'Không tìm thấy sản phẩm');
        }

        // Build filter to get variants
        const filter = {
            product: productId,
            stock: { $gt: 0 },
            status: 'active'
        };

        // If size is specified, filter by size
        if (sizeId) {
            filter.size = sizeId;
        }

        // Get variants matching the filter
        const variants = await ProductVariant.find(filter)
            .populate('color', 'name code');

        // Extract unique colors from variants
        const colors = [];
        const colorIds = new Set();

        variants.forEach(variant => {
            const colorId = variant.color._id.toString();
            if (!colorIds.has(colorId)) {
                colorIds.add(colorId);
                colors.push({
                    _id: variant.color._id,
                    name: variant.color.name,
                    code: variant.color.code
                });
            }
        });

        // Sort colors by name
        colors.sort((a, b) => a.name.localeCompare(b.name));

        return okResponse(res, 'Lấy danh sách màu thành công', colors);
    } catch (error) {
        return handleError(res, error);
    }
};

// Function to find a specific variant by product, size and color
export const findProductVariant = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { sizeId, colorId } = req.query;

        if (!sizeId || !colorId) {
            return badRequestResponse(res, 'Vui lòng cung cấp cả size và màu sắc');
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return notFoundResponse(res, 'Không tìm thấy sản phẩm');
        }

        // Find the specific variant
        const variant = await ProductVariant.findOne({
            product: productId,
            size: sizeId,
            color: colorId
        })
            .populate('size', 'name value')
            .populate('color', 'name code');

        if (!variant) {
            return notFoundResponse(res, 'Không tìm thấy biến thể sản phẩm với kích cỡ và màu sắc này');
        }

        // Include variant info
        const variantWithInfo = {
            ...variant.toObject(),
            inStock: variant.stock > 0,
            stockStatus: variant.stock > 10 ? 'Còn nhiều' : variant.stock > 0 ? 'Sắp hết' : 'Hết hàng',
            finalPrice: product.basePrice + variant.additionalPrice
        };

        return okResponse(res, 'Tìm thấy biến thể sản phẩm', variantWithInfo);
    } catch (error) {
        return handleError(res, error);
    }
};

// Enhanced version of createProductVariant that handles batch creation
export const createProductVariants = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { variants } = req.body;

        // Check if we received an array of variants
        if (!Array.isArray(variants) || variants.length === 0) {
            return badRequestResponse(res, 'Vui lòng cung cấp ít nhất một biến thể sản phẩm');
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return notFoundResponse(res, 'Không tìm thấy sản phẩm');
        }

        // Process each variant
        const createdVariants = [];
        const errors = [];

        for (const variant of variants) {
            const { size, color, sku, additionalPrice = 0, stock = 0 } = variant;

            try {
                // Check for duplicate variant
                const existingVariant = await ProductVariant.findOne({
                    product: productId,
                    size,
                    color
                });

                if (existingVariant) {
                    errors.push(`Biến thể với size và màu này đã tồn tại: ${sku}`);
                    continue;
                }

                // Check for duplicate SKU
                const skuExists = await ProductVariant.findOne({ sku });
                if (skuExists) {
                    errors.push(`SKU đã tồn tại: ${sku}`);
                    continue;
                }

                // Create the variant
                const newVariant = await ProductVariant.create({
                    product: productId,
                    size,
                    color,
                    sku,
                    additionalPrice,
                    stock,
                    status: stock > 0 ? 'active' : 'out_of_stock'
                });

                const populatedVariant = await ProductVariant.findById(newVariant._id)
                    .populate('size', 'name value')
                    .populate('color', 'name code');

                createdVariants.push(populatedVariant);
            } catch (error) {
                errors.push(`Lỗi khi tạo biến thể ${sku}: ${error.message}`);
            }
        }

        // Return appropriate response based on results
        if (createdVariants.length > 0) {
            return createdResponse(res, `Đã tạo ${createdVariants.length} biến thể sản phẩm${errors.length > 0 ? ' (có lỗi)' : ''}`, {
                variants: createdVariants,
                errors: errors.length > 0 ? errors : undefined
            });
        } else {
            return badRequestResponse(res, 'Không thể tạo biến thể sản phẩm', errors);
        }
    } catch (error) {
        return handleError(res, error);
    }
};

// Bulk update stock for multiple variants
export const updateVariantsStock = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { updates } = req.body;

        // Check if we received an array of updates
        if (!Array.isArray(updates) || updates.length === 0) {
            return badRequestResponse(res, 'Vui lòng cung cấp ít nhất một cập nhật tồn kho');
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return notFoundResponse(res, 'Không tìm thấy sản phẩm');
        }

        const updatedVariants = [];
        const errors = [];

        // Process each update
        for (const update of updates) {
            const { variantId, stock } = update;

            try {
                if (stock < 0) {
                    errors.push(`Tồn kho không thể âm cho biến thể: ${variantId}`);
                    continue;
                }

                // Find and update the variant
                const variant = await ProductVariant.findOneAndUpdate(
                    { _id: variantId, product: productId },
                    {
                        $set: {
                            stock,
                            status: stock > 0 ? 'active' : 'out_of_stock'
                        }
                    },
                    { new: true, runValidators: true }
                );

                if (!variant) {
                    errors.push(`Không tìm thấy biến thể: ${variantId}`);
                    continue;
                }

                updatedVariants.push(variant);
            } catch (error) {
                errors.push(`Lỗi khi cập nhật biến thể ${variantId}: ${error.message}`);
            }
        }

        // Return appropriate response
        if (updatedVariants.length > 0) {
            return okResponse(res, `Đã cập nhật ${updatedVariants.length} biến thể sản phẩm${errors.length > 0 ? ' (có lỗi)' : ''}`, {
                variants: updatedVariants,
                errors: errors.length > 0 ? errors : undefined
            });
        } else {
            return badRequestResponse(res, 'Không thể cập nhật biến thể sản phẩm', errors);
        }
    } catch (error) {
        return handleError(res, error);
    }
};

// New function to create a product with its variants in a single request
export const createProductWithVariants = async (req, res) => {
    try {
        const {
            name,
            description,
            features,
            basePrice,
            salePrice,
            category,
            brand,
            status,
            featured,
            variants = []
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

        // Process without transactions
        if (req.files && req.files.length > 0) {
            const galleryUrls = await uploadMultipleFiles(req.files, 'products');
            if (!galleryUrls) {
                return badRequestResponse(res, 'Tải ảnh lên thất bại');
            }

            // Create product images array with the first one marked as primary
            const productImages = galleryUrls.map((url, index) => ({
                imagePath: url,
                isPrimary: index === 0 // First image is primary
            }));

            // Create the product
            const createdProduct = await Product.create({
                name,
                description,
                basePrice,
                category,
                brand,
                featured: featured === 'true' || featured === true,
                salePrice: salePrice || basePrice,
                features: features || '',
                images: productImages,
                status: status || 'active'
            });

            // Check if variants were provided
            if (variants && variants.length > 0) {
                const createdVariants = [];
                const variantErrors = [];

                // Process variants sequentially
                const variantsArray = Array.isArray(variants) ? variants : JSON.parse(variants);

                // Log variants data for debugging
                console.log("Processing variants:", variantsArray);

                for (const variant of variantsArray) {
                    try {
                        const { size, color, sku, additionalPrice = 0, stock = 0 } = variant;

                        // Check for valid MongoDB ObjectIds for size and color
                        if (!mongoose.Types.ObjectId.isValid(size) || !mongoose.Types.ObjectId.isValid(color)) {
                            variantErrors.push(`SKU ${sku}: Size hoặc màu sắc không hợp lệ. Cần cung cấp ID hợp lệ.`);
                            continue;
                        }

                        // Check for duplicate SKU
                        const skuExists = await ProductVariant.findOne({ sku });
                        if (skuExists) {
                            variantErrors.push(`SKU đã tồn tại: ${sku}`);
                            continue;
                        }

                        // Create the variant with proper ObjectId casting
                        const newVariant = await ProductVariant.create({
                            product: createdProduct._id,
                            size: new mongoose.Types.ObjectId(size),
                            color: new mongoose.Types.ObjectId(color),
                            sku,
                            additionalPrice: Number(additionalPrice) || 0,
                            stock: Number(stock) || 0,
                            status: (Number(stock) > 0) ? 'active' : 'out_of_stock'
                        });

                        createdVariants.push(newVariant);
                    } catch (error) {
                        console.error("Variant creation error:", error);
                        variantErrors.push(`Lỗi khi tạo biến thể ${variant?.sku || 'không xác định'}: ${error.message}`);
                    }
                }

                // Populate product with variants
                const populatedProduct = await Product.findById(createdProduct._id);

                // Get populated variants
                const populatedVariants = await ProductVariant.find({ product: createdProduct._id })
                    .populate('size', 'name value')
                    .populate('color', 'name code');

                return createdResponse(res, 'Tạo sản phẩm và biến thể thành công', {
                    product: populatedProduct,
                    variants: populatedVariants,
                    variantErrors: variantErrors.length > 0 ? variantErrors : undefined
                });
            } else {
                // No variants provided, just return the product
                return createdResponse(res, 'Tạo sản phẩm thành công', createdProduct);
            }
        } else {
            return badRequestResponse(res, 'Không có ảnh nào được tải lên');
        }
    } catch (error) {
        console.error('Error in createProductWithVariants:', error);
        return handleError(res, error);
    }
};

// Soft delete a product by changing its status to "inactive"
export const softDeleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return notFoundResponse(res, 'Không tìm thấy sản phẩm');
        }

        // Update the product status to inactive
        product.status = 'inactive';
        await product.save();

        // Also set all variants to inactive
        await ProductVariant.updateMany(
            { product: productId },
            { $set: { status: 'inactive' } }
        );

        return okResponse(res, 'Sản phẩm đã được ẩn thành công');
    } catch (error) {
        return handleError(res, error);
    }
};

// Function to get a specific product variant by ID
export const getProductVariantById = async (req, res) => {
    try {
        const variantId = req.params.id;

        const variant = await ProductVariant.findById(variantId)
            .populate('size', 'name value')
            .populate('color', 'name code');

        if (!variant) {
            return notFoundResponse(res, 'Không tìm thấy biến thể sản phẩm');
        }

        return okResponse(res, 'Lấy thông tin biến thể thành công', variant);
    } catch (error) {
        return handleError(res, error);
    }
};
