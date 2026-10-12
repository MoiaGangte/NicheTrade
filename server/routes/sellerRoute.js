import express from 'express';
import { isSellerAuth, sellerLogin, sellerLogout, sellerRegister } from '../controllers/sellerController.js';
import {
    createSellerSubscriptionOrder,
    getSellerSubscriptionStatus,
    verifySellerSubscriptionPayment,
} from '../controllers/sellerSubscriptionController.js';
import authSeller from '../middleware/authSeller.js';

const sellerRouter = express.Router();

sellerRouter.post('/register', sellerRegister);
sellerRouter.post('/login', sellerLogin);
sellerRouter.get('/is-auth', authSeller, isSellerAuth);
sellerRouter.get('/logout', authSeller, sellerLogout);
sellerRouter.get('/subscription/status', authSeller, getSellerSubscriptionStatus);
sellerRouter.post('/subscription/create-order', authSeller, createSellerSubscriptionOrder);
sellerRouter.post('/subscription/verify', authSeller, verifySellerSubscriptionPayment);

export default sellerRouter;