import express from 'express';
import { placedOrderCOD, placeOrder, getUserOrders, getAllOrders, getOrderDetails, deleteOrder, placeOrderOnline, verifyPayment, updateOrderStatus } from '../controllers/orderController.js';
import { authUser } from '../middleware/authMiddleware.js';
import authSeller from '../middleware/authSeller.js';

const router = express.Router();

// Place order with COD : /api/order/cod
router.post('/cod', authUser, placedOrderCOD);
router.post('/place', authUser, placeOrder);


// Verify payment : /api/order/verify
router.post('/verify', authUser, verifyPayment);

// Get user orders
router.get('/user', authUser, getUserOrders);

// Get all orders (for sellers)
router.get('/seller', authSeller, getAllOrders);
router.put('/seller/status/:orderId', authSeller, updateOrderStatus);

// Get order details (for both users and sellers)
router.get('/seller/details/:orderId', authSeller, getOrderDetails);
router.get('/details/:orderId', authUser, getOrderDetails);

// Delete order
router.delete('/:orderId', authUser, deleteOrder);

export default router;