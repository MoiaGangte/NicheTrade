import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//add product : /api/product/add
export const addProduct = async (req, res) => {
    try {
        let productData = JSON.parse(req.body.productData);
        const images = req.files;

        if (!images || images.length === 0) {
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
            inStock: true,
            isVisible: true,
            isBestSeller: productData.isBestSeller || false // Ensure isBestSeller is set
        });

        res.json({
            success: true,
            message: "Product Added Successfully",
            product: newProduct
        });

    } catch (error) {
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
        res.json({ success: true, products })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Seller product list : /api/product/seller/list
export const sellerProductList = async (req, res) => {
    try {
        const products = await Product.find({}).select('_id name price offerPrice image inStock stockQuantity category').lean();

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
        const { id, inStock, isVisible, stockQuantity } = req.body;
        
        const updateData = {};
        
        if (inStock !== undefined) {
            updateData.inStock = inStock;
        }
        
        if (isVisible !== undefined) {
            updateData.isVisible = isVisible;
        }
        
        if (stockQuantity !== undefined) {
            updateData.stockQuantity = parseInt(stockQuantity);
            // If stock quantity is being set, also update inStock based on quantity
            if (updateData.stockQuantity > 0 && !updateData.inStock) {
                updateData.inStock = true;
            } else if (updateData.stockQuantity === 0 && updateData.inStock !== false) {
                updateData.inStock = false;
            }
        }
        
        await Product.findByIdAndUpdate(id, updateData);
        
        // Provide more specific success message
        let message = "Stock Updated";
        if (stockQuantity !== undefined) {
            message = `Stock quantity updated to ${updateData.stockQuantity}`;
            if (updateData.stockQuantity > 0) {
                message += " - Product is now in stock";
            } else {
                message += " - Product is now out of stock";
            }
        }
        
        res.json({ success: true, message });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

//delete product : /api/product/delete/:id
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndDelete(id);
        res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}