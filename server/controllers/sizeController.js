import Size from '../models/Size.js';
import {
    okResponse,
    createdResponse,
    notFoundResponse,
    badRequestResponse,
    handleError
} from '../utils/response.js';

export const createSize = async (req, res) => {
    try {
        const { name, value, order } = req.body;

        // Check for duplicates
        const existingSize = await Size.findOne({
            $or: [{ name }, { value }]
        });

        if (existingSize) {
            return badRequestResponse(res, 'Kích cỡ với tên hoặc giá trị này đã tồn tại');
        }

        const size = await Size.create({
            name,
            value,
            order: order || 0
        });

        return createdResponse(res, 'Tạo kích cỡ thành công', size);
    } catch (error) {
        return handleError(res, error);
    }
};

export const getSizes = async (req, res) => {
    try {
        const sizes = await Size.find()
            .sort({ order: 1, value: 1 });

        return okResponse(res, 'Lấy danh sách kích cỡ thành công', sizes);
    } catch (error) {
        return handleError(res, error);
    }
};

export const getSizeById = async (req, res) => {
    try {
        const sizeId = req.params.id;

        const size = await Size.findById(sizeId);

        if (!size) {
            return notFoundResponse(res, 'Không tìm thấy kích cỡ');
        }

        return okResponse(res, 'Lấy kích cỡ thành công', size);
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateSize = async (req, res) => {
    try {
        const sizeId = req.params.id;
        const updateData = req.body;

        // Check if size exists
        const size = await Size.findById(sizeId);
        if (!size) {
            return notFoundResponse(res, 'Không tìm thấy kích cỡ');
        }

        // Check for duplicates if name or value is being updated
        if (updateData.name || updateData.value) {
            const duplicate = await Size.findOne({
                $or: [
                    { name: updateData.name || size.name },
                    { value: updateData.value || size.value }
                ],
                _id: { $ne: sizeId }
            });

            if (duplicate) {
                return badRequestResponse(res, 'Kích cỡ với tên hoặc giá trị này đã tồn tại');
            }
        }

        // Update size
        const updatedSize = await Size.findByIdAndUpdate(
            sizeId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        return okResponse(res, 'Cập nhật kích cỡ thành công', updatedSize);
    } catch (error) {
        return handleError(res, error);
    }
};

export const deleteSize = async (req, res) => {
    try {
        const sizeId = req.params.id;

        // Check if size exists
        const size = await Size.findById(sizeId);
        if (!size) {
            return notFoundResponse(res, 'Không tìm thấy kích cỡ');
        }

        // Check if size is being used by any product variants
        const ProductVariant = (await import('../models/ProductVariant.js')).default;
        const variantsUsingSize = await ProductVariant.countDocuments({ size: sizeId });

        if (variantsUsingSize > 0) {
            return badRequestResponse(
                res,
                `Không thể xóa kích cỡ này vì đang được sử dụng bởi ${variantsUsingSize} biến thể sản phẩm`
            );
        }

        // Delete size
        await Size.findByIdAndDelete(sizeId);

        return okResponse(res, 'Xóa kích cỡ thành công');
    } catch (error) {
        return handleError(res, error);
    }
};
