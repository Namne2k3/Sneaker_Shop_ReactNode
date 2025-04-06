import mongoose from 'mongoose';
import slugify from 'slugify';

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
    tags: [{
        type: String
    }],
    thumbnail: {
        type: String,
        required: [true, 'Ảnh đại diện không được để trống']
    },
    gallery: [{
        type: String
    }],
    featured: {
        type: Boolean,
        default: false
    },
    isNew: {
        type: Boolean,
        default: true
    },
    isBestSeller: {
        type: Boolean,
        default: false
    },
    onSale: {
        type: Boolean,
        default: false
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    },
    specifications: [{
        name: String,
        value: String
    }],
    status: {
        type: String,
        enum: ['draft', 'active', 'inactive', 'archived'],
        default: 'active'
    },
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String]
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

// Virtuals for relationships
productSchema.virtual('variants', {
    ref: 'ProductVariant',
    localField: '_id',
    foreignField: 'product'
});

// Text search index
productSchema.index({
    name: 'text',
    description: 'text',
    tags: 'text'
});

const Product = mongoose.model('Product', productSchema);

export default Product;