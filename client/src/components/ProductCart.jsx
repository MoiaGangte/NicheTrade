import React from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import { useLocation } from "react-router-dom";

const ProductCart = ({ product }) => {
    const { currency, addToCart, removeFromCart, cartItems, navigate } = useAppContext()
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const isProductDetails = location.pathname.match(/^\/products\/[^/]+\/[^/]+$/);

    const handleProductClick = () => {
        navigate(`/products/${product.category.toLowerCase()}/${product._id}`);
        window.scrollTo(0, 0);
    };

    return product && (
        <div onClick={handleProductClick} className={`border rounded-md p-3 w-full cursor-pointer transition-all duration-300 ${
            isHomePage 
            ? 'border-black border-3 hover:border-white hover:shadow-lg hover:shadow-white/20 bg-black/20 backdrop-blur-sm' 
            : 'border-gray-300 hover:border-gray-400 bg-white outline outline-white-500'
        }`}>
            <div className="group flex items-center justify-center px-2 relative">
                <img className="group-hover:scale-105 transition w-full h-40 object-contain" src={product.image[0]} alt={product.name} />
            </div>
            <div className="text-gray-500/60 text-sm mt-3">
                <p className={`${isHomePage ? 'text-white [text-shadow:_0_0_1px_black,_0_0_1px_black,_0_0_1px_black,_0_0_1px_black]' : 'text-gray-500'}`}>{product.category}</p>
                <p className={`${isHomePage ? 'text-white [text-shadow:_0_0_1px_black,_0_0_1px_black,_0_0_1px_black,_0_0_1px_black]' : 'text-gray-700'} font-medium text-lg truncate w-full`}>{product.name}</p>
                <div className="flex items-center gap-2">
                    <span className="font-medium text-green-600">
                        Stock: {product.stockQuantity || 1}
                    </span>
                </div>
                <div className="flex items-end justify-between mt-3">
                    <p className={`text-base font-medium ${isHomePage ? 'text-green-600' : 'text-[var(--color-primary)]'}`}>
                        {currency}{product.offerPrice}{" "} 
                        <span className={`text-xs line-through ${isHomePage ? 'text-white' : 'text-gray-500/60'}`}>
                            {currency}{product.price}
                        </span>
                    </p>
                    <button onClick={(e) => {
                        e.stopPropagation();
                        if (cartItems[product._id]) {
                            removeFromCart(product._id);
                        } else {
                            addToCart(product._id);
                        }
                    }} 
                    className={`bg-[var(--color-primary)] hover:bg-primary-dull transition text-white px-4 py-1 rounded-full text-sm 
                        ${isHomePage ? 'border-2 border-white hover:border-white active:border-white' : ''}`}
                    >
                        {cartItems[product._id] ? "Remove" : "Add"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCart