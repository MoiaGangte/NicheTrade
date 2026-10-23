import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Address from "../models/Address.js";
import mongoose from "mongoose";

const deliveryLocationOptions = ['AFC', 'Near Department Store', 'MBA Canteen', 'Cafe Canteen', 'Other'];
const deliveryTimeOptions = ['During lunch break', 'After college', 'Other'];

export const placeOrder = async (req, res) => {
    try {
        const {
            items,
            deliveryLocation,
            customDeliveryLocation = '',
            deliveryTime,
            customDeliveryTime = '',
        } = req.body;

        if (
            !Array.isArray(items) ||
            items.length === 0 ||
            !deliveryLocationOptions.includes(deliveryLocation) ||
            !deliveryTimeOptions.includes(deliveryTime) ||
            typeof customDeliveryLocation !== 'string' ||
            typeof customDeliveryTime !== 'string' ||
            (deliveryLocation === 'Other' && !customDeliveryLocation.trim()) ||
            (deliveryTime === 'Other' && !customDeliveryTime.trim()) ||
            customDeliveryLocation.length > 120 ||
            customDeliveryTime.length > 120
        ) {
            return res.status(400).json({ success: false, message: 'Choose valid delivery details and add custom details where needed' });
        }

        const normalizedItems = [];
        const productsById = new Map();
        const quantitiesByProduct = new Map();
        for (const item of items) {
            if (
                !item ||
                !mongoose.isValidObjectId(item.product) ||
                !Number.isInteger(item.quantity) ||
                item.quantity < 1 ||
                item.quantity > 9
            ) {
                return res.status(400).json({ success: false, message: 'Invalid order items' });
            }

            const productId = item.product.toString();
            quantitiesByProduct.set(productId, (quantitiesByProduct.get(productId) || 0) + item.quantity);
        }

        for (const [productId, quantity] of quantitiesByProduct) {
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ success: false, message: 'A product in your cart is no longer available' });
            }
            if (!product.inStock || product.stockQuantity < quantity) {
                return res.status(409).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`,
                });
            }

            productsById.set(productId, product);
            normalizedItems.push({
                product: new mongoose.Types.ObjectId(productId),
                quantity,
            });
        }

        const amount = normalizedItems.reduce((total, item) => {
            const product = productsById.get(item.product.toString());
            return total + product.offerPrice * item.quantity;
        }, 0);

        const order = await Order.create({
            userId: new mongoose.Types.ObjectId(req.userId),
            items: normalizedItems,
            amount,
            deliveryLocation,
            customDeliveryLocation: deliveryLocation === 'Other' ? customDeliveryLocation.trim() : '',
            deliveryTime,
            customDeliveryTime: deliveryTime === 'Other' ? customDeliveryTime.trim() : '',
            paymentType: 'NONE',
            status: 'Order Placed',
        });

        for (const item of normalizedItems) {
            const product = productsById.get(item.product.toString());
            product.stockQuantity -= item.quantity;
            if (product.stockQuantity <= 0) {
                product.inStock = false;
                product.isVisible = false;
            }
            await product.save();
        }

        await User.findByIdAndUpdate(req.userId, { cartItems: {} });

        return res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order,
        });
    } catch (error) {
        console.error('Error placing order:', error);
        return res.status(500).json({ success: false, message: error.message || 'Failed to place order' });
    }
};

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

// get order by user id : /api/order/user
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.userId;
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        let orders = await Order.find({ 
            userId: userObjectId, 
            isHidden: false, // Only get non-hidden orders
            $or: [{ paymentType: "COD" }, { paymentType: "NONE" }, { isPaid: true }]
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
            $or: [{ paymentType: "COD" }, { paymentType: "NONE" }, { isPaid: true }]
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
        const sellerProducts = await Product.find({ sellerId: req.sellerId }).select('_id').lean();
        const productIds = sellerProducts.map((product) => product._id);
        if (productIds.length === 0) {
            return res.json({ success: true, orders: [] });
        }

        const orders = await Order.find({
            'items.product': { $in: productIds },
            $or: [{ paymentType: "COD" }, { paymentType: "NONE" }, { isPaid: true }]
        })
        .populate({
            path: 'userId',
            select: 'name email mobileNumber department registerNumber studentType'
        })
        .populate({
            path: 'items.product',
            select: 'name image category price offerPrice sellerId'
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
                select: 'name email mobileNumber department registerNumber studentType'
            })
            .populate({
                path: 'items.product',
                select: 'name image category price offerPrice sellerId'
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

        if (isSeller) {
            order.items = order.items.filter((item) =>
                item.product?.sellerId?.toString() === req.sellerId.toString()
            );
            if (order.items.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "You don't have permission to view this order"
                });
            }
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
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (!['Processing', 'Shipped', 'Delivered'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid order status" });
        }

        const sellerProducts = await Product.find({ sellerId: req.sellerId }).distinct('_id');
        const sellerProductIds = new Set(sellerProducts.map((productId) => productId.toString()));
        const ownsOrderItem = order.items.some((item) => sellerProductIds.has(item.product.toString()));
        if (!ownsOrderItem) {
            return res.status(403).json({ success: false, message: "You don't have permission to update this order" });
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
        res.status(500).json({
            success: false, 
            message: error.message || "Failed to update order status" 
        });
    }
};
