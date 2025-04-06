import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
    productVariant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    price: {
        type: Number,
        required: true
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        sparse: true
    },
    sessionId: {
        type: String,
        sparse: true
    },
    items: [cartItemSchema],
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Ensure user or sessionId exists and is unique
cartSchema.index({ user: 1 }, { unique: true, sparse: true });
cartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });

// Virtual for cart total
cartSchema.virtual('totalAmount').get(function () {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Virtual for number of items
cartSchema.virtual('totalItems').get(function () {
    return this.items.reduce((count, item) => count + item.quantity, 0);
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;