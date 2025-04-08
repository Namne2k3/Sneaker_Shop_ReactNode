import api from './api';

export interface Brand {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
}

export interface BrandResponse {
    success: boolean;
    message: string;
    data: Brand[];
}

export interface SingleBrandResponse {
    success: boolean;
    message: string;
    data: Brand & {
        productCount?: number;
        products?: Array<any>;
    };
}

export interface BrandFilter {
    search?: string;
    status?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}

export const brandAPI = {
    getBrands: async (filters: BrandFilter = {}) => {
        const response = await api.get('/brands', { params: filters });
        return response.data;
    },

    getBrandById: async (id: string, includeProducts: boolean = false) => {
        const response = await api.get(`/brands/${id}`, {
            params: { includeProducts }
        });
        return response.data as SingleBrandResponse;
    },

    getBrandBySlug: async (slug: string, includeProducts: boolean = false) => {
        const response = await api.get(`/brands/slug/${slug}`, {
            params: { includeProducts }
        });
        return response.data as SingleBrandResponse;
    },

    createBrand: async (brandData: FormData) => {
        const response = await api.post('/brands', brandData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    updateBrand: async (id: string, brandData: FormData) => {
        const response = await api.put(`/brands/${id}`, brandData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    deleteBrand: async (id: string) => {
        const response = await api.delete(`/brands/${id}`);
        return response.data;
    }
};

export default brandAPI;
