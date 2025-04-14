import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import axios from 'axios';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';
const WEBSITE_URL = process.env.VITE_WEBSITE_URL || 'https://sneaker-shop-react-node.vercel.app';

// import.meta.url => 'file:///Users/nam/project/generateSitemap.js'
// __filename => 'd:\File\Code\NodeJS Express\DoAn_CK\test.js'
const __filename = fileURLToPath(import.meta.url);


// hàm dirname sẽ lấy đường dẫn thư mục chứa file hiện tại.
// __dirname => 'd:\File\Code\NodeJS Express\DoAn_CK'
const __dirname = dirname(__filename);

async function fetchProducts() {
    try {
        const response = await axios.get(`${API_URL}/products?limit=100`);
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
    stream.write({ url: '/', changefreq: 'weekly', priority: 1.0 });
    stream.write({ url: '/products', changefreq: 'daily', priority: 0.8 });
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
            url: `/products?brand=${brand.slug}`,
            changefreq: 'weekly',
            priority: 0.6,
            lastmod: brand.updatedAt || brand.createdAt
        });
    });
}

async function generateSitemap() {
    try {
        const [products, categories, brands] = await Promise.all([
            fetchProducts(),
            fetchCategories(),
            fetchBrands()
        ]);

        // hàm resolve sẽ nối 2 đường dẫn lại với nhau
        // cụ thể __dirname hiện tại là thư mục chứa file generateSitemap.js
        // kết hợp với '../../public' => nó sẽ lùi lại 2 cấp thư mục sau đó trỏ vào thư mục public
        const publicDir = resolve(__dirname, '../../public');


        // hàm existSync sẽ trả về boolean để kiểm tra xem đường dẫn có tồn tại
        if (!existsSync(publicDir)) {
            // tạo thư mục public, và các thư mục cha của nó nếu chưa tồn tại (nhờ { recursive: true })
            mkdirSync(publicDir, { recursive: true });
            console.log(`Created directory: ${publicDir}`);
        }
        // hàm join Nó được dùng để kết hợp các đoạn đường dẫn lại thành một đường dẫn hoàn chỉnh phù hợp với hệ điều hành.
        const sitemapOutput = join(publicDir, 'sitemap.xml');
        const stream = new SitemapStream({ hostname: WEBSITE_URL });

        addStaticUrls(stream);
        addProductUrls(stream, products);
        addCategoryUrls(stream, categories);
        addBrandUrls(stream, brands);

        stream.end();

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