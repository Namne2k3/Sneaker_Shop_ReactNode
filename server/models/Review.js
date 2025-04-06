import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productVariant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String
    },
    comment: {
        type: String,
        required: true
    },
    images: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    helpfulVotes: {
        type: Number,
        default: 0
    },
    reply: {
        content: String,
        createdAt: Date,
        isAdmin: Boolean
    }
}, { timestamps: true });

// Ensure user can only review a product once per variant
reviewSchema.index({ product: 1, user: 1, productVariant: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;