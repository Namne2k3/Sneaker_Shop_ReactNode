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

    // Get user profile (current user)
    getUserProfile: async () => {
        const response = await api.get('/users/profile');
        return response.data;
    },

    // Update user profile
    updateProfile: async (data: FormData) => {
        const response = await api.put('/users/profile', data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Change password
    changePassword: async (currentPassword: string, newPassword: string) => {
        const response = await api.put('/users/change-password', {
            currentPassword,
            newPassword
        });
        return response.data;
    },

    // Update user (for admin)
    updateUser: async (id: string, userData: any) => {
        const response = await api.put(`/users/${id}`, userData);
        return response.data;
    },

    // Delete user
    deleteUser: async (id: string) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    }
};

export default userAPI;
