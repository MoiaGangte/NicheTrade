import { createContext, useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

// Create axios instance with default config
const axiosInstance = axios.create({
    withCredentials: true,
    baseURL: import.meta.env.VITE_BACKEND_URL
});

// Add response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized error
            console.log('Unauthorized access');
        }
        return Promise.reject(error);
    }
);

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const currency = import.meta.env.VITE_CURRENCY;
    const navigate = useNavigate();
    const [user, setUser] = useState(null)
    const [isSeller, setIsSeller] = useState(false)
    const [showUserLogin, setShowUserLogin] = useState(false)
    const [products, setProducts] = useState([])
    const [cartItems, setCartItems] = useState({})
    const [searchQuery, setSearchQuery] = useState("")
    const [favorites, setFavorites] = useState({})

    //fetch seller status
    const fetchSeller = async () => {
        try {
            const { data } = await axiosInstance.get('/api/seller/is-auth');
            if (data.success) {
                setIsSeller(true)
            } else {
                setIsSeller(false)
            }
        } catch (error) {
            // Don't show error for 401 as it's expected for non-sellers
            if (error.response?.status !== 401) {
                console.error('Error checking seller status:', error);
            }
            setIsSeller(false)
        }
    }

    // fetch user auth status, user data and cart items
    const fetchUser = async () => {
        try {
            const { data } = await axiosInstance.get('/api/user/is-auth');
            if (data.success) {
                setUser(data.user)
                // Set cart items from user data
                setCartItems(data.user.cartItems || {})
            } else {
                setUser(null);
                setCartItems({}) // Clear cart items when no user
            }
        } catch (error) {
            setUser(null)
            setCartItems({}) // Clear cart items on error
        }
    }

    //fetch all products
    async function fetchProducts() {
        try {
            const { data } = await axiosInstance.get('/api/product/list');
            if (data.success) {
                setProducts(data.products);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    //add product to cart
    const addToCart = (itemId) => {
        if (!user) {
            setShowUserLogin(true);
            return;
        }
        let cartData = structuredClone(cartItems);
        cartData[itemId] = 1;
        setCartItems(cartData);
        toast.success("Added to Cart")
    }

    //update cart quantity
    const updateCartItem = (itemId, quantity) => {
        if (!user) {
            setShowUserLogin(true);
            return;
        }
        let cartData = structuredClone(cartItems);
        cartData[itemId] = quantity;
        setCartItems(cartData)
        toast.success("Cart Updated")
    }

    //remove product from cart
    const removeFromCart = (itemId) => {
        if (!user) {
            setShowUserLogin(true);
            return;
        }
        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            cartData[itemId] -= 1;
            if (cartData[itemId] === 0) {
                delete cartData[itemId];
            }
        }
        toast.success("Removed from Cart")
        setCartItems(cartData)
    }

    // get cart items count
    const getCartCount = () => {
        let totalCount = 0;
        for (const item in cartItems) {
            totalCount += cartItems[item];
        }
        return totalCount;
    }

    //total amount
    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            if (itemInfo && cartItems[items] > 0) {
                totalAmount += itemInfo.offerPrice * cartItems[items];
            }
        }
        return Math.floor(totalAmount * 100) / 100;
    }

    useEffect(() => {
        fetchUser()
        fetchSeller()
        fetchProducts()
    }, [])

    //update database cart items
    useEffect(() => {
        const updateCart = async () => {
            if (!user) return; // Don't update if no user is logged in
            
            try {
                const { data } = await axiosInstance.post('/api/cart/update', { cartItems })
                if (!data.success) {
                    toast.error(data.message)
                }
            } catch (error) {
                toast.error(error.message)
            }
        }

        if (user) {
            updateCart()
        }
    }, [cartItems, user])

    const value = {
        navigate, user, setUser, setIsSeller, isSeller,
        showUserLogin, setShowUserLogin, products, currency, 
        addToCart, updateCartItem, removeFromCart, cartItems, 
        setCartItems, searchQuery, setSearchQuery, getCartAmount, 
        getCartCount, axios: axiosInstance, fetchProducts, favorites,
    }

    return <AppContext.Provider value={value}>
        {children}
    </AppContext.Provider>
}

export const useAppContext = () => {
    return useContext(AppContext)
}

