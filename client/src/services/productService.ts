import api from './api';

export interface ProductFilter {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    category?: string;    // Now expects slug
    brand?: string;       // Now expects slug
    minPrice?: string;
    maxPrice?: string;
    featured?: boolean;
    status?: string;
    search?: string;
    inStock?: boolean;
    categories?: string | string[];  // Now expects array of slugs
    brands?: string | string[];      // Now expects array of slugs
}

export interface ProductData {
    _id: string;
    name: string;
    slug: string;
    description: string;
    features: string;
    basePrice: number;
    salePrice: number;
    category: {
        _id: string;
        name: string;
        id?: string;
    };
    brand: {
        _id: string;
        name: string;
    };
    images: Array<{
        imagePath: string;
        isPrimary: boolean;
        _id: string;
    }>;
    status: 'active' | 'out_of_stock' | 'draft';
    createdAt: string;
    updatedAt: string;
    primaryImage?: string;
    thumbnail: string;
}

export interface ProductsResponse {
    success: boolean;
    message: string;
    data: ProductData[];
    meta: {
        page: number;
        limit: number;
        totalPages: number;
        totalProducts: number;
    };
}

export const productAPI = {
    getProducts: async (filters: ProductFilter = {}): Promise<ProductsResponse> => {
        // Create a new params object to properly handle array parameters
        const params: Record<string, any> = {};

        // Handle pagination and sorting
        if (filters.page) params.page = filters.page;
        if (filters.limit) params.limit = filters.limit;
        if (filters.sort) params.sort = filters.sort;
        if (filters.order) params.order = filters.order;

        // Handle category/brand filter - now using slug
        if (filters.category) params.category = filters.category;
        if (filters.brand) params.brand = filters.brand;

        // Handle multiple categories/brands - now using slugs
        if (filters.categories) {
            if (Array.isArray(filters.categories)) {
                params.categories = filters.categories.join(',');
            } else {
                params.categories = filters.categories;
            }
        }

        if (filters.brands) {
            if (Array.isArray(filters.brands)) {
                params.brands = filters.brands.join(',');
            } else {
                params.brands = filters.brands;
            }
        }

        // Handle price range
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;

        // Handle other filters
        if (filters.featured !== undefined) params.featured = filters.featured;
        if (filters.status) params.status = filters.status;
        if (filters.search) params.search = filters.search;
        if (filters.inStock !== undefined) params.inStock = filters.inStock;

        const response = await api.get('/products', { params });
        return response.data;
    },

    getProductById: async (id: string) => {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },

    getProductBySlug: async (slug: string) => {
        const response = await api.get(`/products/slug/${slug}`);
        return response.data;
    },

    createProduct: async (productData: FormData) => {
        const response = await api.post('/products', productData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    updateProduct: async (id: string, productData: FormData) => {
        const response = await api.put(`/products/${id}`, productData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    deleteProduct: async (id: string) => {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    },

    // Bulk actions
    bulkDeleteProducts: async (ids: string[]) => {
        const response = await api.post('/products/bulk-delete', { ids });
        return response.data;
    },

    bulkUpdateStatus: async (ids: string[], status: string) => {
        const response = await api.post('/products/bulk-update-status', { ids, status });
        return response.data;
    },

    bulkUpdateFeatured: async (ids: string[], featured: boolean) => {
        const response = await api.post('/products/bulk-update-featured', { ids, featured });
        return response.data;
    },

    createProductWithVariants: async (formData: FormData) => {
        const response = await api.post('/products/with-variants', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // New functions
    softDeleteProduct: async (id: string) => {
        const response = await api.put(`/products/${id}/soft-delete`);
        return response.data;
    },

    // Product variants related functions
    getProductVariants: async (productId: string) => {
        const response = await api.get(`/products/${productId}/variants`);
        return response.data;
    },

    getProductVariantById: async (variantId: string) => {
        const response = await api.get(`/products/variants/${variantId}`);
        return response.data;
    },

    createProductVariant: async (productId: string, variantData: unknown) => {
        const response = await api.post(`/products/${productId}/variants`, variantData);
        return response.data;
    },

    updateProductVariant: async (variantId: string, variantData: unknown) => {
        const response = await api.put(`/products/variants/${variantId}`, variantData);
        return response.data;
    },

    deleteProductVariant: async (variantId: string) => {
        const response = await api.delete(`/products/variants/${variantId}`);
        return response.data;
    },

    createProductVariants: async (productId: string, variantsData: unknown[]) => {
        const response = await api.post(`/products/${productId}/batch-variants`, { variants: variantsData });
        return response.data;
    },

    updateVariantsStock: async (productId: string, updates: Array<{ variantId: string, stock: number }>) => {
        const response = await api.post(`/products/${productId}/update-stock`, { updates });
        return response.data;
    },

    findProductVariant: async (productId: string, sizeId: string, colorId: string) => {
        const response = await api.get(`/products/${productId}/find-variant`, {
            params: {
                sizeId,
                colorId
            }
        });
        return response.data;
    }
};

export default productAPI;
