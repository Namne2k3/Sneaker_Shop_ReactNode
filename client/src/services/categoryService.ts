import api from './api';

export interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parent?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryResponse {
    success: boolean;
    message: string;
    data: Category[];
}

export const categoryAPI = {
    getCategories: async (includeProducts = false, includeChildren = false) => {
        const response = await api.get('/categories', {
            params: {
                includeProducts,
                includeChildren
            }
        });
        return response.data;
    },

    getCategoryById: async (id: string) => {
        const response = await api.get(`/categories/${id}`);
        return response.data;
    },

    getCategoryBySlug: async (slug: string, includeProducts: boolean, includeChildren: boolean) => {
        const response = await api.get(`/categories/slug/${slug}`, {
            params: {
                includeProducts,
                includeChildren
            }
        });
        return response.data;
    },

    createCategory: async (categoryData: FormData) => {
        const response = await api.post('/categories', categoryData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    updateCategory: async (id: string, categoryData: FormData) => {
        const response = await api.put(`/categories/${id}`, categoryData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    deleteCategory: async (id: string) => {
        const response = await api.delete(`/categories/${id}`);
        return response.data;
    }
};

export default categoryAPI;
