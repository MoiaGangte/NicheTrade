# EimiCart Beginner Guide

## 1. What is this project?

EimiCart is a full-stack e-commerce web app that lets users:

- register and log in
- browse products
- add products to cart
- add products to favorites
- place orders
- view order history
- use Google login
- seller can add products and manage stock

This project uses:

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB with Mongoose
- Authentication: JWT and cookies
- Cloud storage: Cloudinary
- Payment: Razorpay
- Styling: Tailwind CSS

---

## 2. Project structure

```text
EimiCart/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── server/                  # Node.js backend
│   ├── configs/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
│
├── README.md
└── EimiCart_Beginner_Guide.md
```

### Frontend responsibilities

The frontend is responsible for:

- showing pages
- handling user login UI
- showing product lists
- cart behavior
- routes like /products, /cart, /profile, /seller

### Backend responsibilities

The backend is responsible for:

- handling requests from frontend
- connecting to MongoDB
- validating login and JWT tokens
- saving products and orders
- processing payments
- uploading images to Cloudinary

---

## 3. Main technologies explained

### React

React is a JavaScript library used to build UI.

Example:

```jsx
const Home = () => {
  return <div>Hello EimiCart</div>
}
```

This code creates a component named Home. A component is a reusable block of UI.

### JSX

JSX is JavaScript with HTML-like syntax.

```jsx
<div className="text-red-500">Welcome</div>
```

It is used in React files like App.jsx and components.

### Node.js and Express

Node.js runs JavaScript on the server. Express is a framework that helps create APIs.

```js
import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('API is Working'));
```

This means:

- app is the server
- / is the route
- GET request to / returns text

### MongoDB and Mongoose

MongoDB stores data, and Mongoose helps interact with MongoDB using JavaScript objects.

```js
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }
});
```

This defines the data structure for a user.

### JWT

JWT means JSON Web Token. It identifies the logged-in user.

```js
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
```

This creates a token that stores the user's id and expires in 7 days.

---

## 4. Backend architecture

### server.js

This is the main server file.

```js
const app = express();
const port = process.env.PORT || 5000;
```

This creates the Express app and chooses the port.

Then it runs:

```js
await connectDB();
await connectCloudinary();
```

This connects the app to MongoDB and Cloudinary.

Then middleware is added:

```js
app.use(express.json());
app.use(cors({ ... }));
app.use(cookieParser());
app.use(session(...));
app.use(passport.initialize());
```

This means:

- parse JSON request body
- allow requests from frontend
- read cookies
- enable login sessions
- initialize Google authentication

Routes are registered:

```js
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
```

This groups different endpoints by feature.

Example:

- /api/user/login
- /api/product/list
- /api/order/cod

---

## 5. Understanding syntax in the real project

### 5.1 Importing modules

```js
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
```

This means: bring in code from other files or libraries.

`import` is ES Module syntax used in Node with `"type": "module"` in package.json.

### 5.2 Creating routes

```js
const userRouter = express.Router();
userRouter.post('/register', register)
```

This creates a router and maps a POST request to the register controller.

### 5.3 Async and await

```js
export const register = async (req, res) => {
  const user = await User.create({ ... });
}
```

`async` makes the function asynchronous.

`await` waits until the database operation completes before moving on.

### 5.4 Request and response objects

```js
(req, res) => {
  return res.json({ success: true, user });
}
```

- `req` = incoming data from client
- `res` = response sent back

### 5.5 Middleware

Middleware runs between the request and the response.

```js
export const authUser = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });
  next();
};
```

This checks if a valid token exists. If not, it blocks access.

### 5.6 JWT verification

```js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

This checks whether the token is valid and trusted.

### 5.7 Object destructuring

```js
const { name, email, password } = req.body;
```

This extracts values from the request body.

### 5.8 Optional chaining and default values

```js
const user = await User.findById(decoded.id).select('-password');
```

This gets the user while hiding the password field.

---

## 6. Models explained

### User model

```js
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    googleId: { type: String, required: false, unique: true, sparse: true },
    cartItems: { type: Object, default: {} },
    favorites: { type: Object, default: {} }
}, { minimize: false })
```

This tells MongoDB:

- name is required
- email must be unique
- password may be empty for Google users
- cartItems stores product quantities by product id
- favorites stores favorite product ids

### Product model

```js
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: Array, required: true },
    price: { type: Number, required: true },
    offerPrice: { type: Number, required: true },
    image: { type: Array, required: true },
    category: { type: String, required: true },
    inStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, required: true, default: 0 },
    isBestSeller: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
}, { timestamps: true })
```

This creates all the product fields used in the shop.

---

## 7. Controller logic explained

### User controller

```js
export const register = async (req, res) => {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.json({ success: false, message: 'User already exists' });
    }
```

This checks:

- Did the user send all values?
- Does the email already exist?

Then it hashes the password:

```js
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
```

This protects the password before saving it.

Next, it creates the user:

```js
const user = await User.create({ name, email, password: hashedPassword });
```

And creates a JWT token:

```js
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
```

### Product controller

```js
export const addProduct = async (req, res) => {
    let productData = JSON.parse(req.body.productData);
    const images = req.files;
```

This reads product JSON and uploaded image files.

Then Cloudinary upload is done:

```js
let imagesUrl = await Promise.all(
    images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
        return result.secure_url;
    })
);
```

This uploads each image and saves the public URL.

---

## 8. Frontend architecture

### main.jsx

```jsx
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </BrowserRouter>,
)
```

This is the starting point of the React app.

- BrowserRouter enables page routing
- AppContextProvider makes app-wide data available
- App renders the main application

### App.jsx

This file defines the entire route structure.

```jsx
<Routes>
  <Route path='/' element={<Home />} />
  <Route path='/products' element={<AllProduct />} />
  <Route path='/cart' element={<Cart />} />
  <Route path='/profile' element={<Profile />} />
</Routes>
```

This means the app loads different pages based on the URL.

### Context API

```jsx
export const AppContext = createContext();
```

This creates a global data container that all components can access.

In AppContext.jsx, the app stores:

- user
- isSeller
- products
- cartItems
- favorites
- searchQuery

This is important because many different pages need the same data.

Example:

```jsx
const [cartItems, setCartItems] = useState({})
```

This stores the cart as an object like:

```js
{ "64abc": 2, "64def": 1 }
```

Where the key is product id and value is quantity.

### useEffect

```jsx
useEffect(() => {
  fetchUser();
  fetchSeller();
  fetchProducts();
}, [])
```

This runs once when the app loads.

It fetches:

- user details
- seller status
- products list

### axios interceptors

```js
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

This adds the token automatically to every request to the backend.

---

## 9. Shopping flow in the app

### Step 1: User registers or logs in

User sends email and password to /api/user/login or /api/user/register.

### Step 2: Backend creates JWT token

The server creates a token and sends it to the frontend.

### Step 3: Frontend stores token

```js
localStorage.setItem('token', token)
```

### Step 4: App checks authentication

The frontend calls:

```js
axiosInstance.get('/api/user/is-auth')
```

The server verifies the token and returns user data.

### Step 5: Products are loaded

```js
const { data } = await axiosInstance.get('/api/product/list');
```

This loads all visible products from MongoDB.

### Step 6: Add to cart

```js
const addToCart = (itemId) => {
  let cartData = structuredClone(cartItems);
  cartData[itemId] = 1;
  setCartItems(cartData);
}
```

This updates the cart object in local React state.

### Step 7: Cart sync to backend

```js
useEffect(() => {
  if (user) {
    axiosInstance.post('/api/cart/update', { cartItems })
  }
}, [cartItems, user])
```

This sends the new cart to the server and saves it to the user.

---

## 10. Seller side

The seller dashboard is under /seller.

Seller login is handled through:

```js
sellerRouter.post('/login', sellerLogin)
```

Seller routes are protected by middleware:

```js
import authSeller from '../middleware/authSeller.js';
```

Seller can:

- add products
- check product list
- update stock
- view orders

The seller route is configured in App.jsx:

```jsx
<Route path='/seller' element={isSeller ? <SellerLayout /> : <SellerLogin />}>
```

This means if the seller is authenticated, the seller dashboard is shown.

---

## 11. Authentication explained

### authMiddleware.js

```js
const token = bearerToken || req.cookies.token;
```

The server accepts the token from:

- Authorization header (Bearer token)
- cookie token

Then it verifies the token:

```js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

If the token belongs to a user, it loads the user from DB and continues.

If not, it returns 401 unauthorized.

This is security logic.

---

## 12. Google OAuth

This project supports Google login.

```js
app.get('/api/user/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
```

This redirects the user to Google login.

After login:

```js
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
res.redirect(`${frontendUrl}/google-auth-success?${params}`);
```

The server sends the token back to the frontend and redirects to a success page.

---

## 13. Payment flow

The server includes Razorpay integration.

```js
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
```

This initializes Razorpay.

Then it creates an order with:

```js
const order = await razorpayInstance.orders.create(options);
```

This is used for online payments.

---

## 14. Important beginner syntax terms

### const

Used for values that do not change.

```js
const app = express();
```

### let

Used when value may change.

```js
let cartData = structuredClone(cartItems);
```

### function

Defines reusable logic.

```js
const logout = async () => {
  // logic
}
```

### return

Sends back a value from a function.

```js
return res.json({ success: true, user });
```

### try/catch

Handles errors safely.

```js
try {
  // code
} catch (error) {
  console.error(error);
}
```

### .map()

Loops through arrays and returns transformed values.

```js
images.map(async (item) => {
  return item.path;
})
```

### .find()

Finds one matching item.

```js
const product = products.find((p) => p._id === itemId);
```

### .filter()

Returns items that match a condition.

### JSON.stringify / JSON.parse

```js
JSON.parse(req.body.productData)
```

Used to convert string data into JavaScript objects.

---

## 15. Summary of the app flow

A beginner can think of the project like this:

1. User opens the website.
2. Frontend loads products from backend.
3. User signs in.
4. Backend gives a JWT token.
5. Frontend saves token and user info.
6. User adds products to cart.
7. Cart is synced to backend.
8. User places order.
9. Backend stores order in MongoDB.
10. Seller manages stock and sees orders.

---

## 16. Best learning tips

- Start from `server.js` and `App.jsx`
- Then read `models` and `controllers`
- Next read `routes` to see API endpoints
- Finally read `context/AppContext.jsx` to understand shared app data

This is the cleanest way to understand the project.

---

## 17. Final conclusion

EimiCart is a complete e-commerce app made using modern web technologies. It shows how a real-world full-stack project works using:

- React for interface
- Express for APIs
- MongoDB for data
- JWT for login
- Cloudinary for images
- Razorpay for payments

If you are a beginner, the most important things to learn are:

- React components
- JSX syntax
- useState and useEffect
- Express routing
- MongoDB schemas
- async/await
- JWT authentication

These are the core building blocks used in this project.
