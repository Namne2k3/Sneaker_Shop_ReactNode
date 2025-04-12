import api from "./api";

export interface DashboardStatistics {
    orders: {
        total: number,
        today: number,
        thisMonth: number,
        byStatus: {
            [key: string]: {
                count: number,
                total: number
            }
        },
        revenue: {
            total: number,
            today: number,
            thisMonth: number,
        },
        products: {
            total: number,
            popular: {
                _id: string,
                name: string,
                price: number,
                image: string,
                salesCount: number,
                rating: number
            }[]
        },
        users: {
            total: number,
        }
    }
}

const statisticsService = {
    getDashboardStats: async (): Promise<{ data: DashboardStatistics }> => {
        const response = await api.get('/statistics/dashboard');
        return response.data;
    },
    getOrderStatistics: async (): Promise<any> => {
        const response = await api.get('/statistics/orders');
        return response.data;
    },
    getUserStatistics: async (): Promise<any> => {
        const response = await api.get('/statistics/users');
        return response.data;
    },
    getPopularProducts: async (limit = 3): Promise<any> => {
        const response = await api.get('/statistics/popular-products', { params: { limit } });
        return response.data;
    },
    getUsersCount: async (): Promise<any> => {
        const response = await api.get('/statistics/users-count');
        return response.data;
    }
}

export default statisticsService;
