import mongoose from 'mongoose';

const sizeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: String,
        required: true,
        unique: true
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Size = mongoose.model('Size', sizeSchema);

export default Size;