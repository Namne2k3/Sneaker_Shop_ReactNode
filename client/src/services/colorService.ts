import api from './api';

export interface ColorData {
    _id: string;
    name: string;
    code: string;
    createdAt: string;
    updatedAt: string;
}

export interface ColorResponse {
    success: boolean;
    message: string;
    data: ColorData[];
}

export interface SingleColorResponse {
    success: boolean;
    message: string;
    data: ColorData;
}

export const colorAPI = {
    getColors: async (): Promise<ColorResponse> => {
        const response = await api.get('/colors');
        return response.data;
    },

    getColorById: async (id: string): Promise<SingleColorResponse> => {
        const response = await api.get(`/colors/${id}`);
        return response.data;
    },

    createColor: async (colorData: { name: string; code: string; }) => {
        const response = await api.post('/colors', colorData);
        return response.data;
    },

    updateColor: async (id: string, colorData: { name?: string; code?: string; }) => {
        const response = await api.put(`/colors/${id}`, colorData);
        return response.data;
    },

    deleteColor: async (id: string) => {
        const response = await api.delete(`/colors/${id}`);
        return response.data;
    }
};

export default colorAPI;
