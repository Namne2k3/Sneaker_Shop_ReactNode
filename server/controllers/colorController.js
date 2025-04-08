import Color from '../models/Color.js';
import {
    okResponse,
    createdResponse,
    notFoundResponse,
    badRequestResponse,
    handleError
} from '../utils/response.js';

export const createColor = async (req, res) => {
    try {
        const { name, code } = req.body;

        // Check for duplicates
        const existingColor = await Color.findOne({
            $or: [{ name }, { code }]
        });

        if (existingColor) {
            return badRequestResponse(res, 'Màu sắc với tên hoặc mã màu này đã tồn tại');
        }

        const color = await Color.create({
            name,
            code
        });

        return createdResponse(res, 'Tạo màu sắc thành công', color);
    } catch (error) {
        return handleError(res, error);
    }
};

export const getColors = async (req, res) => {
    try {
        const colors = await Color.find()
            .sort({ name: 1 });

        return okResponse(res, 'Lấy danh sách màu sắc thành công', colors);
    } catch (error) {
        return handleError(res, error);
    }
};

export const getColorById = async (req, res) => {
    try {
        const colorId = req.params.id;

        const color = await Color.findById(colorId);

        if (!color) {
            return notFoundResponse(res, 'Không tìm thấy màu sắc');
        }

        return okResponse(res, 'Lấy màu sắc thành công', color);
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateColor = async (req, res) => {
    try {
        const colorId = req.params.id;
        const updateData = req.body;

        // Check if color exists
        const color = await Color.findById(colorId);
        if (!color) {
            return notFoundResponse(res, 'Không tìm thấy màu sắc');
        }

        // Check for duplicates if name or code is being updated
        if (updateData.name || updateData.code) {
            const duplicate = await Color.findOne({
                $or: [
                    { name: updateData.name || color.name },
                    { code: updateData.code || color.code }
                ],
                _id: { $ne: colorId }
            });

            if (duplicate) {
                return badRequestResponse(res, 'Màu sắc với tên hoặc mã màu này đã tồn tại');
            }
        }

        // Update color
        const updatedColor = await Color.findByIdAndUpdate(
            colorId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        return okResponse(res, 'Cập nhật màu sắc thành công', updatedColor);
    } catch (error) {
        return handleError(res, error);
    }
};

export const deleteColor = async (req, res) => {
    try {
        const colorId = req.params.id;

        // Check if color exists
        const color = await Color.findById(colorId);
        if (!color) {
            return notFoundResponse(res, 'Không tìm thấy màu sắc');
        }

        // Check if color is being used by any product variants
        const ProductVariant = (await import('../models/ProductVariant.js')).default;
        const variantsUsingColor = await ProductVariant.countDocuments({ color: colorId });

        if (variantsUsingColor > 0) {
            return badRequestResponse(
                res,
                `Không thể xóa màu sắc này vì đang được sử dụng bởi ${variantsUsingColor} biến thể sản phẩm`
            );
        }

        // Delete color
        await Color.findByIdAndDelete(colorId);

        return okResponse(res, 'Xóa màu sắc thành công');
    } catch (error) {
        return handleError(res, error);
    }
};
