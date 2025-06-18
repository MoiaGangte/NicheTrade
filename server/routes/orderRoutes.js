import express from 'express';
import { placedOrderCOD, getUserOrders, getAllOrders, getOrderDetails, deleteOrder, placeOrderOnline, verifyPayment } from '../controllers/orderController.js';
import { authUser, combinedAuth } from '../middleware/authMiddleware.js';
import authSeller from '../middleware/authSeller.js';

const router = express.Router();

// Place order with COD : /api/order/cod
router.post('/cod', authUser, placedOrderCOD);


// Verify payment : /api/order/verify
router.post('/verify', authUser, verifyPayment);

// Get user orders
router.get('/user', authUser, getUserOrders);

// Get all orders (for sellers)
router.get('/seller', authSeller, getAllOrders);

// Get order details (for both users and sellers)
router.get('/details/:orderId', combinedAuth, getOrderDetails);

// Delete order
router.delete('/:orderId', authUser, deleteOrder);

export default router;