import express from 'express';
import { addReview, getProductReviews } from '../controllers/reviewController.js';

const router = express.Router();

// Add a review
router.post('/add', addReview);

// Get product reviews
router.get('/product/:productId', getProductReviews);

export default router; 