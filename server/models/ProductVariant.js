import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    size: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Size',
        required: true
    },
    color: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Color',
        required: true
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    additionalPrice: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'out_of_stock'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Index để đảm bảo tính duy nhất của kết hợp product-size-color
productVariantSchema.index({ product: 1, size: 1, color: 1 }, { unique: true });

// Pre-save hook
productVariantSchema.pre('save', function (next) {
    if (this.isModified('stock')) {
        this.status = this.stock <= 0 ? 'out_of_stock' : 'active';
    }
    next();
});

// Calculate the full price based on product base price and additional price
productVariantSchema.virtual('price').get(async function () {
    try {
        const product = await mongoose.model('Product').findById(this.product);
        return product ? product.basePrice + this.additionalPrice : this.additionalPrice;
    } catch (error) {
        return this.additionalPrice;
    }
});

// Method to check stock availability
productVariantSchema.methods.hasEnoughStock = function (quantity) {
    return this.stock >= quantity;
};

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);

export default ProductVariant;