import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import { uploadFile } from '../services/cdnService.js';
import {
    okResponse,
    createdResponse,
    notFoundResponse,
    badRequestResponse,
    handleError
} from '../utils/response.js';

export const createBrand = async (req, res) => {
    try {
        const {
            name,
            description,
            status
        } = req.body;

        // Check if brand already exists
        const existingBrand = await Brand.findOne({ name });
        if (existingBrand) {
            return badRequestResponse(res, 'Thương hiệu với tên này đã tồn tại');
        }

        // Handle logo upload if file is provided
        let logoUrl = '';
        if (req.file) {
            logoUrl = await uploadFile(req.file.path, 'brands');
        }

        // Create new brand
        const brand = await Brand.create({
            name,
            description,
            logo: logoUrl,
            status: status || 'active'
        });

        return createdResponse(res, 'Tạo thương hiệu thành công', brand);
    } catch (error) {
        return handleError(res, error);
    }
};

export const getBrands = async (req, res) => {
    try {
        const {
            status,
            sort = 'name',
            order = 'asc'
        } = req.query;

        // Build filter object
        const filter = {};

        if (status) filter.status = status;

        // Build sort object
        const sortOption = {};
        sortOption[sort] = order === 'asc' ? 1 : -1;

        // Find brands
        const brands = await Brand.find(filter).sort(sortOption);

        return okResponse(res, 'Lấy danh sách thương hiệu thành công', brands);
    } catch (error) {
        return handleError(res, error);
    }
};

export const getBrandById = async (req, res) => {
    try {
        const { id } = req.params;
        const { includeProducts } = req.query;

        const brand = await Brand.findById(id);

        if (!brand) {
            return notFoundResponse(res, 'Không tìm thấy thương hiệu');
        }

        // If includeProducts is true, get products count for this brand
        if (includeProducts === 'true') {
            const productCount = await Product.countDocuments({
                brand: brand._id,
                status: 'active'
            });

            const products = await Product.find({
                brand: brand._id,
                status: 'active'
            })
                .select('name slug images basePrice averageRating')
                .limit(10);

            // Transform products to include thumbnails
            const transformedProducts = products.map(product => {
                const productObj = product.toObject();
                return {
                    ...productObj,
                    thumbnail: product.primaryImage
                };
            });

            return okResponse(res, 'Lấy thương hiệu thành công', {
                ...brand.toObject(),
                productCount,
                products: transformedProducts
            });
        }

        return okResponse(res, 'Lấy thương hiệu thành công', brand);
    } catch (error) {
        return handleError(res, error);
    }
};

export const getBrandBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const { includeProducts } = req.query;

        const brand = await Brand.findOne({ slug });

        if (!brand) {
            return notFoundResponse(res, 'Không tìm thấy thương hiệu');
        }

        // If includeProducts is true, get products for this brand
        if (includeProducts === 'true') {
            const productCount = await Product.countDocuments({
                brand: brand._id,
                status: 'active'
            });

            const products = await Product.find({
                brand: brand._id,
                status: 'active'
            })
                .select('name slug images basePrice averageRating')
                .limit(10);

            // Transform products to include thumbnails
            const transformedProducts = products.map(product => {
                const productObj = product.toObject();
                return {
                    ...productObj,
                    thumbnail: product.primaryImage
                };
            });

            return okResponse(res, 'Lấy thương hiệu thành công', {
                ...brand.toObject(),
                productCount,
                products: transformedProducts
            });
        }

        return okResponse(res, 'Lấy thương hiệu thành công', brand);
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Check if brand exists
        const brand = await Brand.findById(id);
        if (!brand) {
            return notFoundResponse(res, 'Không tìm thấy thương hiệu');
        }

        // Check if name is being changed and if it would create a duplicate
        if (updateData.name && updateData.name !== brand.name) {
            const existingBrand = await Brand.findOne({
                name: updateData.name,
                _id: { $ne: id }
            });

            if (existingBrand) {
                return badRequestResponse(res, 'Thương hiệu với tên này đã tồn tại');
            }
        }

        // Handle logo upload if a new file is provided
        if (req.file) {
            updateData.logo = await uploadFile(req.file.path, 'brands');
        }

        // Update the brand
        const updatedBrand = await Brand.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        return okResponse(res, 'Cập nhật thương hiệu thành công', updatedBrand);
    } catch (error) {
        return handleError(res, error);
    }
};

export const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if brand exists
        const brand = await Brand.findById(id);
        if (!brand) {
            return notFoundResponse(res, 'Không tìm thấy thương hiệu');
        }

        // Check if brand has associated products
        const productCount = await Product.countDocuments({ brand: id });
        if (productCount > 0) {
            return badRequestResponse(
                res,
                `Không thể xóa thương hiệu này vì nó có ${productCount} sản phẩm liên kết. Vui lòng di chuyển hoặc xóa các sản phẩm trước.`
            );
        }

        // Delete the brand
        await Brand.findByIdAndDelete(id);

        return okResponse(res, 'Xóa thương hiệu thành công');
    } catch (error) {
        return handleError(res, error);
    }
};
