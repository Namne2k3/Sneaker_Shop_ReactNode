import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { uploadFile } from '../services/cdnService.js';
import {
    okResponse,
    createdResponse,
    notFoundResponse,
    badRequestResponse,
    handleError
} from '../utils/response.js';


export const createCategory = async (req, res) => {
    try {

        const {
            name,
            description,
            parent
        } = req.body;

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return badRequestResponse(res, 'Danh mục với tên này đã tồn tại');
        }

        if (parent) {
            const parentCategory = await Category.findById(parent);
            if (!parentCategory) {
                return notFoundResponse(res, 'Danh mục cha không tồn tại');
            }
        }

        if (!req.file) {
            return badRequestResponse(res, 'Chưa tải lên ảnh danh mục');
        }

        const imageUrl = await uploadFile(req.file.path, 'categories');

        const category = await Category.create({
            name,
            description,
            parent: parent || null,
            image: imageUrl
        });

        return createdResponse(res, 'Tạo danh mục thành công', category);
    } catch (error) {
        return handleError(res, error);
    }
};

export const getCategories = async (req, res) => {
    try {
        const {
            parent,
            includeProducts,
            includeChildren
        } = req.query;

        // Build filter object
        const filter = {};

        // Filter by parent category or get root categories
        if (parent === 'null') {
            filter.parent = null;
        } else if (parent) {
            filter.parent = parent;
        }

        // Find categories based on filters
        let query = Category.find(filter).sort({ name: 1 });

        // Populate relationships if requested
        if (includeChildren === 'true') {
            query = query.populate({
                path: 'children',
                select: 'name slug image'
            });
        }

        const categories = await query;

        // If includeProducts is true, get product count for each category
        if (includeProducts === 'true') {
            const categoriesWithProducts = await Promise.all(
                categories.map(async (category) => {
                    const productCount = await Product.countDocuments({
                        category: category._id,
                        status: 'active'
                    });

                    return {
                        ...category.toObject(),
                        productCount
                    };
                })
            );

            return okResponse(res, 'Lấy danh sách danh mục thành công', categoriesWithProducts);
        }

        return okResponse(res, 'Lấy danh sách danh mục thành công', categories);
    } catch (error) {
        return handleError(res, error);
    }
};

export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const { includeProducts, includeChildren } = req.query;

        let query = Category.findById(id);

        // Populate relationships if requested
        if (includeChildren === 'true') {
            query = query.populate({
                path: 'children',
                select: 'name slug image',
                match: { status: 'active' }
            });
        }

        const category = await query;

        if (!category) {
            return notFoundResponse(res, 'Không tìm thấy danh mục');
        }

        // If includeProducts is true, get products in this category
        if (includeProducts === 'true') {
            const products = await Product.find({
                category: category._id,
                status: 'active'
            })
                .select('name slug thumbnail basePrice averageRating')
                .limit(10);

            return okResponse(res, 'Lấy danh mục thành công', {
                ...category.toObject(),
                products
            });
        }

        return okResponse(res, 'Lấy danh mục thành công', category);
    } catch (error) {
        return handleError(res, error);
    }
};

export const getCategoryBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const { includeProducts, includeChildren } = req.query;

        let query = Category.findOne({ slug });

        // Populate relationships if requested
        if (includeChildren === 'true') {
            query = query.populate({
                path: 'children',
                select: 'name slug image',
                match: { status: 'active' }
            });
        }

        const category = await query;

        if (!category) {
            return notFoundResponse(res, 'Không tìm thấy danh mục');
        }

        // If includeProducts is true, get products in this category
        if (includeProducts === 'true') {
            const products = await Product.find({
                category: category._id,
                status: 'active'
            })
                .select('name slug thumbnail basePrice averageRating')
                .limit(10);

            return okResponse(res, 'Lấy danh mục thành công', {
                ...category.toObject(),
                products
            });
        }

        return okResponse(res, 'Lấy danh mục thành công', category);
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Check if category exists
        const category = await Category.findById(id);
        if (!category) {
            return notFoundResponse(res, 'Không tìm thấy danh mục');
        }

        // Check if name is being changed and if it would create a duplicate
        if (updateData.name && updateData.name !== category.name) {
            const existingCategory = await Category.findOne({
                name: updateData.name,
                _id: { $ne: id }
            });

            if (existingCategory) {
                return badRequestResponse(res, 'Danh mục với tên này đã tồn tại');
            }
        }

        // If parent is updated, check if it exists and prevent circular reference
        if (updateData.parent) {
            // Check if parent exists
            const parentCategory = await Category.findById(updateData.parent);
            if (!parentCategory) {
                return notFoundResponse(res, 'Danh mục cha không tồn tại');
            }

            // Prevent setting itself as parent
            if (updateData.parent.toString() === id) {
                return badRequestResponse(res, 'Không thể đặt chính nó làm danh mục cha');
            }

            // Prevent circular references (parent can't be its own child)
            let currentParent = parentCategory;
            while (currentParent.parent) {
                if (currentParent.parent.toString() === id) {
                    return badRequestResponse(res, 'Cấu trúc phân cấp không hợp lệ - tạo vòng lặp');
                }
                currentParent = await Category.findById(currentParent.parent);
            }
        }

        // Set parent to null if explicitly provided as null
        if (updateData.parent === null) {
            updateData.parent = null;
        }

        // Update the category
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        return okResponse(res, 'Cập nhật danh mục thành công', updatedCategory);
    } catch (error) {
        return handleError(res, error);
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category exists
        const category = await Category.findById(id);
        if (!category) {
            return notFoundResponse(res, 'Không tìm thấy danh mục');
        }

        // Check if category has children
        const childrenCount = await Category.countDocuments({ parent: id });
        if (childrenCount > 0) {
            return badRequestResponse(
                res,
                'Không thể xóa danh mục này vì nó có danh mục con. Vui lòng xóa hoặc di chuyển các danh mục con trước.'
            );
        }

        // Check if category has products
        const productCount = await Product.countDocuments({ category: id });
        if (productCount > 0) {
            return badRequestResponse(
                res,
                `Không thể xóa danh mục này vì nó có ${productCount} sản phẩm liên kết. Vui lòng di chuyển hoặc xóa các sản phẩm trước.`
            );
        }

        // Delete the category
        await Category.findByIdAndDelete(id);

        return okResponse(res, 'Xóa danh mục thành công');
    } catch (error) {
        return handleError(res, error);
    }
};

export const getCategoryTree = async (req, res) => {
    try {
        // Get all categories
        const categories = await Category.find()
            .sort({ name: 1 });

        // Build the tree structure
        const rootCategories = categories.filter(c => !c.parent);

        // Function to recursively build tree
        const buildTree = (parentId) => {
            return categories
                .filter(category =>
                    category.parent && category.parent.toString() === parentId.toString()
                )
                .map(category => ({
                    _id: category._id,
                    name: category.name,
                    slug: category.slug,
                    image: category.image,
                    children: buildTree(category._id)
                }));
        };

        // Build tree starting with root categories
        const categoryTree = rootCategories.map(category => ({
            _id: category._id,
            name: category.name,
            slug: category.slug,
            image: category.image,
            children: buildTree(category._id)
        }));

        return okResponse(res, 'Lấy cây danh mục thành công', categoryTree);
    } catch (error) {
        return handleError(res, error);
    }
};
