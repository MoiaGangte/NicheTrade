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
import adminRouter from './routes/adminRoute.js';
import feedbackRouter from './routes/feedbackRoute.js';
import session from 'express-session';
import passport from 'passport';
import './configs/passport.js';
import jwt from 'jsonwebtoken';
import queryString from 'query-string';
import Razorpay from 'razorpay';


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
// CORS middleware configuration
app.use(cors({
    origin: (origin, callback) => {
        const envOrigins = process.env.FRONTEND_URL || '';
        const allowedOrigins = envOrigins
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        // Fallback defaults when no env var provided
        if (allowedOrigins.length === 0) {
            allowedOrigins.push('https://eimi-cart.vercel.app', 'http://localhost:5173');
        }

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Permissions-Policy header: disable device sensor features to avoid browser warnings
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'accelerometer=(), gyroscope=(), magnetometer=()');
    next();
});

//Middleware configuration//
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Add session and passport middleware
app.use(session({ secret: 'your_secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

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
app.use('/api/admin', adminRouter);
app.use('/api/feedback', feedbackRouter);

//////////////////////////
app.get('/api/user/google', (req, res, next) => {
  console.log('Google OAuth route hit');
  next();
}, passport.authenticate('google', { scope: ['profile', 'email'] }));
/////////////////////////

app.get('/api/user/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Issue JWT
    const user = req.user;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Redirect to frontend with token and user info as query params//
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
        const params = queryString.stringify({
            token,
            name: user.name,
            email: user.email,
            userId: user._id
        });
        res.redirect(`${frontendUrl}/google-auth-success?${params}`);
  }
);

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

/////be me not validate the code/////////////////////////////////

app.post("/order", async (req, res) => {
    try {
        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const options = req.body;
        const order = await razorpayInstance.orders.create(options);

        if (!order) {
            return res.status(500).json({ error: 'Failed to create order' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).send("Error");
    }
});


