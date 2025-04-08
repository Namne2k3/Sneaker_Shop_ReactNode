import mongoose from 'mongoose';
import slugify from 'slugify';

const productImageSchema = new mongoose.Schema({
    imagePath: {
        type: String,
        required: true
    },
    isPrimary: {
        type: Boolean,
        default: false
    }
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên sản phẩm không được để trống'],
        trim: true,
        maxlength: [200, 'Tên sản phẩm không quá 200 ký tự']
    },
    slug: {
        type: String,
        unique: true
    },
    description: {
        type: String,
        required: [true, 'Mô tả sản phẩm không được để trống']
    },
    featured: {
        type: Boolean,
        default: false,
    },
    features: {
        type: String
    },
    basePrice: {
        type: Number,
        required: [true, 'Giá sản phẩm không được để trống'],
        default: 0
    },
    salePrice: {
        type: Number,
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    images: [productImageSchema],
    status: {
        type: String,
        enum: ['draft', 'active', 'out_of_stock'],
        default: 'active'
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create slug from product name
productSchema.pre('save', function (next) {
    if (!this.isModified('name')) {
        return next();
    }
    this.slug = slugify(this.name, {
        lower: true,
        strict: true
    });
    next();
});

// Virtual getter for primary image
productSchema.virtual('primaryImage').get(function () {
    const primary = this.images.find(img => img.isPrimary);
    return primary ? primary.imagePath : this.images.length > 0 ? this.images[0].imagePath : null;
});

// Virtuals for relationships
productSchema.virtual('variants', {
    ref: 'ProductVariant',
    localField: '_id',
    foreignField: 'product'
});

// Text search index
productSchema.index({
    name: 'text',
    description: 'text'
});

const Product = mongoose.model('Product', productSchema);

export default Product;