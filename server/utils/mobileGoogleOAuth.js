import jwt from 'jsonwebtoken';

const mobileWebOrigins = new Set(
    (process.env.MOBILE_WEB_ORIGINS || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
);

if (process.env.NODE_ENV !== 'production') {
    mobileWebOrigins.add('http://localhost:8081');
    mobileWebOrigins.add('http://127.0.0.1:8081');
}

export const isAllowedMobileWebRedirect = (value) => {
    try {
        const redirect = new URL(value);
        const isSecure = redirect.protocol === 'https:';
        const isLocalDevelopment = process.env.NODE_ENV !== 'production'
            && redirect.protocol === 'http:'
            && ['localhost', '127.0.0.1'].includes(redirect.hostname);
        return redirect.pathname === '/auth'
            && !redirect.search
            && !redirect.hash
            && !redirect.username
            && !redirect.password
            && mobileWebOrigins.has(redirect.origin)
            && (isSecure || isLocalDevelopment);
    } catch {
        return false;
    }
};

export const createMobileGoogleOAuthState = (payload) => jwt.sign(
    { purpose: 'mobile-google-oauth', ...payload },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
);

export const verifyMobileGoogleOAuthState = (state) => jwt.verify(state, process.env.JWT_SECRET);
