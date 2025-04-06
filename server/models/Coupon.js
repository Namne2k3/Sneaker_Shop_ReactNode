import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    type: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    value: {
        type: Number,
        required: true,
        min: 0
    },
    maxDiscount: {
        type: Number,
        default: 0
    },
    minOrderAmount: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    maxUsage: {
        type: Number,
        default: 0
    },
    usageCount: {
        type: Number,
        default: 0
    },
    maxUsagePerUser: {
        type: Number,
        default: 1
    },
    applyTo: {
        type: String,
        enum: ['all', 'products', 'categories', 'brands'],
        default: 'all'
    },
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    applicableBrands: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Virtual to check if coupon is valid
couponSchema.virtual('isValid').get(function () {
    const now = new Date();
    return (
        this.isActive &&
        now >= this.startDate &&
        now <= this.endDate &&
        (this.maxUsage === 0 || this.usageCount < this.maxUsage)
    );
});

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;