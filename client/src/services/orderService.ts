import api from "./api";

const orderService = {
    // Create a new order
    createOrder: async (orderData) => {
        return await api.post('/orders', orderData);
    },

    // Get user orders (for customer)
    getUserOrders: async () => {
        return await api.get('/orders/user');
    },

    // Get single order by ID
    getOrderById: async (id) => {
        return await api.get(`/orders/${id}`);
    },

    // Cancel an order
    cancelOrder: async (id, reason) => {
        return await api.put(`/orders/${id}/cancel`, { reason });
    },

    // Admin functions
    // Get all orders (with filtering)
    getAllOrders: async (params) => {
        return await api.get('/orders', { params });
    },

    // Get order statistics
    getOrderStatistics: async () => {
        return await api.get('/orders/statistics');
    },

    // Update order status
    updateOrderStatus: async (id, status, note) => {
        return await api.put(`/orders/${id}/status`, { status, note });
    }
};

export default orderService;
