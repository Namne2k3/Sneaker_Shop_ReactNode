import User from '../models/User.js';
import bcrypt from 'bcrypt';
import { uploadFile } from '../services/cdnService.js';
import {
    okResponse,
    createdResponse,
    notFoundResponse,
    badRequestResponse,
    handleError,
    unauthorizedResponse
} from '../utils/response.js';

// Get all users (with pagination, filtering, and sorting)
export const getUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = 'createdAt',
            order = 'desc',
            search = '',
            role,
            isActive
        } = req.query;

        // Build filter object
        const filter = {};

        // Add search filter for name or email
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by role if provided
        if (role) {
            filter.role = role;
        }

        // Filter by active status if provided
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        // Prepare sort object
        const sortOption = {};
        sortOption[sort] = order === 'asc' ? 1 : -1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Query users
        const users = await User.find(filter)
            .select({ password: 0, refreshToken: 0 }) // Exclude password and refreshToken from the response
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total users count for pagination
        const totalUsers = await User.countDocuments(filter);

        return okResponse(res, 'Lấy danh sách người dùng thành công', users, {
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalUsers / parseInt(limit)),
            totalUsers
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await User.findById(userId).select('-password -refreshToken');

        if (!user) {
            return notFoundResponse(res, 'Không tìm thấy người dùng');
        }

        return okResponse(res, 'Lấy thông tin người dùng thành công', user);
    } catch (error) {
        return handleError(res, error);
    }
};

// Create new user
export const createUser = async (req, res) => {
    try {
        const {
            fullName,
            email,
            password,
            phone,
            role,
            address,
            isActive
        } = req.body;

        // Check if user with email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return badRequestResponse(res, 'Email đã được sử dụng');
        }

        // Create new user
        const newUser = await User.create({
            fullName,
            email,
            password, // Will be hashed by the pre-save hook
            phone,
            role: role || 'user',
            address,
            isActive: isActive !== undefined ? isActive : true
        });

        // Return response without password and refresh token
        const userResponse = newUser.toObject();
        delete userResponse.password;
        delete userResponse.refreshToken;

        return createdResponse(res, 'Tạo người dùng thành công', userResponse);
    } catch (error) {
        return handleError(res, error);
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
        const userId = req.params.id || req.user._id; // Use params.id for admin or user._id for self-update
        const updateData = { ...req.body };

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return notFoundResponse(res, 'Không tìm thấy người dùng');
        }

        // Handle avatar upload if file is provided
        if (req.file) {
            const avatarUrl = await uploadFile(req.file.path, 'avatars');
            if (avatarUrl) {
                updateData.avatar = avatarUrl;
            }
        }

        // Remove sensitive fields that shouldn't be updated directly
        delete updateData.password;
        delete updateData.refreshToken;

        // If it's not an admin and they're trying to change role, prevent it
        if (!req.user.isAdmin && updateData.role) {
            delete updateData.role;
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select('-password -refreshToken');

        return okResponse(res, 'Cập nhật thông tin người dùng thành công', updatedUser);
    } catch (error) {
        return handleError(res, error);
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return notFoundResponse(res, 'Không tìm thấy người dùng');
        }

        // Don't allow deletion of self
        if (userId === req.user._id.toString()) {
            return badRequestResponse(res, 'Không thể xóa tài khoản của chính mình');
        }

        // Delete the user
        await User.findByIdAndDelete(userId);

        return okResponse(res, 'Xóa người dùng thành công');
    } catch (error) {
        return handleError(res, error);
    }
};

// Change user status (active/inactive)
export const changeUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return badRequestResponse(res, 'Trạng thái không hợp lệ');
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return notFoundResponse(res, 'Không tìm thấy người dùng');
        }

        // Don't allow deactivation of self
        if (userId === req.user._id.toString() && isActive === false) {
            return badRequestResponse(res, 'Không thể vô hiệu hóa tài khoản của chính mình');
        }

        // Update user status
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { isActive },
            { new: true }
        ).select('-password -refreshToken');

        return okResponse(res, `${isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản thành công`, updatedUser);
    } catch (error) {
        return handleError(res, error);
    }
};

// Change user password
export const changeUserPassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return notFoundResponse(res, 'Không tìm thấy người dùng');
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return badRequestResponse(res, 'Mật khẩu hiện tại không đúng');
        }

        // Hash new password and update
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the password
        await User.findByIdAndUpdate(
            userId,
            { password: hashedPassword }
        );

        return okResponse(res, 'Đổi mật khẩu thành công');
    } catch (error) {
        return handleError(res, error);
    }
};

// Get user profile (for authenticated user)
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).select('-password -refreshToken');
        if (!user) {
            return notFoundResponse(res, 'Không tìm thấy thông tin người dùng');
        }

        return okResponse(res, 'Lấy thông tin cá nhân thành công', user);
    } catch (error) {
        return handleError(res, error);
    }
};
