import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import Seller from "../models/Seller.js";
import {
    beginSellerListingPayment,
    completeSellerListingPayment,
    releaseSellerListingPayment,
} from "./sellerListingPaymentController.js";
import { normalizeListingQuantity, normalizeProductCategories } from "../utils/productCategories.js";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//add product : /api/product/add
export const addProduct = async (req, res) => {
    let productCreated = false;
    let listingPayment;
    let freeUploadReservation;
    let quantity;
    try {
        let productData = JSON.parse(req.body.productData);
        const images = req.files;
        const categories = normalizeProductCategories(productData.categories ?? productData.category);
        quantity = normalizeListingQuantity(productData.stockQuantity);
        productData.stockQuantity = quantity;

        if (!images || images.length === 0) {
            return res.status(400).json({ success: false, message: "Please upload at least one image" });
        }

        if (!req.seller.isVip) {
            if (req.body.freeListing === "true") {
                freeUploadReservation = await Seller.findOneAndUpdate(
                    { _id: req.sellerId, isVip: { $ne: true }, freeUploads: { $gte: 1 } },
                    { $inc: { freeUploads: -1 } },
                    { new: true },
                );
                if (!freeUploadReservation) {
                    return res.status(409).json({
                        success: false,
                        message: "There are not enough free upload credits. Refresh your balance and pay the listing fee.",
                    });
                }
            } else {
                listingPayment = await beginSellerListingPayment(req.sellerId, quantity, {
                    razorpay_order_id: req.body.razorpay_order_id,
                    razorpay_payment_id: req.body.razorpay_payment_id,
                    razorpay_signature: req.body.razorpay_signature,
                });
                if (listingPayment.alreadyCompleted) {
                    return res.json({
                        success: true,
                        message: "Product listing was already added",
                        product: listingPayment.product,
                    });
                }
            }
        }

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                try {
                    let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                    return result.secure_url;
                } catch (error) {
                    console.error('Error uploading to Cloudinary:', error);
                    throw new Error('Failed to upload image to Cloudinary');
                }
            })
        );

        const newProduct = await Product.create({
            ...productData,
            category: categories[0],
            categories,
            image: imagesUrl,
            sellerId: req.sellerId,
            inStock: true,
            isVisible: true,
            isBestSeller: productData.isBestSeller || false // Ensure isBestSeller is set
        });
        productCreated = true;
        if (listingPayment) {
            await completeSellerListingPayment(listingPayment, newProduct._id);
        }

        return res.json({
            success: true,
            message: "Product added successfully",
            product: newProduct
        });

    } catch (error) {
        if (listingPayment && !productCreated) {
            try {
                await releaseSellerListingPayment(listingPayment);
            } catch (releaseError) {
                console.error("Unable to release failed seller listing payment reservation:", releaseError);
            }
        }
        if (freeUploadReservation && !productCreated) {
            try {
                await Seller.updateOne(
                    { _id: req.sellerId },
                    { $inc: { freeUploads: 1 } },
                );
            } catch (refundError) {
                console.error("Unable to restore free upload credits after listing failed:", refundError);
            }
        }
        console.error('Error in addProduct:', error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Failed to add product"
        });
    }
};

// Add product : /api/product/list
export const productList = async (_req, res) => {
    try {
        const products = await Product.find({ isVisible: true })
            .populate({
                path: "sellerId",
                select: "name department isActive isApproved",
                match: { isActive: { $ne: false }, isApproved: true },
            })
            .lean();
        res.json({ success: true, products })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Seller product list : /api/product/seller/list
export const sellerProductList = async (req, res) => {
    try {
        const products = await Product.find({ sellerId: req.sellerId })
            .select('_id name price offerPrice image inStock stockQuantity category categories')
            .lean();

        if (!products || products.length === 0) {
            return res.json({
                success: true,
                products: [],
                message: "No products found"
            });
        }

        // Ensure all required fields are present
        const validProducts = products.map(product => ({
            _id: product._id.toString(),
            name: product.name || '',
            price: product.price || 0,
            offerPrice: product.offerPrice || 0,
            image: Array.isArray(product.image) ? product.image : [],
            inStock: Boolean(product.inStock),
            stockQuantity: Number(product.stockQuantity) || 0,
            category: product.category || '',
            categories: Array.isArray(product.categories) && product.categories.length
                ? product.categories
                : [product.category || '']
        }));

        res.json({
            success: true,
            products: validProducts
        });
    } catch (error) {
        console.error('Error in sellerProductList:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching products"
        });
    }
};

//get single product : /api/product/id
export const productById = async (req, res) => {
    try {
        const { id } = req.body
        const product = await Product.findById(id)
        res.json({ success: true, product })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }

}

//change product instock : /api/product/stock
export const changeStock = async (req, res) => {
    try {
        const { id, stockQuantity } = req.body;

        const quantity = Number(stockQuantity);
        if (!id || !Number.isInteger(quantity) || quantity < 0) {
            return res.status(400).json({ success: false, message: "A valid product ID and non-negative stock quantity are required" });
        }

        const updateData = {
            stockQuantity: quantity,
            inStock: quantity > 0,
            isVisible: quantity > 0
        };

        const product = await Product.findOneAndUpdate(
            { _id: id, sellerId: req.sellerId },
            updateData,
            { new: true }
        );
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        let message = `Stock quantity updated to ${quantity}`;
        if (quantity > 0) {
            message += " - Product is now in stock and visible";
        } else {
            message += " - Product is now out of stock and hidden";
        }

        res.json({ success: true, message });
    } catch (error) {
        console.error('Error in changeStock:', error);
        res.json({ success: false, message: error.message || "Failed to update stock" });
    }
};

//delete product : /api/product/delete/:id
export const getCategories = async (req, res) => {
    try {
        const [primaryCategories, additionalCategories] = await Promise.all([
            Product.distinct('category', { isVisible: true }),
            Product.distinct('categories', { isVisible: true }),
        ]);
        const categories = [...new Set([...primaryCategories, ...additionalCategories].filter(Boolean))];
        res.json({ success: true, categories });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

//delete product : /api/product/delete/:id
export const deleteCategory = async (req, res) => {
    try {
        const { category } = req.body;
        if (!category) {
            return res.json({ success: false, message: "Category name is required" });
        }

        await Product.updateMany(
            { category, sellerId: req.sellerId },
            { $set: { category: "uncategorized" }, $pull: { categories: category } }
        );
        await Product.updateMany(
            { category: { $ne: category }, categories: category, sellerId: req.sellerId },
            { $pull: { categories: category } }
        );

        res.json({ success: true, message: `Category "${category}" deleted successfully. All products in this category have been uncategorized.` });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOneAndDelete({ _id: id, sellerId: req.sellerId });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};