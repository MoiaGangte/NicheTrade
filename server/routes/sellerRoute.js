import express from 'express';
import { isSellerAuth, sellerRegister } from '../controllers/sellerController.js';
import authSeller from '../middleware/authSeller.js';
import { authUser } from '../middleware/authMiddleware.js';
import { createSellerUploadRequest, getSellerUploadStatus } from '../controllers/sellerUploadRequestController.js';

const sellerRouter = express.Router();

sellerRouter.post('/register', authUser, sellerRegister);
sellerRouter.get('/is-auth', authUser, isSellerAuth);
sellerRouter.get('/upload-status', authSeller, getSellerUploadStatus);
sellerRouter.post('/upload-requests', authSeller, createSellerUploadRequest);

export default sellerRouter;