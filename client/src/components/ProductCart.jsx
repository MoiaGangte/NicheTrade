import React from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import { useLocation } from "react-router-dom";

const ProductCart = ({ product, small, smaller }) => {
    const { currency, addToCart, removeFromCart, cartItems, navigate } = useAppContext()
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const isProductDetails = location.pathname.match(/^\/products\/[^/]+\/[^/]+$/);

    const handleProductClick = () => {
        navigate(`/products/${product.category.toLowerCase()}/${product._id}`);
        window.scrollTo(0, 0);
    };

    // Determine which style to use
    const boxClass = small
        ? 'p-1 w-full max-w-[110px] min-w-[90px]'
        : smaller
            ? 'p-2 w-full max-w-[140px] min-w-[110px]'
            : 'p-3 w-full';
    const imgClass = small
        ? 'h-14'
        : smaller
            ? 'h-20'
            : 'h-32 sm:h-40';
    const pxClass = small ? 'px-0' : smaller ? 'px-1' : 'px-2';
    const mtClass = small ? 'mt-1' : smaller ? 'mt-2' : 'mt-3';
    const catTextClass = small
        ? 'text-[10px]'
        : smaller
            ? 'text-xs'
            : '';
    const nameTextClass = small
        ? 'text-sm'
        : smaller
            ? 'text-base'
            : 'text-lg';
    const priceTextClass = small
        ? 'text-xs'
        : smaller
            ? 'text-sm'
            : 'text-base';
    const lineThroughClass = small
        ? 'text-[10px]'
        : smaller
            ? 'text-xs'
            : 'text-xs';
    const btnClass = small
        ? 'px-1.5 py-0.5'
        : smaller
            ? 'px-3 py-0.5'
            : 'px-4 py-1';

    return product && (
        <div onClick={handleProductClick} className={`border rounded-md cursor-pointer transition-all duration-300 ${boxClass} ${
            isHomePage 
            ? 'border-black border-3 hover:border-white hover:shadow-lg hover:shadow-white/20 bg-black/20 backdrop-blur-sm' 
            : 'border-gray-300 hover:border-gray-400 bg-white outline outline-white-500'
        }`}>
            <div className={`group flex items-center justify-center relative ${pxClass}`}>
                <img className={`group-hover:scale-105 transition w-full object-contain ${imgClass}`} src={product.image[0]} alt={product.name} />
            </div>
            <div className={`text-gray-500/60 text-sm ${mtClass}`}>
                <p className={`${isHomePage ? 'text-white [text-shadow:_0_0_1px_black,_0_0_1px_black,_0_0_1px_black,_0_0_1px_black]' : 'text-gray-500'} ${catTextClass}`}>{product.category}</p>
                <p className={`${isHomePage ? 'text-white [text-shadow:_0_0_1px_black,_0_0_1px_black,_0_0_1px_black,_0_0_1px_black]' : 'text-gray-700'} font-medium truncate w-full ${nameTextClass}`}>{product.name}</p>
                <div className="flex items-center gap-2">
                    <span className="font-medium text-green-600 text-xs">
                        Stock: {product.stockQuantity || 1}
                    </span>
                </div>
                <div className={`flex items-end justify-between mt-3 ${small ? 'mt-1' : smaller ? 'mt-2' : ''}`}>
                    {small || smaller ? (
                        <div className="flex flex-col items-start">
                            <span className={`font-medium ${isHomePage ? 'text-green-600' : 'text-[var(--color-primary)]'} ${priceTextClass}`}>{currency}{product.offerPrice}</span>
                            <span className={`line-through ${lineThroughClass} ${isHomePage ? 'text-white' : 'text-gray-500/60'}`}>{currency}{product.price}</span>
                        </div>
                    ) : (
                        <p className={`font-medium ${isHomePage ? 'text-green-600' : 'text-[var(--color-primary)]'} ${priceTextClass}`}>
                            {currency}{product.offerPrice}{" "}
                            <span className={`text-xs line-through ${isHomePage ? 'text-white' : 'text-gray-500/60'}`}>{currency}{product.price}</span>
                        </p>
                    )}
                    <button onClick={(e) => {
                        e.stopPropagation();
                        if (cartItems[product._id]) {
                            removeFromCart(product._id);
                        } else {
                            addToCart(product._id);
                        }
                    }} 
                    className={`bg-[var(--color-primary)] hover:bg-primary-dull transition text-white rounded-full text-xs ${btnClass} 
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