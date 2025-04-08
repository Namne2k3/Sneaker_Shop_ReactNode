import mongoose from 'mongoose';
import slugify from 'slugify';

const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên thương hiệu không được để trống'],
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true
    },
    logo: {
        type: String
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

// Create slug from brand name
brandSchema.pre('save', function (next) {
    if (!this.isModified('name')) {
        return next();
    }
    this.slug = slugify(this.name, {
        lower: true,
        strict: true
    });
    next();
});

brandSchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'brand'
});

const Brand = mongoose.model('Brand', brandSchema);

export default Brand;