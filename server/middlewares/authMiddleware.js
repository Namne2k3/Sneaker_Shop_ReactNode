import User from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";

export const authenticate = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực'
            });
        }

        // string token = "Beader _____token"
        // splited = ["Bearder", "token"]
        const token = authHeader.split(' ')[1];

        const decoded = verifyToken(token, 'access');

        const user = await User.findById(decoded.id).select({ password: 0 }) //.select('-password')

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message || 'Token không hợp lệ hoặc đã hết hạn'
        });
    }
}

// Middleware kiểm tra quyền admin
// thường sẽ kiểm tra sau middlware authenticate()
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập tài nguyên này'
        });
    }
};