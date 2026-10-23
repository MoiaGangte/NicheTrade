# NicheTrade mobile

Separate Expo/React Native app for the existing NicheTrade marketplace. The original Vite website, Express API, MongoDB database, account records, and image hosting remain in place.

## Run

Install packages with `npm install`, then:

- Android: `npm run android`
- iOS: `npm run ios` (requires macOS and Xcode)
- Start Metro for an installed development build: `npm start`
- Generate native projects: `npm run prebuild`

Razorpay seller-listing checkout is a native module, so use an Expo development/production build rather than Expo Go. Android builds require Android Studio/SDK; building iOS requires a Mac. The app uses NicheTrade's existing server-side listing payment order and signature verification; no secret payment credentials are embedded in the app.

## API environments

- `.env.development` targets the existing local API through the Android emulator host (`10.0.2.2:5000`). Use your computer's LAN IP for a physical phone and `localhost:5000` for the iOS simulator.
- `.env.production` targets the verified deployed Express API at `https://eimi-cart-backend.vercel.app`.
- Override `EXPO_PUBLIC_API_URL` in the build environment for other deployments. Only public API URLs belong in `EXPO_PUBLIC_*`; never put server secrets or privileged keys there.

The production endpoint was verified to return the existing API health check and live `/api/product/categories` response. It is the backend URL already documented in `client/.env` (commented out) and `server/configs/passport.js`.

## Existing feature to mobile screen/API map

| Existing website/backend capability | Native surface | Existing API/data reused |
| --- | --- | --- |
| Marketplace homepage, live listings, category browsing and search | Home and Explore tabs | `/api/product/list`, `/api/product/categories`; existing Product/Seller records and image URLs |
| Product detail, seller information, favorites, and cart | Product detail, Saved listings, Cart | `/api/product/id`, `/api/user/favorites/update`, `/api/cart/update` |
| Email and register-number login, student registration, Google OAuth | Account screen | `/api/user/login`, `/register`, `/login-register-number`; existing Google Passport flow |
| User profile and address book | Edit profile and Saved addresses | `/api/user/profile`, `/api/address/*` |
| Checkout, campus pickup, order history/cancellation | Cart and Orders tabs | `/api/order/place`, `/api/order/user`, `/api/order/:orderId` |
| Seller registration, inventory, images, listing credits/payments, orders | Sell tab | `/api/seller/*`, `/api/product/*`, `/api/order/seller*`; existing Cloudinary and Razorpay-backed services |
| Lost and Found browse, report, and resolve | Lost & Found screen | `/api/lost-found/*`; existing LostFoundPost collection and Cloudinary |
| Requested items, offers to fulfill, and posting | Item requests screen | `/api/request-items/*`; existing RequestItem collection and Cloudinary |
| Admin sign-in and moderation of sellers, listings, lost/found, requests, uploads | Admin moderation screen | `/api/admin/*`; existing configured admin account and MongoDB records |

No duplicate database, mock marketplace records, or fixed category list is introduced. Categories and listing content are fetched from the shared API.

## Mobile authentication transport

User login and registration reuse the existing endpoints and store the existing JWT in Expo SecureStore. Google OAuth returns a state-checked, 60-second mobile code to the `nichetrade://auth` app link; the app exchanges that code for the same account's normal JWT. For mobile Google registration, student details are encrypted server-side and expire after five minutes so they can cross from the app to the browser-based Passport session without exposing personal details in the OAuth URL. Admin bearer-token support is additive; the existing web admin cookie and website login continue working. Register the existing production callback URL with the Google OAuth client as before.
