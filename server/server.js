import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
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
import chatRouter from './routes/chatRoutes.js';
import session from 'express-session';
import passport from 'passport';
import './configs/passport.js';
import jwt from 'jsonwebtoken';
import queryString from 'query-string';
import { initializeRealtime } from './realtime.js';
import { readMobileGoogleRegistration } from './controllers/userController.js';
import { verifyMobileGoogleOAuthState } from './utils/mobileGoogleOAuth.js';
import notificationRouter from './routes/notificationRoute.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure JWT secret has fallback
process.env.JWT_SECRET = process.env.JWT_SECRET || 'nichetrade-secret-jwt-key-2026';

const app = express();
const port = Number(process.env.PORT) || 3000;

// Connect to database and cloudinary without fatal crash
try {
    await connectDB();
    await connectCloudinary();
    console.log('[AI Studio] Services initialization step finished');
} catch (error) {
    console.warn('[AI Studio] Warning connecting to services:', error.message);
}

const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
allowedOrigins.push(
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.run.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true
}));

// Middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Add session and passport middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'nichetrade-session-secret',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// API status
app.get('/api/health', (_req, res) => res.json({ status: 'ok', message: 'API is working' }));

// API Routes
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
app.use('/api/messages', chatRouter);
app.use('/api/notifications', notificationRouter);

// Google OAuth callback
app.get('/api/user/google/callback',
  (req, res, next) => {
    if (typeof req.query.state !== 'string') return next();
    try {
      const state = verifyMobileGoogleOAuthState(req.query.state);
      if (state.purpose !== 'mobile-google-oauth'
          || typeof state.mobileRedirect !== 'string'
          || typeof state.mobileState !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid mobile Google sign-in state' });
      }
      req.mobileGoogleAuth = {
        redirect: state.mobileRedirect,
        state: state.mobileState,
      };
      if (typeof state.mobileRegistration === 'string') {
        const registration = readMobileGoogleRegistration(state.mobileRegistration);
        if (!registration) {
          return res.status(400).json({ success: false, message: 'Mobile Google registration data is invalid or expired' });
        }
        req.session.googleStudentDetails = registration;
      }
      return next();
    } catch {
      return res.status(400).json({ success: false, message: 'Mobile Google sign-in state is invalid or expired' });
    }
  },
  (req, res, next) => {
    if (!passport._strategies?.google) {
      return res.status(503).json({ success: false, message: 'Google sign-in is not configured' });
    }
    passport.authenticate('google', {
      failureRedirect: '/',
      session: !req.mobileGoogleAuth,
    })(req, res, next);
  },
  (req, res) => {
    const user = req.user;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    if (req.mobileGoogleAuth) {
        const mobileCode = jwt.sign({ id: user._id, mobileAuth: true }, process.env.JWT_SECRET, { expiresIn: '60s' });
        const callbackParams = { code: mobileCode, state: req.mobileGoogleAuth.state };
        if (req.mobileGoogleAuth.redirect === 'nichetrade://auth') {
            return res.redirect(`nichetrade://auth?${queryString.stringify(callbackParams)}`);
        }
        const webRedirect = new URL(req.mobileGoogleAuth.redirect);
        Object.entries(callbackParams).forEach(([key, value]) => webRedirect.searchParams.set(key, value));
        return res.redirect(webRedirect.toString());
    }

    const frontendUrl = process.env.FRONTEND_URL || '';
    const params = queryString.stringify({
        token,
        name: user.name,
        email: user.email,
        userId: user._id
    });
    res.redirect(`${frontendUrl}/google-auth-success?${params}`);
  }
);

// Mongoose / Database offline graceful fallback middleware (Phase 2.2)
app.use((err, req, res, next) => {
  if (err.name === 'MongooseError' || err.name === 'MongoNetworkError' || (err.message && err.message.includes('buffering timed out'))) {
    console.warn('[AI Studio] Database offline — returning mock response for', req.method, req.path);
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : { success: false, message: 'Database offline' });
    }
    return res.status(503).json({ success: false, message: 'Service temporarily unavailable (database offline)' });
  }
  next(err);
});

// General API error handling middleware
app.use('/api', (err, _req, res, _next) => {
    console.error('API Error:', err);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Frontend Serving: Vite dev middleware or static dist
const clientDir = path.resolve(__dirname, '../client');
const clientDistDir = path.resolve(clientDir, 'dist');
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  try {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: clientDir,
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(clientDir, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } catch (err) {
    console.warn('[AI Studio] Vite middleware fallback to static client dist:', err.message);
    app.use(express.static(clientDistDir));
    app.get('*', (_req, res) => {
      const indexPath = path.resolve(clientDistDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send('<h1>NicheTrade</h1><p>Building client assets...</p>');
      }
    });
  }
} else {
  app.use(express.static(clientDistDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(clientDistDir, 'index.html'));
  });
}

// Start server
const server = createServer(app);
initializeRealtime(server, allowedOrigins);
server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
    } else {
        console.error('Server error:', error);
    }
});
