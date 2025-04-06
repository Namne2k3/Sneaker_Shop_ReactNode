export const successResponse = (res, statusCode = 200, message = 'Thành công', data = null, meta = null) => {
    const response = {
        success: true,
        message,
    };

    if (data !== null) {
        response.data = data;
    }

    if (meta !== null) {
        response.meta = meta;
    }

    return res.status(statusCode).json(response);
};

export const errorResponse = (res, statusCode = 400, message = 'Có lỗi xảy ra', errors = null) => {
    const response = {
        success: false,
        message,
    };

    if (errors !== null) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

export const okResponse = (res, message = 'Thành công', data = null, meta = null) => {
    return successResponse(res, 200, message, data, meta);
};

export const createdResponse = (res, message = 'Tạo mới thành công', data = null) => {
    return successResponse(res, 201, message, data);
};

export const badRequestResponse = (res, message = 'Yêu cầu không hợp lệ', errors = null) => {
    return errorResponse(res, 400, message, errors);
};

export const unauthorizedResponse = (res, message = 'Không có quyền truy cập', errors = null) => {
    return errorResponse(res, 401, message, errors);
};

export const forbiddenResponse = (res, message = 'Không đủ quyền để thực hiện hành động này', errors = null) => {
    return errorResponse(res, 403, message, errors);
};

export const notFoundResponse = (res, message = 'Không tìm thấy tài nguyên', errors = null) => {
    return errorResponse(res, 404, message, errors);
};

export const serverErrorResponse = (res, message = 'Lỗi máy chủ', errors = null) => {
    return errorResponse(res, 500, message, errors);
};

export const validationErrorResponse = (res, errors) => {
    return errorResponse(res, 400, 'Dữ liệu đầu vào không hợp lệ', errors);
};

export const handleError = (res, error) => {
    console.error('Error:', error);
    return serverErrorResponse(res, error.message || 'Đã xảy ra lỗi không mong muốn');
};