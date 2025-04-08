import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

console.log('Initial API setup: Authorization header =', api.defaults.headers.common['Authorization']);

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Request interceptor setting auth token:', `Bearer ${token}`);
    } else {
        console.log('No auth token found in localStorage');
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor to handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle authentication errors
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            // Redirect to login if not already there
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
    register: async (userData: { fullName: string; email: string; password: string; phone?: string }) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },
    logout: async (refreshToken: string) => {
        const response = await api.post('/auth/logout', { refreshToken });
        return response.data;
    },
};

export default api;