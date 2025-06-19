import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { Link, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import ProductCart from "../components/ProductCart";
import toast from "react-hot-toast";

const ProductDetails = () => {

    const { products, navigate, currency, addToCart, user, axios, favorites, toggleFavorite, removeFromCart, cartItems } = useAppContext()
    const { id } = useParams()

    const [relatedProducts, setRelatedProducts] = useState([]);
    const [thumbnail, setThumbnail] = useState(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [hoveredRating, setHoveredRating] = useState(0);
    const [ratingError, setRatingError] = useState("");

    const product = products.find((item) => item._id === id);

    // Hide footer when component mounts and show it when unmounts
    useEffect(() => {
        const footer = document.querySelector('footer');
        if (footer) {
            footer.style.display = 'none';
        }
        return () => {
            if (footer) {
                footer.style.display = 'block';
            }
        };
    }, []);

    useEffect(() => {
        if (products.length > 0) {
            let productsCopy = products.slice();
            productsCopy = productsCopy.filter((item) => product.category === item.category);
            setRelatedProducts(productsCopy.slice(0, 5));
        }
    }, [products]);

    useEffect(() => {
        setThumbnail(product?.image[0] ? product.image[0] : null);
    }, [product, products]);

    useEffect(() => {
        fetchReviews();
    }, [id]);

    useEffect(() => {
        if (!isFullScreen) return;
        const handleKeyDown = (e) => {
            if (!product || !product.image) return;
            if (e.key === 'ArrowLeft') {
                const currentIndex = product.image.indexOf(thumbnail);
                const prevIndex = currentIndex === 0 ? product.image.length - 1 : currentIndex - 1;
                setThumbnail(product.image[prevIndex]);
            } else if (e.key === 'ArrowRight') {
                const currentIndex = product.image.indexOf(thumbnail);
                const nextIndex = currentIndex === product.image.length - 1 ? 0 : currentIndex + 1;
                setThumbnail(product.image[nextIndex]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullScreen, thumbnail, product]);

    const fetchReviews = async () => {
        try {
            const { data } = await axios.get(`/api/review/product/${id}`);
            if (data.success) {
                setReviews(data.reviews);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    return product && (
        <div className="mt-10">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column - Images */}
                <div className="md:w-1/2">
                    <div className="relative">
                        <div className="relative group">
                            <img 
                                src={thumbnail} 
                                alt="" 
                                className="w-full h-[400px] object-contain rounded-lg cursor-pointer"
                                onClick={() => setIsFullScreen(true)}
                            />
                            {/* Navigation Buttons */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentIndex = product.image.indexOf(thumbnail);
                                    const prevIndex = currentIndex === 0 ? product.image.length - 1 : currentIndex - 1;
                                    setThumbnail(product.image[prevIndex]);
                                }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:outline hover:outline-2 hover:outline-black"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentIndex = product.image.indexOf(thumbnail);
                                    const nextIndex = currentIndex === product.image.length - 1 ? 0 : currentIndex + 1;
                                    setThumbnail(product.image[nextIndex]);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:outline hover:outline-2 hover:outline-black"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                            {product?.image.map((item, index) => (
                                <img 
                                    key={index} 
                                    src={item} 
                                    alt="" 
                                    onClick={() => setThumbnail(item)}
                                    className={`w-20 h-20 object-contain cursor-pointer transition-all ${thumbnail === item ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="text-sm w-full md:w-1/2">
                    <h1 className="text-3xl font-medium">{product.name}</h1>

                    <div className="flex items-center gap-0.5 mt-1">
                        <p className="text-base">Stock Available: <span className={product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}>{product.stockQuantity || 1}</span></p>
                    </div>

                    <div className="mt-6">
                        <p className="text-black line-through">MRP: {currency}{product.price}</p>
                        <p className="text-2xl font-medium text-green-600">MRP: {currency}{product.offerPrice}</p>
                        <span className="text-black">(inclusive of all taxes)</span>
                    </div>

                    <p className="text-base font-medium mt-6">About Product</p>
                    <ul className="list-disc ml-4 text-black">
                        {product.description.map((desc, index) => (
                            <li key={index}>{desc}</li>
                        ))}
                    </ul>

                    <div className="flex items-center mt-10 gap-4 text-base">
                        <button 
                            onClick={() => {
                                if (cartItems[product._id]) {
                                    removeFromCart(product._id);
                                } else {
                                    addToCart(product._id);
                                }
                            }} 
                            className={`w-full py-3.5 cursor-pointer font-medium border-2 border-black text-black hover:bg-black hover:text-white transition ${
                                cartItems[product._id] ? 'bg-black text-white' : ''
                            }`}
                        >
                            {cartItems[product._id] ? "Remove" : "Add to Cart"}
                        </button>
                        <button onClick={() => { addToCart(product._id); navigate("/cart") }} className="w-full py-3.5 cursor-pointer font-medium bg-[var(--color-primary)] text-white hover:bg-primary-dull transition" >
                            Buy now
                        </button>
                    </div>
                </div>
            </div>

            {/* Full Screen Image Modal */}
            {isFullScreen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
                    onClick={() => setIsFullScreen(false)}
                >
                    <div className="relative flex items-center justify-center" style={{ width: '90vw', height: '90vh' }}>
                        {/* Left Arrow Button */}
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/60 text-black rounded-full p-3 z-20"
                            style={{ fontSize: '2rem' }}
                            onClick={e => {
                                e.stopPropagation();
                                const currentIndex = product.image.indexOf(thumbnail);
                                const prevIndex = currentIndex === 0 ? product.image.length - 1 : currentIndex - 1;
                                setThumbnail(product.image[prevIndex]);
                            }}
                            aria-label="Previous image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        {/* Right Arrow Button */}
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/60 text-black rounded-full p-3 z-20"
                            style={{ fontSize: '2rem' }}
                            onClick={e => {
                                e.stopPropagation();
                                const currentIndex = product.image.indexOf(thumbnail);
                                const nextIndex = currentIndex === product.image.length - 1 ? 0 : currentIndex + 1;
                                setThumbnail(product.image[nextIndex]);
                            }}
                            aria-label="Next image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <button 
                            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-20"
                            onClick={() => setIsFullScreen(false)}
                        >
                            ×
                        </button>
                        <img 
                            src={thumbnail} 
                            alt="Full screen product" 
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                </div>
            )}

            {/*-----------related product---------- */}
            <div className="flex flex-col items-center mt-8">
                <div className="flex flex-col items-center w-max">
                    <p className="text-3xl font-medium">Related product</p>
                    <div className="w-20 h-0.5 bg-[var(--color-primary)] rounded-full mt-2"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 lg:grid-cols-5 mt-6 w-full">
                    {relatedProducts.filter((product) => product.inStock).map(
                        (product) => (
                            <ProductCart key={product._id} product={product} />
                        )
                    )}
                </div>
                <button onClick={() => { navigate('/products'); scrollTo(0, 0) }} className="mx-auto cursor-pointer px-12 my-16 py-2.5 border rounded text-[var(--color-primary)] hover:bg-primary-dull/10 transition">see more</button>
            </div>

            {/* All Products Section */}
            <div className=" mb-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 lg:grid-cols-5 w-full">
                    {products
                        .filter((product) => product.inStock)
                        .filter((product) => !relatedProducts.some(relatedProduct => relatedProduct._id === product._id))
                        .map((product) => (
                            <ProductCart key={product._id} product={product} />
                        ))}
                </div>
            </div>
        </div>
    );
};

export default ProductDetails