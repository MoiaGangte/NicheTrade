import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Address from "../models/Address.js";
import mongoose from "mongoose";
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay with error handling
let razorpay;
try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.warn('Razorpay credentials not found in environment variables');
    } else {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }
} catch (error) {
    console.error('Error initializing Razorpay:', error);
}

// placed order COD : /api/order/cod 
export const placedOrderCOD = async (req, res) => {
    try {
        const { items, address } = req.body;
        const userId = req.userId;
        
        if (!address || !items || items.length === 0) {
            return res.json({ success: false, message: "Invalid data" })
        }

        // Convert userId to ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);

        //calculate amount using items
        let amount = await items.reduce(async (acc, item) => {
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
            return (await acc) + product.offerPrice * item.quantity;
        }, 0)

        // Add Tax Charge (2%)
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
            paymentType: "COD",
            status: "pending"
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

        res.json({ 
            success: true, 
            message: "Order placed successfully",
            order 
        });

    } catch (error) {
        console.error('Error in placedOrderCOD:', error);
        res.json({ 
            success: false, 
            message: error.message || "Failed to place order" 
        });
    }
}

// Place order with online payment : /api/order/online
export const placeOrderOnline = async (req, res) => {
    try {
        if (!razorpay) {
            return res.json({ 
                success: false, 
                message: "Payment service is not configured. Please contact support." 
            });
        }

        const { items, address } = req.body;
        const userId = req.userId;
        
        if (!address || !items || items.length === 0) {
            return res.json({ success: false, message: "Invalid data" });
        }

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

        // Add Tax Charge (2%)
        amount += Math.floor(amount * 0.10);

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: amount * 100, // Razorpay expects amount in paise
            currency: "INR",
            receipt: `order_${Date.now()}`,
            notes: {
                userId: userId.toString()
            }
        });

        // Create order in database
        const order = await Order.create({
            userId: userObjectId,
            items: items.map(item => ({
                product: new mongoose.Types.ObjectId(item.product),
                quantity: item.quantity
            })),
            amount,
            address: new mongoose.Types.ObjectId(address),
            paymentType: "ONLINE",
            status: "pending",
            razorpayOrderId: razorpayOrder.id
        });

        res.json({ 
            success: true, 
            message: "Order created successfully",
            order,
            razorpayOrder
        });

    } catch (error) {
        console.error('Error in placeOrderOnline:', error);
        res.json({ 
            success: false, 
            message: error.message || "Failed to place order" 
        });
    }
};

// get order by user id : /api/order/user
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.userId;
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        let orders = await Order.find({ 
            userId: userObjectId, 
            isHidden: false, // Only get non-hidden orders
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        }).populate("items.product address").sort({ createdAt: -1 });
        
        // Remove invalid products from each order
        for (let order of orders) {
            const validItems = order.items.filter(item => item.product !== null);
            if (validItems.length !== order.items.length) {
                order.items = validItems;
                await order.save();
            }
        }

        // Refetch orders to ensure populated data is up-to-date
        orders = await Order.find({ 
            userId: userObjectId, 
            isHidden: false,
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        }).populate("items.product address").sort({ createdAt: -1 });

        res.json({ success: true, orders });
    } catch (error) {
        console.error('Error in getUserOrders:', error);
        res.json({ 
            success: false, 
            message: error.message || "Failed to fetch orders" 
        });
    }
}

// get all order (for seller / admin) : /api/order/seller
export const getAllOrders = async (req, res) => {
    try {
        // The authSeller middleware already ensures only sellers can access this endpoint
        // No need to check req.isSeller again

        const orders = await Order.find({
            $or: [{ paymentType: "COD" }, { isPaid: true }]
        })
        .populate({
            path: 'userId',
            select: 'name email'
        })
        .populate({
            path: 'items.product',
            select: 'name image category price offerPrice'
        })
        .populate({
            path: 'address',
            select: 'street city state country zipcode phone'
        })
        .sort({ createdAt: -1 });

        res.json({ success: true, orders });
    } catch (error) {
        console.error('Error in getAllOrders:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Failed to fetch orders" 
        });
    }
};

// get order details : /api/order/details/:orderId
export const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.userId;
        const isSeller = req.isSeller;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        // Find the order and populate necessary fields
        const order = await Order.findById(orderId)
            .populate({
                path: 'userId',
                select: 'name email'
            })
            .populate({
                path: 'items.product',
                select: 'name image category price offerPrice'
            })
            .populate({
                path: 'address',
                select: 'street city state country zipcode phone'
            });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Check permissions
        if (!isSeller && order.userId._id.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to view this order"
            });
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Error in getOrderDetails:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch order details"
        });
    }
};

// Delete order item : /api/order/item/:orderId/:itemId
export const deleteOrderItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const userId = req.userId;

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if the order belongs to the user
        if (!order.userId.equals(userId)) {
            return res.json({
                success: false,
                message: 'Not authorized to modify this order'
            });
        }

        // Remove the item from the order
        order.items = order.items.filter(item => item._id.toString() !== itemId);

        // Recalculate the total amount
        let newAmount = 0;
        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                newAmount += product.offerPrice * item.quantity;
            }
        }

        // Add Tax Charge (2%)
        newAmount += Math.floor(newAmount * 0.10);

        // Update the order amount
        order.amount = newAmount;

        // Save the updated order
        await order.save();

        res.json({
            success: true,
            message: 'Item removed from order successfully'
        });

    } catch (error) {
        console.error('Error in deleteOrderItem:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Delete order : /api/order/:orderId
export const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.userId;

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if the order belongs to the user
        if (!order.userId.equals(userId)) {
            return res.json({
                success: false,
                message: 'Not authorized to delete this order'
            });
        }

        // Check if the order is already delivered or cancelled
        if (order.status === 'Delivered' || order.status === 'Cancelled') {
            return res.json({
                success: false,
                message: 'Cannot delete a delivered or cancelled order'
            });
        }

        // Delete the order completely
        await Order.findByIdAndDelete(orderId);

        res.json({
            success: true,
            message: 'Order cancelled and deleted successfully'
        });

    } catch (error) {
        console.error('Error in deleteOrder:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }

        order.status = status;
        await order.save();

        res.json({ 
            success: true, 
            message: "Order status updated successfully",
            order 
        });
    } catch (error) {
        console.error('Error in updateOrderStatus:', error);
        res.json({ 
            success: false, 
            message: error.message || "Failed to update order status" 
        });
    }
};

// Verify payment : /api/order/verify
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return res.json({ 
                success: false, 
                message: "Invalid payment signature" 
            });
        }

        // Find and update order
        const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
        if (!order) {
            return res.json({ 
                success: false, 
                message: "Order not found" 
            });
        }

        // Update order status
        order.status = "confirmed";
        order.paymentId = razorpay_payment_id;
        await order.save();

        // Update product stock
        for (const item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stockQuantity -= item.quantity;
                if (product.stockQuantity === 0) {
                    product.inStock = false;
                }
                await product.save();
            }
        }

        res.json({ 
            success: true, 
            message: "Payment verified successfully",
            order 
        });

    } catch (error) {
        console.error('Error in verifyPayment:', error);
        res.json({ 
            success: false, 
            message: error.message || "Failed to verify payment" 
        });
    }
};
