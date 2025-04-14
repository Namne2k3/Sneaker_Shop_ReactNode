// scripts/generateSitemap.js
import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import axios from 'axios';
import path from 'path';


const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

const WEBSITE_URL = process.env.VITE_WEBSITE_URL || 'http://localhost:5173';

async function fetchProducts() {
    try {
        const response = await axios.get(`${API_URL}/products?limit=1000`);
        return response.data.data || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

async function fetchCategories() {
    try {
        const response = await axios.get(`${API_URL}/categories?limit=100`);
        return response.data.data || [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

async function fetchBrands() {
    try {
        const response = await axios.get(`${API_URL}/brands?limit=100`);
        return response.data.data || [];
    } catch (error) {
        console.error('Error fetching brands:', error);
        return [];
    }
}

function addStaticUrls(stream) {
    // Trang chủ
    stream.write({ url: '/', changefreq: 'weekly', priority: 1.0 });

    // Trang danh sách sản phẩm
    stream.write({ url: '/products', changefreq: 'daily', priority: 0.8 });

    // Các trang tĩnh khác
    stream.write({ url: '/contact', changefreq: 'monthly', priority: 0.5 });
    stream.write({ url: '/login', changefreq: 'monthly', priority: 0.3 });
    stream.write({ url: '/register', changefreq: 'monthly', priority: 0.3 });
}

function addProductUrls(stream, products) {
    products.forEach(product => {
        stream.write({
            url: `/products/${product.slug}`,
            changefreq: 'monthly',
            priority: 0.7,
            lastmod: product.updatedAt || product.createdAt
        });
    });
}

function addCategoryUrls(stream, categories) {
    categories.forEach(category => {
        stream.write({
            url: `/products?category=${category.slug}`,
            changefreq: 'weekly',
            priority: 0.6,
            lastmod: category.updatedAt || category.createdAt
        });
    });
}

function addBrandUrls(stream, brands) {
    brands.forEach(brand => {
        stream.write({
            url: `/products?brands=${brand.slug}`,
            changefreq: 'weekly',
            priority: 0.6,
            lastmod: brand.updatedAt || brand.createdAt
        });
    });
}

async function generateSitemap() {
    try {
        // Lấy dữ liệu từ API
        const [products, categories, brands] = await Promise.all([
            fetchProducts(),
            fetchCategories(),
            fetchBrands()
        ]);

        // Tạo stream sitemap
        const stream = new SitemapStream({ hostname: WEBSITE_URL });

        // Thêm các URL vào sitemap
        addStaticUrls(stream);
        addProductUrls(stream, products);
        addCategoryUrls(stream, categories);
        addBrandUrls(stream, brands);

        // Đóng stream
        stream.end();

        // Lưu sitemap vào file
        const sitemapOutput = path.join(__dirname, '../public/sitemap.xml');
        const writeStream = createWriteStream(sitemapOutput);

        const sitemap = await streamToPromise(stream);
        writeStream.write(sitemap.toString());
        console.log(`Sitemap generated at ${sitemapOutput}`);
        console.log(`Added ${products.length} products, ${categories.length} categories, and ${brands.length} brands to sitemap`);

    } catch (error) {
        console.error('Error generating sitemap:', error);
    }
}

generateSitemap();