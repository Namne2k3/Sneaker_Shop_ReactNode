import api from "./api";

interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
}

const userAPI = {
    // Get users with pagination and filters
    getUsers: async (params: PaginationParams = {}) => {
        const response = await api.get('/users', { params });
        return response.data;
    },

    // Get user by ID
    getUserById: async (id: string) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    // Create new user
    createUser: async (userData: any) => {
        const response = await api.post('/users', userData);
        return response.data;
    },

    // Change user status (activate/deactivate)
    changeUserStatus: async (id: string, isActive: boolean) => {
        const response = await api.put(`/users/${id}/status`, { isActive });
        return response.data;
    },

    // Update user profile (for self)
    updateProfile: async (data: FormData) => {
        const response = await api.put('/users/profile', data);
        return response.data;
    },

    // Change user password (for self)
    changePassword: async (data: { currentPassword: string; newPassword: string }) => {
        const response = await api.put('/users/change-password', data);
        return response.data;
    }
};

export default userAPI;
