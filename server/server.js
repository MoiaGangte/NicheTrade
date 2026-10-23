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
import donationRouter from './routes/donationRoute.js';
import adminRouter from './routes/adminRoute.js';
import lostFoundRouter from './routes/lostFoundRoute.js';
import requestItemRouter from './routes/requestItemRoute.js';
import session from 'express-session';
import passport from 'passport';
import './configs/passport.js';
import jwt from 'jsonwebtoken';
import queryString from 'query-string';


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
        allowedOrigins.push('http://localhost:8081', 'http://127.0.0.1:8081');

        // Fallback defaults when no env var provided
///////////////////// provided the origin in vercel and local host for development 
        if (allowedOrigins.length === 0) {
            allowedOrigins.push('https://nichetrade.vercel.app', 'http://localhost:5173');
        }

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Removed Permissions-Policy header to avoid violations with tracking scripts
// app.use((req, res, next) => {
//     res.setHeader('Permissions-Policy', 'accelerometer=(), gyroscope=(), magnetometer=()');
//     next();
// });

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
app.use('/api/donation', donationRouter);
app.use('/api/admin', adminRouter);
app.use('/api/lost-found', lostFoundRouter);
app.use('/api/request-items', requestItemRouter);

//////////////////////////
/////////////////////

app.get('/api/user/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Issue JWT
    const user = req.user;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    if (req.session.mobileAuthRedirect === 'nichetrade://auth') {
        const mobileCode = jwt.sign({ id: user._id, mobileAuth: true }, process.env.JWT_SECRET, { expiresIn: '60s' });
        const mobileState = req.session.mobileAuthState;
        delete req.session.mobileAuthRedirect;
        delete req.session.mobileAuthState;
        return req.session.save((error) => {
            if (error) return res.status(500).json({ success: false, message: 'Unable to complete mobile sign-in' });
            res.redirect(`nichetrade://auth?${queryString.stringify({ code: mobileCode, state: mobileState })}`);
        });
    }

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
