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
    price: {
        type: Number,
        required: true
    },
    comparePrice: {
        type: Number,
        default: 0
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    images: [{
        type: String
    }],

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

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);

export default ProductVariant;