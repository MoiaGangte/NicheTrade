import Review from '../models/Review.js';

// Add a review
export const addReview = async (req, res) => {
    try {
        const { productId, rating, comment, userId } = req.body;

        const review = await Review.create({
            productId,
            userId,
            rating,
            comment
        });

        res.json({ success: true, message: "Review added successfully", review });
    } catch (error) {
        console.error('Error adding review:', error);
        res.json({ success: false, message: error.message });
    }
};

// Get product reviews
export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId })
            .populate('userId', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.json({ success: false, message: error.message });
    }
}; 