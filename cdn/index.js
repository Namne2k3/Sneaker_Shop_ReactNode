import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// hàm tạo thư mục nếu chưa tồn tại
const createDirIfNotExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Directory created: ${dirPath}`);
    }
};
// định nghĩa các tên của thư mục chứa ảnh
const uploadsDir = path.join(__dirname, 'uploads');
const categoryImagesDir = path.join(uploadsDir, 'categories');
const productImagesDir = path.join(uploadsDir, 'products');
const userImagesDir = path.join(uploadsDir, 'users');
const brandImagesDir = path.join(uploadsDir, 'brands');

// tạo thư mục tại nếu chưa tồn tại
createDirIfNotExists(uploadsDir);
createDirIfNotExists(categoryImagesDir);
createDirIfNotExists(productImagesDir);
createDirIfNotExists(userImagesDir);
createDirIfNotExists(brandImagesDir);

// Cấu hình multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadType = req.params.type || 'general';
        let uploadDir;

        switch (uploadType) {
            case 'categories':
                uploadDir = categoryImagesDir;
                break;
            case 'products':
                uploadDir = productImagesDir;
                break;
            case 'users':
                uploadDir = userImagesDir;
                break;
            case 'brands':
                uploadDir = brandImagesDir;
                break;
            default:
                uploadDir = uploadsDir;
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // tạo ra tên file duy nhất bằng cách kết hợp timestamp, số ngẫu nhiên và tên gốc của file
        const timestamp = Date.now();
        const randomNum = Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        const cleanFileName = path.basename(file.originalname, fileExt)
            .replace(/[^a-zA-Z0-9]/g, '-')
            .toLowerCase();

        const fileName = `${timestamp}-${randomNum}-${cleanFileName}${fileExt}`;
        cb(null, fileName);
    }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ có thể gửi file định dạng ảnh!'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024 // Default: 5MB
    }
});

// thêm middleware để phục vụ các file tĩnh từ thư mục uploads
app.use('/images', express.static(uploadsDir));

// Route: tải lên một file ảnh duy nhât
app.post('/upload/:type', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Chưa tải lên file hoặc file không hợp lệ!'
            });
        }

        // Create URL for the uploaded file
        // req.protocol: http or https
        // req.get('host'): localhost:5050 đã được config 
        // req.file.filename: tên file đã được tạo ra bởi multer
        const fileUrl = `${req.protocol}://${req.get('host')}/images/${req.params.type}/${req.file.filename}`;

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: fileUrl
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading file',
            error: error.message
        });
    }
});

// Route: Upload multiple images (max 10)
app.post('/upload/:type/multiple', upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded or file types not allowed'
            });
        }

        // Create URLs for all uploaded files
        const uploadedFiles = req.files.map(file => {
            const fileUrl = `${req.protocol}://${req.get('host')}/images/${req.params.type}/${file.filename}`;
            return {
                filename: file.filename,
                mimetype: file.mimetype,
                size: file.size,
                url: fileUrl
            };
        });

        res.status(201).json({
            success: true,
            message: 'Files uploaded successfully',
            data: uploadedFiles
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading files',
            error: error.message
        });
    }
});

// Route: Delete an image
app.delete('/images/:type/:filename', (req, res) => {
    try {
        const { type, filename } = req.params;
        let filePath;

        switch (type) {
            case 'categories':
                filePath = path.join(categoryImagesDir, filename);
                break;
            case 'products':
                filePath = path.join(productImagesDir, filename);
                break;
            case 'users':
                filePath = path.join(userImagesDir, filename);
                break;
            case 'brands':
                filePath = path.join(brandImagesDir, filename);
                break;
            default:
                filePath = path.join(uploadsDir, filename);
        }

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Delete the file
        fs.unlinkSync(filePath);

        res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting file',
            error: error.message
        });
    }
});

// Route: Check server status
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CDN server is running',
        version: '1.0.0'
    });
});

// Error handler for multer errors
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum file size is ${(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024) / (1024 * 1024)}MB.`
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
        });
    } else if (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
    next();
});

// Start the server
app.listen(PORT, () => {
    console.log(`CDN server running on port ${PORT}`);
    console.log(`Access images at http://localhost:${PORT}/images/{category|products|users|brands}/filename`);
});
