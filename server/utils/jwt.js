import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

// Lấy secret key từ biến môi trường hoặc sử dụng mặc định
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_token_secret_key';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_token_secret_key';

// Thời gian hết hạn
const ACCESS_TOKEN_EXPIRE = process.env.ACCESS_TOKEN_EXPIRE || '1d'; // 1 ngày
const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || '7d'; // 7 ngày

// Tạo access token
export const generateAccessToken = (payload) => {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRE });
};

// Tạo refresh token
export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRE });
};

export const verifyToken = (token, tokenType = 'access') => {
    try {
        const secret = tokenType === 'access' ? ACCESS_TOKEN_SECRET : REFRESH_TOKEN_SECRET;
        return jwt.verify(token, secret);

    } catch (error) {
        throw new Error("Token không hợp lệ hoặc đã hết hạn")
    }
}

export const generateTokens = (payload) => {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return { accessToken, refreshToken };
}