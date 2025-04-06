import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart',
        required: true
    },
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
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Đảm bảo mỗi giỏ hàng chỉ có một biến thể sản phẩm duy nhất
cartItemSchema.index({ cart: 1, productVariant: 1 }, { unique: true });

// Method để cập nhật số lượng
cartItemSchema.methods.updateQuantity = async function (quantity) {
    // Kiểm tra tồn kho
    const ProductVariant = mongoose.model('ProductVariant');
    const variant = await ProductVariant.findById(this.productVariant);

    if (!variant.hasEnoughStock(quantity)) {
        throw new Error(`Chỉ còn ${variant.availableStock} sản phẩm trong kho`);
    }

    this.quantity = quantity;
    await this.save();

    // Cập nhật tổng giỏ hàng
    const cart = await mongoose.model('Cart').findById(this.cart);
    await cart.recalculate();

    return this;
};

// Hook trước khi lưu
cartItemSchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('quantity')) {
        const ProductVariant = mongoose.model('ProductVariant');
        const variant = await ProductVariant.findById(this.productVariant);

        if (!variant) {
            return next(new Error('Biến thể sản phẩm không tồn tại'));
        }

        if (!variant.hasEnoughStock(this.quantity)) {
            return next(new Error(`Chỉ còn ${variant.availableStock} sản phẩm trong kho`));
        }

        // Nếu giá chưa được thiết lập, lấy giá từ biến thể sản phẩm
        if (!this.price) {
            this.price = variant.price;
        }
    }
    next();
});

// Hook sau khi lưu
cartItemSchema.post('save', async function () {
    // Cập nhật tổng giỏ hàng
    const cart = await mongoose.model('Cart').findById(this.cart);
    await cart.recalculate();
});

// Hook sau khi xóa
cartItemSchema.post('remove', async function () {
    // Cập nhật tổng giỏ hàng
    const cart = await mongoose.model('Cart').findById(this.cart);

    // Xóa item khỏi danh sách items trong giỏ hàng
    cart.items = cart.items.filter(item => !item.equals(this._id));
    await cart.save();
    await cart.recalculate();
});

const CartItem = mongoose.model('CartItem', cartItemSchema);

export default CartItem;