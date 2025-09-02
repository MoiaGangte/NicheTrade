# EimiCart - Authentication System

## Overview
This project now supports both manual email/password authentication and Google OAuth integration. Users can log in using either method, and the system will automatically link accounts if they use the same email address.

## Features

### Manual Authentication
- Users can register with email and password
- Users can login with email and password
- JWT tokens are stored in localStorage for persistence
- Automatic token validation on page refresh

### Google OAuth Integration
- Users can sign in with Google
- Automatic account linking if email already exists
- Seamless integration with manual authentication

### Authentication Persistence
- JWT tokens are automatically stored in localStorage
- User sessions persist across page refreshes
- Automatic token validation and cleanup

## Environment Variables Required

### Backend (.env)
```
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (.env)
```
VITE_BACKEND_URL=http://localhost:5000
```

## How It Works

### Manual Login Flow
1. User enters email and password
2. Backend validates credentials
3. JWT token is generated and returned
4. Frontend stores token in localStorage
5. User is authenticated and redirected

### Google OAuth Flow
1. User clicks "Login with Google"
2. Redirected to Google OAuth
3. After successful authentication, redirected back with token
4. Token is stored in localStorage
5. User is authenticated and redirected

### Account Linking
- If a user signs up manually with email "user@example.com"
- Later signs in with Google using the same email
- The system automatically links the accounts
- User can use either method to login

## Security Features
- JWT tokens with 7-day expiration
- HTTP-only cookies for additional security
- Automatic token cleanup on 401 errors
- Secure password hashing with bcrypt

## API Endpoints

### Authentication
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login
- `GET /api/user/is-auth` - Check authentication status
- `GET /api/user/logout` - User logout

### Google OAuth
- `GET /api/user/google` - Initiate Google OAuth
- `GET /api/user/google/callback` - Google OAuth callback

## Troubleshooting

### Common Issues
1. **401 Unauthorized**: Token expired or invalid, will be automatically cleared
2. **Page refresh logs out user**: Check if JWT_SECRET is properly set
3. **Google OAuth not working**: Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

### Development Setup
1. Set up Google OAuth credentials in Google Cloud Console
2. Configure environment variables
3. Ensure backend is running on correct port
4. Check CORS configuration for frontend URL

## Usage Examples

### Manual Login
```jsx
const { setShowUserLogin } = useAppContext();
setShowUserLogin(true); // Opens login modal
```

### Check Authentication Status
```jsx
const { user } = useAppContext();
if (user) {
    // User is logged in
    console.log('Welcome,', user.name);
}
```

### Logout
```jsx
const { logout } = useAppContext();
logout(); // Clears token and redirects to home
```
