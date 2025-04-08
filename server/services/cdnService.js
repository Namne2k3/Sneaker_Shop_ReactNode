import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

const CDN_URL = process.env.CDN_URL || 'http://localhost:5050';

const createFormData = (filePath, fieldName = 'image') => {
    const form = new FormData();
    form.append(fieldName, fs.createReadStream(filePath));
    return form;
};

export const uploadFile = async (filePath, type = 'general') => {
    try {
        const form = createFormData(filePath);

        const response = await axios.post(`${CDN_URL}/upload/${type}`, form, {
            headers: {
                ...form.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // Xóa file tạm sau khi upload thành công
        fs.unlink(filePath, (err) => {
            if (err) console.error('Lỗi khi xóa file tạm:', err);
        });

        return response.data.data.url;
    } catch (error) {
        console.error('Lỗi khi upload lên máy chủ CDN:', error.message);
        throw new Error('Thất bại khi tải dữ liệu lên máy chủ CDN.');
    }
};

export const uploadMultipleFiles = async (filePaths, type = 'general') => {
    try {
        const form = new FormData();
        
        // Kiểm tra xem filePaths có phải là mảng không
        if (Array.isArray(filePaths)) {
            // Lặp qua mảng các file và thêm vào form
            filePaths.forEach((file, index) => {
                form.append('images', fs.createReadStream(file.path), {
                    filename: `image-${index}-${path.basename(file.path)}`
                });
            });
        } else {
            // Nếu không phải mảng, đây có thể là một single file object
            form.append('images', fs.createReadStream(filePaths.path), {
                filename: path.basename(filePaths.path)
            });
        }

        const response = await axios.post(`${CDN_URL}/upload/${type}/multiple`, form, {
            headers: {
                ...form.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // Xóa các file tạm sau khi upload thành công
        if (Array.isArray(filePaths)) {
            filePaths.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error(`Lỗi khi xóa file tạm ${file.path}:`, err);
                });
            });
        } else if (filePaths.path) {
            fs.unlink(filePaths.path, (err) => {
                if (err) console.error(`Lỗi khi xóa file tạm ${filePaths.path}:`, err);
            });
        }

        return response.data.data.map(file => file.url);
    } catch (error) {
        console.error('Error uploading multiple files to CDN:', error.message);
        // Log thêm thông tin chi tiết về lỗi 
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
        throw new Error('Failed to upload multiple files to CDN');
    }
};

export const deleteFile = async (fileUrl) => {
    try {
        // Extract type and filename from URL
        const urlParts = fileUrl.split('/');
        const filename = urlParts.pop();
        const type = urlParts.pop();

        const response = await axios.delete(`${CDN_URL}/images/${type}/${filename}`);

        return response.data.success;
    } catch (error) {
        console.error('Error deleting file from CDN:', error.message);
        throw new Error('Failed to delete file from CDN');
    }
};

export const getCdnUrl = (path) => {
    if (!path) return '';

    // If the path is already a full URL, return it as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Otherwise, prepend the CDN URL
    return `${CDN_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
