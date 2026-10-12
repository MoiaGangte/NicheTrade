import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import { releaseSellerProductUpload } from "../utils/sellerFreeListingTrial.js";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//add product : /api/product/add
export const addProduct = async (req, res) => {
    let productCreated = false;
    try {
        let productData = JSON.parse(req.body.productData);
        const images = req.files;

        if (!images || images.length === 0) {
            if (req.productUploadReserved) {
                await releaseSellerProductUpload(req.sellerId);
                req.productUploadReserved = false;
            }
            return res.json({ success: false, message: "Please upload at least one image" });
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
            image: imagesUrl,
            sellerId: req.sellerId,
            inStock: true,
            isVisible: true,
            isBestSeller: productData.isBestSeller || false // Ensure isBestSeller is set
        });
        productCreated = true;

        res.json({
            success: true,
            message: "Product Added Successfully",
            product: newProduct
        });

    } catch (error) {
        if (req.productUploadReserved && !productCreated) {
            try {
                await releaseSellerProductUpload(req.sellerId);
                req.productUploadReserved = false;
            } catch (releaseError) {
                console.error("Unable to release failed free listing reservation:", releaseError);
            }
        }
        console.error('Error in addProduct:', error);
        res.json({
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
            .select('_id name price offerPrice image inStock stockQuantity category')
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
            category: product.category || ''
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
        const categories = await Product.distinct('category', { isVisible: true });
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
            { $set: { category: "uncategorized" } }
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