import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import toast from "react-hot-toast";
import { getProductCategories } from "../utils/productCategories";

const Cart = () => {
    const {
        products,
        currency,
        cartItems,
        removeFromCart,
        getCartCount,
        updateCartItem,
        navigate,
        getCartAmount,
        user,
        setShowUserLogin,
    } = useAppContext();
    const [cartArray, setCartArray] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const items = Object.entries(cartItems)
            .map(([productId, quantity]) => {
                const product = products.find((item) => item._id === productId);
                return product ? { ...product, quantity } : null;
            })
            .filter(Boolean);
        setCartArray(items);
        setIsLoading(false);
    }, [products, cartItems]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[var(--color-primary)]" />
            </div>
        );
    }

    if (!cartArray.length) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center">
                <h1 className="mb-4 text-2xl font-medium">Your cart is empty</h1>
                <button
                    onClick={() => navigate("/products")}
                    className="rounded-full bg-[var(--color-primary)] px-6 py-2 text-white transition hover:bg-primary-dull"
                >
                    Continue Shopping
                </button>
            </div>
        );
    }

    const handleOrder = () => {
        if (!user) {
            setShowUserLogin(true);
            return;
        }
        navigate("/order/delivery");
    };

    return (
        <div className="mt-16 flex flex-col gap-10 md:flex-row">
            <div className="max-w-4xl flex-1">
                <h1 className="mb-6 text-3xl font-medium">
                    Shopping Cart <span className="text-sm text-indigo-500">{getCartCount()} Items</span>
                </h1>

                <div className="grid grid-cols-[2fr_1fr_1fr] pb-3 text-base font-medium text-gray-500">
                    <p className="text-left">Product Details</p>
                    <p className="text-center">Subtotal</p>
                    <p className="text-center">Action</p>
                </div>

                {cartArray.map((product) => (
                    <div key={product._id} className="grid grid-cols-[2fr_1fr_1fr] items-center pt-3 text-sm font-medium text-gray-500 md:text-base">
                        <div className="flex items-center gap-3 md:gap-6">
                            <button
                                type="button"
                                onClick={() => {
                                    navigate(`/products/${(getProductCategories(product)[0] || "uncategorized").toLowerCase()}/${product._id}`);
                                    scrollTo(0, 0);
                                }}
                                className="flex h-24 w-24 items-center justify-center overflow-hidden rounded border border-gray-300 bg-white"
                            >
                                <img
                                    className="h-full w-full object-contain"
                                    src={product.image[0]}
                                    alt={product.name}
                                    onError={(event) => { event.currentTarget.src = assets.upload_area; }}
                                />
                            </button>
                            <div>
                                <p className="hidden font-semibold md:block">{product.name}</p>
                                <div className="font-normal text-gray-500/70">
                                    <p>Seller: <span className="text-gray-700">{product.sellerId?.name || "NicheTrade Seller"}</span></p>
                                    <p>Department: <span className="text-gray-700">{product.sellerId?.department || "Not provided"}</span></p>
                                    <p>
                                        Stock Available:{" "}
                                        <span className={product.stockQuantity > 0 ? "text-green-600" : "text-red-600"}>
                                            {product.stockQuantity}
                                        </span>
                                    </p>
                                    <label className="flex items-center">
                                        Qty:
                                        <select
                                            aria-label={`Quantity for ${product.name}`}
                                            onChange={(event) => {
                                                const quantity = Number(event.target.value);
                                                if (quantity > product.stockQuantity) {
                                                    toast.error(`Only ${product.stockQuantity} items available`);
                                                    return;
                                                }
                                                updateCartItem(product._id, quantity);
                                            }}
                                            value={cartItems[product._id]}
                                            className="ml-2 cursor-pointer rounded-lg border-2 border-gray-300 px-2 py-0.5 text-sm"
                                        >
                                            {Array.from({ length: Math.min(product.stockQuantity, 9) }, (_, index) => (
                                                <option key={index + 1} value={index + 1}>{index + 1}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <p className="text-center">{currency}{product.offerPrice * product.quantity}</p>
                        <button
                            type="button"
                            onClick={() => removeFromCart(product._id)}
                            aria-label={`Remove ${product.name} from cart`}
                            className="mx-auto cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 transition-colors hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8" />
                            </svg>
                        </button>
                    </div>
                ))}

                <button
                    onClick={() => { navigate("/products"); scrollTo(0, 0); }}
                    className="group mt-8 flex cursor-pointer items-center gap-2 font-medium text-[var(--color-primary)]"
                >
                    <img className="transition group-hover:-translate-x-1" src={assets.arrow_right_icon_colored} alt="" />
                    Continue Shopping
                </button>
            </div>

            <aside className="w-full max-w-[360px] border border-gray-300/70 bg-gray-100/40 p-5 max-md:mt-4">
                <h2 className="text-xl font-medium">Order Summary</h2>
                <hr className="my-5 border-gray-300" />
                <p className="flex justify-between text-lg font-medium">
                    <span>Amount</span>
                    <span>{currency}{getCartAmount()}</span>
                </p>
                <button
                    type="button"
                    onClick={handleOrder}
                    className="mt-6 w-full rounded bg-[var(--color-primary)] py-3 font-medium text-white transition hover:bg-primary-dull"
                >
                    Order
                </button>
            </aside>
        </div>
    );
};

export default Cart;
