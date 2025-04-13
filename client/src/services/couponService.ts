import api from "./api";

const couponService = {
    validateCoupon: async (couponCode: string, orderAmount: number) => {
        return await api.get(`/coupons/validate/${couponCode}?orderAmount=${orderAmount}`)
    }
};

export default couponService;