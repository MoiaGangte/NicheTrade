import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {type: String, required: true },
    description: {type: Array, required: true, unique: true},
    price: {type: Number, required: true },
    offerPrice: {type: Number, required: true},
    image: {type: Array, required: true},
    category: {type: String, required: true},
    inStock: {type: Boolean, default: true },
    stockQuantity: {type: Number, required: true, default: 0},
    isBestSeller: {type: Boolean, default: false },
    isVisible: {type: Boolean, default: true },
}, { timestamps: true})

const Product = mongoose.models.Product || mongoose.model('product', productSchema);

export default Product