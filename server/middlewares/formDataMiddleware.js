import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Tạo thư mục temp nếu chưa tồn tại
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Cấu hình lưu trữ tạm thời để xử lý file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Middleware xử lý form-data với file
const upload = multer({ storage });

// Middleware để xử lý form-data và lưu file tạm thời
export const parseFormData = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: 'Error parsing form data',
                error: err.message
            });
        }
        next();
    });
};

// Middleware để xử lý nhiều file
export const parseMultipleFiles = (req, res, next) => {
    upload.array('images', 10)(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: 'Error parsing form data with multiple files',
                error: err.message
            });
        }
        next();
    });
};