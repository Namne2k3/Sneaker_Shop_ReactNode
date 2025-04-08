import api from './api';

export interface SizeData {
    _id: string;
    name: string;
    value: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface SizeResponse {
    success: boolean;
    message: string;
    data: SizeData[];
}

export interface SingleSizeResponse {
    success: boolean;
    message: string;
    data: SizeData;
}

export const sizeAPI = {
    getSizes: async (): Promise<SizeResponse> => {
        const response = await api.get('/sizes');
        return response.data;
    },

    getSizeById: async (id: string): Promise<SingleSizeResponse> => {
        const response = await api.get(`/sizes/${id}`);
        return response.data;
    },

    createSize: async (sizeData: { name: string; value: string; order?: number; }) => {
        const response = await api.post('/sizes', sizeData);
        return response.data;
    },

    updateSize: async (id: string, sizeData: { name?: string; value?: string; order?: number; }) => {
        const response = await api.put(`/sizes/${id}`, sizeData);
        return response.data;
    },

    deleteSize: async (id: string) => {
        const response = await api.delete(`/sizes/${id}`);
        return response.data;
    }
};

export default sizeAPI;
