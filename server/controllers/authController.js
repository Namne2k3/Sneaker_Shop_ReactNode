import User from '../models/User.js';
import { generateTokens, verifyToken } from '../utils/jwt.js';
import { validationResult } from 'express-validator';
import { badRequestResponse, createdResponse, handleError, notFoundResponse, okResponse, unauthorizedResponse, validationErrorResponse } from '../utils/response.js';

export const register = async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu đầu vào không hợp lệ',
                errors: errors.array()
            });
        }

        const { fullName, email, password, phone } = req.body;

        // Kiểm tra xem người dùng đã tồn tại chưa
        const userExists = await User.findOne({ email })
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng'
            })
        }

        // lưu user vào cơ sở dữ liệu
        const user = await User.create({
            fullName,
            email,
            password,
            phone
        })

        const { password: _, ...userWithoutPassword } = user._doc

        return createdResponse(res, "Đăng ký thành công", userWithoutPassword)

    } catch (error) {
        return handleError(res, error)
    }
}

export const login = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return validationErrorResponse(res, errors.array())
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email })
        if (!user) {
            return badRequestResponse(res, "Không tìm thấy email người dùng. Vui lòng đăng ký tài khoản!")
        }

        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return badRequestResponse(res, "Sai mật khẩu. Vui lòng thử lại!")
        }

        if (!user.isActive) {
            return badRequestResponse(res, "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt tài khoản!")
        }

        const { accessToken, refreshToken } = generateTokens({ id: user._id });
        user.refreshToken = refreshToken;

        // cập nhật user
        await user.save();

        const { password: _, refreshToken: __, ...userWithoutSensitive } = user._doc;

        return okResponse(res, "Đăng nhập thành công", {
            user: userWithoutSensitive,
            accessToken,
            refreshToken
        })

    } catch (error) {
        return handleError(res, error)
    }
}

export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return badRequestResponse(res, 'Refresh token không được cung cấp');
        }

        // Xác thực refresh token
        const decoded = verifyToken(refreshToken, 'refresh');

        const user = await User.findOne({ _id: decoded.id, refreshToken });

        if (!user) {
            return unauthorizedResponse(res, 'Refresh token không hợp lệ hoặc đã hết hạn');
        }

        const tokens = generateTokens({ id: user._id });
        user.refreshToken = tokens.refreshToken;
        await user.save();

        return okResponse(res, "Token đã được làm mới", {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        })

    } catch (error) {
        return handleError(res, error)
    }
}

export const logout = async (req, res) => {
    try {

        const { refreshToken } = req.body;
        if (!refreshToken) {
            return badRequestResponse(res, 'Refresh token không được cung cấp');
        }

        // Tìm và cập nhật người dùng, xóa refreshToken
        await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });

        return okResponse(res, "Đăng xuất thành công")

    } catch (error) {
        return handleError(res, error)
    }
}

export const getCurrentUser = async (req, res) => {
    try {
        return okResponse(res, "Lấy thông tin người dùng thành công", req.user)
    } catch (error) {
        return handleError(res, error)
    }
}
