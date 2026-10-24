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

- `.env` targets the local API through the Android emulator host (`10.0.2.2:5000`). Use your computer's LAN IP for a physical phone and `localhost:5000` for the iOS simulator.
- `.env.production` targets the configured deployed API at `https://niche-trade-21x2.vercel.app/`.
- Override `EXPO_PUBLIC_API_URL` in the build environment for other deployments. Only public API URLs belong in `EXPO_PUBLIC_*`; never put server secrets or privileged keys there.

The production endpoint was verified to return the existing API health check and live `/api/product/categories` response. It is the backend URL already documented in `client/.env` (commented out) and `server/configs/passport.js`.

## Build an installable Android APK with EAS

The `preview` EAS profile builds an internally distributable APK and embeds the HTTPS production API origin. From this directory:

```powershell
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

The first EAS setup requires an Expo account and may prompt to create/link the EAS project. Keep the generated `extra.eas.projectId` in `app.json`. Download the completed APK from the build link shown by EAS or from the project's EAS Build page. Transfer it to the Android phone, open the file, allow installation from that source if Android asks, and install. This internal APK is for direct testing/sharing, not Play Store publishing.

Confirm the production API origin in `eas.json` is reachable and has the required production callback configuration before building. The Vercel API may not reliably support long-lived Socket.IO connections; messaging requires the API to run on a persistent Node.js host.

## Existing feature to mobile screen/API map

| Existing website/backend capability | Native surface | Existing API/data reused |
| --- | --- | --- |
| Marketplace homepage, live listings, category browsing and search | Home and Explore tabs | `/api/product/list`, `/api/product/categories`; existing Product/Seller records and image URLs |
| Product detail, seller information, favorites, and cart | Product detail, Saved listings, Cart | `/api/product/id`, `/api/user/favorites/update`, `/api/cart/update` |
| Email and register-number login, student registration, Google OAuth | Account screen | `/api/user/login`, `/register`, `/login-register-number`; existing Google Passport flow |
| Buyer/seller messaging, order notices, unread conversations | Messages tab, product chat action | `/api/messages/*`; MongoDB conversations/messages and authenticated Socket.IO |
| User profile and address book | Edit profile and Saved addresses | `/api/user/profile`, `/api/address/*` |
| Checkout, campus pickup, order history/cancellation | Cart and Orders tabs | `/api/order/place`, `/api/order/user`, `/api/order/:orderId` |
| Seller registration, inventory, images, listing credits/payments, orders | Sell tab | `/api/seller/*`, `/api/product/*`, `/api/order/seller*`; existing Cloudinary and Razorpay-backed services |
| Lost and Found browse, report, and resolve | Lost & Found screen | `/api/lost-found/*`; existing LostFoundPost collection and Cloudinary |
| Requested items, offers to fulfill, and posting | Item requests screen | `/api/request-items/*`; existing RequestItem collection and Cloudinary |
| Admin sign-in and moderation of sellers, listings, lost/found, requests, uploads | Admin moderation screen | `/api/admin/*`; existing configured admin account and MongoDB records |

No duplicate database, mock marketplace records, or fixed category list is introduced. Categories and listing content are fetched from the shared API.

Real-time messaging requires the Express API to run on a persistent Node.js host with Socket.IO support. The existing Vercel serverless API cannot provide reliable persistent Socket.IO connections. Set `EXPO_PUBLIC_API_URL` to the persistent API origin used by the website.

## Mobile authentication transport

User login and registration reuse the existing endpoints and store the existing JWT in Expo SecureStore. Google OAuth returns a state-checked, 60-second mobile code to the `nichetrade://auth` app link; the app exchanges that code for the same account's normal JWT. Mobile OAuth state is signed by the backend and returned by Google, so the app return target does not depend on an in-memory Express session surviving between OAuth requests. For mobile Google registration, student details remain encrypted server-side and expire after five minutes. Admin bearer-token support is additive; the existing web admin cookie and website login continue working. On Vercel, set `GOOGLE_CLIENT_URL` to the deployed HTTPS backend callback, even if `NODE_ENV` is accidentally set to `development`; the backend selects `GOOGLE_CLIENT_URL` for Vercel deployments. Register this exact callback URL with the Google OAuth client; do not register `nichetrade://auth` as a Google redirect URI.

For local Android-emulator OAuth, the app API uses `http://10.0.2.2:5000`; run `adb reverse tcp:5000 tcp:5000` so Google's local callback at `http://localhost:5000/api/user/google/callback` reaches the computer's backend. A physical phone cannot use the emulator alias or its own `localhost`: use the computer's LAN address for the API and an HTTPS tunnel for the Google callback, and register that exact callback URL in Google Cloud Console.

When testing through Expo Web, Google sign-in returns to the same browser at `/auth` instead of using the native app link. Allow the Expo Web origin in the API environment variable `MOBILE_WEB_ORIGINS` (comma-separated); local development automatically allows `http://localhost:8081` and `http://127.0.0.1:8081`. Production Expo Web origins must be explicitly configured as HTTPS origins. The Google OAuth authorized redirect URI remains the backend callback URL; do not add the Expo Web URL or `nichetrade://auth` there.
