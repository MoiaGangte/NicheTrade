import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import mongoose from "mongoose";

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, address } = req.body;
        const userId = req.userId;

        console.log("Payment verification started");
        console.log("Order ID:", razorpay_order_id);
        console.log("Payment ID:", razorpay_payment_id);
        console.log("Signature:", razorpay_signature);

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        console.log("Expected Signature:", expectedSignature);
        console.log("Received Signature:", razorpay_signature);

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            console.log("Signature verification failed");
            return res.json({ 
                success: false, 
                message: "Invalid payment signature" 
            });
        }

        console.log("Signature verification successful");

        // Create order in database
        if (items && address) {
            // Convert userId to ObjectId
            const userObjectId = new mongoose.Types.ObjectId(userId);

            // Calculate amount using items
            let amount = 0;
            for (const item of items) {
                const product = await Product.findById(item.product);
                if (!product) {
                    return res.json({ success: false, message: `Product not found: ${item.product}` });
                }
                if (!product.inStock || product.stockQuantity < item.quantity) {
                    return res.json({ 
                        success: false, 
                        message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}` 
                    });
                }
                amount += product.offerPrice * item.quantity;
            }

            // Add Tax Charge (10%)
            amount += Math.floor(amount * 0.10);

            // Create order
            const order = await Order.create({
                userId: userObjectId,
                items: items.map(item => ({
                    product: new mongoose.Types.ObjectId(item.product),
                    quantity: item.quantity
                })),
                amount,
                address: new mongoose.Types.ObjectId(address),
                paymentType: "ONLINE",
                status: "confirmed",
                isPaid: true,
                paymentId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id
            });

            // Update stock quantities
            for (const item of items) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.stockQuantity -= item.quantity;
                    
                    // If stock is depleted, mark as out of stock
                    if (product.stockQuantity <= 0) {
                        product.inStock = false;
                        product.isVisible = false;
                    }
                    
                    await product.save();
                }
            }

            // Clear user's cart
            await User.findByIdAndUpdate(userId, { cartItems: {} });

            console.log("Order created successfully:", order._id);

            res.json({ 
                success: true, 
                message: "Payment verified and order placed successfully",
                order 
            });
        } else {
            // Just verify the payment without creating order (for existing orders)
            res.json({ 
                success: true, 
                message: "Payment verified successfully" 
            });
        }

    } catch (error) {
        console.error('Error in verifyPayment:', error);
        res.json({ 
            success: false, 
            message: error.message || "Failed to verify payment" 
        });
    }
};

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
    try {
        const { amount, currency = "INR" } = req.body;
        const options = {
            amount: amount * 100, // amount in paise
            currency,
            receipt: `order_rcptid_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        res.json({ success: true, order });
    } catch (error) {
        console.error('Error in createOrder:', error);
        res.json({ success: false, message: error.message });
    }
};