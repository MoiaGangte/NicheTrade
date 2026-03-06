import { useEffect, useState } from "react"
import { useAppContext } from "../context/AppContext"
import { assets } from "../assets/assets"
import toast from "react-hot-toast"

const Cart = () => {

    const { products, currency, cartItems, removeFromCart, getCartCount, updateCartItem, navigate, getCartAmount, axios, user, setCartItems, setShowUserLogin } = useAppContext();
    const [cartArray, setCartArray] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [showAddress, setShowAddress] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const getCart = () => {
        let tempArray = []
        for (const key in cartItems) {
            const product = products.find((item) => item._id === key)
            if (product) {
                product.quantity = cartItems[key]
                tempArray.push(product)
            }
        }
        setCartArray(tempArray)
        setIsLoading(false)
    }


    ///////////////////////////razorpay payment integration by me/////////////////////////
    const orderAmount = getCartAmount() + getCartAmount() * 10 / 100; // Total amount including tax

    const handlePayment = async (amount) => {
        try {
            if (!selectedAddress) {
                return toast.error("Please select an address");
            }

            // 1. Create Razorpay order
            const { data } = await axios.post("/api/payment/create-order", {
                amount: amount,
                currency: "INR"
            });

            console.log('Create-order API response:', data);

            if (!data.success) {
                toast.error("Order creation failed");
                return;
            }

            // 2. Open Razorpay checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY, // Your Razorpay key
                amount: data.order.amount,
                currency: data.order.currency,
                order_id: data.order.id,
                handler: async function (response) {
                    setIsProcessingPayment(true);
                    console.log("Razorpay handler response:", response);
                    try {
                        // 3. Verify payment on backend (await to ensure sequential flow)
                        const res = await axios.post("/api/payment/verify", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            items: cartArray.map(item => ({
                                product: item._id,
                                quantity: item.quantity
                            })),
                            address: selectedAddress._id
                        });

                        if (res.data.success) {
                            toast.success("Payment successful! Order placed successfully.");
                            setCartItems({});
                            navigate('/my-orders');
                        } else {
                            toast.error("Payment verification failed: " + res.data.message);
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        toast.error("Payment verification failed: " + (error.response?.data?.message || error.message));
                    } finally {
                        setIsProcessingPayment(false);
                    }
                },
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                },
                theme: { color: "#3399cc" },
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error('Payment error:', error);
            toast.error("Payment error: " + error.message);
        }
    };
    ////////////////////////razorpay payment integration by me end point/////////////////////////

    const getUserAddress = async () => {
        try {
            const { data } = await axios.get('/api/address/get');
            if (data.success) {
                setAddresses(data.addresses)
                if (data.addresses.length > 0) {
                    setSelectedAddress(data.addresses[0])
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
    }

    const validateStock = () => {
        for (const item of cartArray) {
            if (!item.inStock) {
                toast.error(`${item.name} is out of stock`);
                return false;
            }
            if (item.stockQuantity < item.quantity) {
                toast.error(`Only ${item.stockQuantity} items available for ${item.name}`);
                return false;
            }
        }
        return true;
    }

    const placeOrder = async () => {
        if (!validateStock()) {
            return;
        }

        try {
            if (!selectedAddress) {
                return toast.error("Please Add an address")
            }

            setIsPlacingOrder(true);

            //place Order with COD
            const { data } = await axios.post('/api/order/cod', {
                items: cartArray.map(item => ({
                    product: item._id,
                    quantity: item.quantity
                })),
                address: selectedAddress._id
            })

            if (data.success) {
                toast.success(data.message)
                setCartItems({})
                navigate('/my-orders')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        } finally {
            setIsPlacingOrder(false);
        }
    }

    useEffect(() => {
        if (products.length > 0 && cartItems) {
            getCart()
        } else {
            setIsLoading(false)
        }
    }, [products, cartItems])

    useEffect(() => {
        if (user) {
            getUserAddress()
        }
    }, [user])

    // Add effect to hide footer when changing address
    useEffect(() => {
        const footer = document.querySelector('footer');
        if (footer) {
            footer.style.display = showAddress ? 'none' : 'block';
        }
        return () => {
            if (footer) {
                footer.style.display = 'block';
            }
        };
    }, [showAddress]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-primary)]"></div>
            </div>
        )
    }

    if (!cartArray.length) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <h1 className="text-2xl font-medium mb-4">Your cart is empty</h1>
                <button
                    onClick={() => navigate("/products")}
                    className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-full hover:bg-primary-dull transition"
                >
                    Continue Shopping
                </button>
            </div>
        )
    }

    return products.length > 0 && cartItems ? (
        <div className="flex flex-col md:flex-row mt-16">
            {isProcessingPayment && (
                <div className="fixed inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-50">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[var(--color-primary)]"></div>
                    <p className="mt-4 text-lg font-semibold text-gray-700">Processing Payment...</p>
                    <p className="text-gray-500">Please do not refresh or go back.</p>
                </div>
            )}
            <div className='flex-1 max-w-4xl'>
                <h1 className="text-3xl font-medium mb-6">
                    Shopping Cart <span className="text-sm text-indigo-500">{getCartCount()} Items</span>
                </h1>

                <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 text-base font-medium pb-3">
                    <p className="text-left">Product Details</p>
                    <p className="text-center">Subtotal</p>
                    <p className="text-center">Action</p>
                </div>

                {cartArray.map((product, index) => (
                    <div key={index} className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 items-center text-sm md:text-base font-medium pt-3">
                        <div className="flex items-center md:gap-6 gap-3">
                            <div onClick={() => {
                                navigate(`/products/${product.category.toLowerCase()}/${product._id}`); scrollTo(0, 0)
                            }} className="cursor-pointer w-24 h-24 flex items-center justify-center border border-gray-300 rounded overflow-hidden bg-white">
                                <img className="w-full h-full object-contain" src={product.image[0]} alt={product.name} />
                            </div>
                            <div>
                                <p className="hidden md:block font-semibold">{product.name}</p>
                                <div className="font-normal text-gray-500/70">
                                    <p>Stock Available: <span className={product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}>{product.stockQuantity}</span></p>
                                    <div className='flex items-center'>
                                        <p>Qty:</p>
                                        <select
                                            onChange={e => {
                                                const newQuantity = Number(e.target.value);
                                                if (newQuantity > product.stockQuantity) {
                                                    toast.error(`Only ${product.stockQuantity} items available`);
                                                    return;
                                                }
                                                updateCartItem(product._id, newQuantity);
                                            }}
                                            value={cartItems[product._id]}
                                            className='ml-2 px-2 py-0.5 text-sm border-2 border-gray-300 rounded-lg outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-300 cursor-pointer'
                                        >
                                            {Array(Math.min(product.stockQuantity, 9)).fill('').map((_, index) => (
                                                <option key={index} value={index + 1}>{index + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-center">{currency}{product.offerPrice * product.quantity}</p>
                        <button onClick={() => removeFromCart(product._id)} className="cursor-pointer mx-auto">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-gray-500 hover:text-red-500 transition-colors duration-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8" />
                            </svg>
                        </button>
                    </div>)
                )}

                <button onClick={() => { navigate("/products"); scrollTo(0, 0) }} className="group cursor-pointer flex items-center mt-8 gap-2 text-[var(--color-primary)] font-medium">
                    <img className="group-hover:-translate-x-1 transition" src={assets.arrow_right_icon_colored} alt="arrow" />
                    Continue Shopping
                </button>

            </div>

            <div className="max-w-[360px] w-full bg-gray-100/40 p-5 max-md:mt-16 border border-gray-300/70">
                <h2 className="text-xl md:text-xl font-medium">Order Summary</h2>
                <hr className="border-gray-300 my-5" />

                <div className="mb-6">
                    <p className="text-sm font-medium uppercase">Delivery Address</p>
                    <div className="relative flex justify-between items-start mt-2">
                        <p className="text-gray-500">{selectedAddress ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.country}` : "No address found"}</p>
                        <button onClick={() => {
                            if (!user) {
                                setShowUserLogin(true);
                                return;
                            }
                            selectedAddress ? setShowAddress(!showAddress) : navigate("/add-address");
                        }} className="text-[var(--color-primary)] hover:underline cursor-pointer">
                            {selectedAddress ? "Change" : "Add Address"}
                        </button>
                        {showAddress && selectedAddress && (
                            <div className="absolute top-12 py-1 bg-white border border-gray-300 text-sm w-full z-50">
                                {addresses.map((address, index) => (
                                    <p key={index} onClick={() => { setSelectedAddress(address); setShowAddress(false) }} className="text-gray-500 p-2 hover:bg-gray-100">
                                        {address.street}, {address.city}, {address.state}, {address.country}
                                    </p>
                                ))}
                                <p onClick={() => {
                                    if (!user) {
                                        setShowUserLogin(true);
                                        return;
                                    }
                                    navigate("/add-address");
                                }} className="text-[var(--color-primary)] text-center cursor-pointer p-2 hover:bg-primary-dull/10">
                                    Add address
                                </p>
                            </div>
                        )}
                    </div>

                    <p className="text-sm font-medium uppercase mt-6">Payment Method</p>
                    <div className="flex flex-col gap-3 mt-2">
                        <button
                            onClick={() => {
                                if (!user) {
                                    setShowUserLogin(true);
                                    return;
                                }
                                handlePayment(orderAmount);
                            }}
                            disabled={isPlacingOrder}
                            className={`w-full py-3 cursor-pointer bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition ${isPlacingOrder ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {!user ? "Login to Order" : isPlacingOrder ? "Processing..." : "Pay Online"}
                        </button>
                        <button
                            onClick={() => {
                                if (!user) {
                                    setShowUserLogin(true);
                                    return;
                                }
                                placeOrder();
                            }}
                            disabled={isPlacingOrder}
                            className={`w-full py-3 cursor-pointer bg-gray-800 text-white font-medium rounded hover:bg-gray-900 transition ${isPlacingOrder ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {!user ? "Login to Order" : isPlacingOrder ? "Processing..." : "Cash on Delivery"}
                        </button>
                    </div>
                </div>

                <hr className="border-gray-300" />

                <div className="text-gray-500 mt-4 space-y-2">
                    <p className="flex justify-between">
                        <span>Price</span><span>{currency}{getCartAmount()}</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Shipping Fee</span><span className="text-green-600">Free</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Tax (10%)</span><span>{currency}{getCartAmount() * 10 / 100}</span>
                    </p>
                    <p className="flex justify-between text-lg font-medium mt-3">
                        <span>Total Amount:</span><span>{currency}{getCartAmount() + getCartAmount() * 10 / 100}</span>
                    </p>
                </div>
            </div>
        </div>
    ) : null
}

export default Cart