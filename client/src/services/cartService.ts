import api from './api';

const cartService = {
    // Get cart items
    getCart: async () => {
        const response = await api.get('/wishlist');
        return response.data;
    },

    // Add item to cart
    addToCart: async (productId: string, quantity: number = 1, variantId?: string) => {
        const data = { productId, quantity };
        if (variantId) {
            Object.assign(data, { variantId });
        }

        const response = await api.post('/wishlist/add', data);
        return response.data;
    },

    // Update item quantity
    updateCartItemQuantity: async (itemId: string, quantity: number) => {
        const response = await api.put(`/wishlist/update/${itemId}`, { quantity });
        return response.data;
    },

    // Remove item from cart
    removeFromCart: async (itemId: string) => {
        const response = await api.delete(`/wishlist/remove/${itemId}`);
        return response.data;
    },

    // Clear cart
    clearCart: async () => {
        const response = await api.delete('/wishlist/clear');
        return response.data;
    }
};

export default cartService;
