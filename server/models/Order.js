import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productVariant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: false // Making this optional as not all products have variants
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ""
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    items: [orderItemSchema],
    subtotal: {
        type: Number,
        required: true,
        comment: 'Sum of all items before discounts and shipping'
    },
    shippingFee: {
        type: Number,
        default: 0,
        comment: 'Shipping cost'
    },
    total: {
        type: Number,
        required: true,
        comment: 'Final amount after discounts and shipping'
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'bank_transfer', 'credit_card', 'momo', 'zalopay', 'vnpay'],
        default: 'cod'
    },
    shippingAddress: {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true }
    },
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    },
    discount: {
        type: Number,
        default: 0
    },
    notes: {
        type: String
    },
    statusHistory: [{
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: {
            type: String
        }
    }]
}, { timestamps: true });

// Generate order number before saving
orderSchema.pre('save', function (next) {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const randomNum = Math.floor(100000 + Math.random() * 900000);

        this.orderNumber = `SP${year}${month}${day}${randomNum}`;

        // Record initial status
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            note: 'Đơn hàng đã được tạo'
        });
    } else if (this.isModified('status')) {
        // Record status change
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date()
        });
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);

// Export the schema if needed elsewhere
export const OrderItemSchema = orderItemSchema;

export default Order;