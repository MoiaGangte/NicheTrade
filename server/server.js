import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import connectDB from './configs/db.js';
import 'dotenv/config';
import userRouter from './routes/userRoute.js';
import sellerRouter from './routes/sellerRoute.js';
import connectCloudinary from './configs/cloudinary.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoutes.js';
import addressRouter from './routes/addressRoute.js';
import reviewRouter from './routes/reviewRoutes.js';
import paymentRouter from './routes/paymentRoute.js';

const app = express();
const port = process.env.PORT || 5000;

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});

// Connect to database and cloudinary
try {
    await connectDB();
    await connectCloudinary();
    console.log('Database and Cloudinary connected successfully');
} catch (error) {
    console.error('Error connecting to services:', error);
    process.exit(1);
}

// CORS middleware configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || ['http://localhost:5173','https://eimi-cart.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));

// Middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Routes
app.get('/', (_req, res) => res.send("API is Working"));
app.use('/api/user', userRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/address', addressRouter);
app.use('/api/review', reviewRouter);
app.use('/api/order', orderRouter);
app.use('/api/payment', paymentRouter);


// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
    } else {
        console.error('Server error:', error);
    }
    process.exit(1);
});

//be mee not validate the code//////////////////////////////////////////////////////////

app.post("/order", async (req, res) => {
    try {
        const razorpay = new razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const options = req.body;
        const order = await razorpay.orders.create(options);

        if (!order) {
            return res.status(500).json({ error: 'Failed to create order' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).send("Error");
    }
});


