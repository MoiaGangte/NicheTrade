import React, { useEffect, useRef, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

// Add this hook to detect large screens
function useIsLargeScreen() {
    const [isLarge, setIsLarge] = useState(() => window.innerWidth >= 1024);
    useEffect(() => {
        const onResize = () => setIsLarge(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    return isLarge;
}

const SLIDE_INTERVAL_IMAGE = 3000;
const SLIDE_INTERVAL_VIDEO = 3000;

const BestOffer = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const intervalRef = useRef(null);
    const bannerRef = useRef(null);
    const slideCount = 3;
    const [touchStartX, setTouchStartX] = useState(null);
    const [touchEndX, setTouchEndX] = useState(null);
    const isLargeScreen = useIsLargeScreen();

    // Only run sliding logic on non-large screens
    useEffect(() => {
        if (isLargeScreen) return; // skip on large screens
        startAutoSlide();
        return () => stopAutoSlide();
    }, [currentSlide, isLargeScreen]);

    const startAutoSlide = () => {
        if (isLargeScreen) return;
        stopAutoSlide();
        const interval = currentSlide === 0 ? SLIDE_INTERVAL_IMAGE : SLIDE_INTERVAL_VIDEO;
        intervalRef.current = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slideCount);
        }, interval);
    };

    const stopAutoSlide = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    // Pause on hover
    const handleMouseEnter = () => {
        if (isLargeScreen) return;
        stopAutoSlide();
    };
    const handleMouseLeave = () => {
        if (isLargeScreen) return;
        startAutoSlide();
    };

    // Swipe handlers
    const handleTouchStart = (e) => {
        if (isLargeScreen) return;
        setTouchStartX(e.touches[0].clientX);
    };
    const handleTouchEnd = (e) => {
        if (isLargeScreen) return;
        if (touchStartX === null) return;
        const endX = e.changedTouches[0].clientX;
        const diff = touchStartX - endX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                // Swipe left
                setCurrentSlide((prev) => (prev + 1) % slideCount);
            } else {
                // Swipe right
                setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);
            }
        }
        setTouchStartX(null);
    };

    // Slides background images
    const backgroundImages = [
        "/watch.jpg",
        "/shock1.jpeg",
        "/shoes.jpg"
    ];

    if (isLargeScreen) {
        // Only show the first background, overlay stays the same
        return (
            <div className="w-full lg:hidden h-full relative">
                <div className='w-full h-full flex-shrink-0'>
                    <div className={`bg-[url('${backgroundImages[0]}')] bg-cover bg-center bg-no-repeat w-full h-full lg:bg-none transition-all duration-700`}>
                        <div className="relative z-10 flex flex-col items-center justify-center text-center h-full">
                            <h1 className='text-4xl md:text-5xl lg:text-4xl font-bold text-white [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)]'>G-SHOCK WATCHES</h1>
                            <p className='text-lg md:text-xl text-white outline outline-black mt-4 [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)] md:text-left'>
                                Best offer price,<br className='block md:hidden' />
                                Exclusive top brand,<br className=' block md: hidden' />
                            </p>
                            <div className='flex items-center gap-4 mt-6'>
                                <button onClick={() => navigate('/products')} className='px-4 mt-10 py-3 bg-[var(--color-primary)] shadow-lg p-2 text-white font-medium rounded-none border-2 border-white border-transparent hover:border-white active:border-white transition'>
                                    Shop now
                                </button>
                                <p className='text-white text-center mt-10 text-lg [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)] relative'>
                                    Shop while product is still avialable
                                    <span className='absolute bottom-0 left-0 w-full h-0.5 bg-black [box-shadow:_0_0_2px_black]'></span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={bannerRef}
            className="overflow-hidden w-full h-full relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div
                className="w-full h-full transition-all duration-700"
                style={{ backgroundImage: `url('${backgroundImages[currentSlide]}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
                <div className="relative z-10 flex flex-col items-center justify-center text-center h-full">
                    <h1 className='text-4xl md:text-5xl lg:text-4xl font-bold text-white [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)]'>G-SHOCK WATCHES</h1>
                    <p className='text-lg md:text-xl text-white outline outline-black mt-4 [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)] md:text-left'>
                        Best offer price,<br className='block md:hidden' />
                        Exclusive top brand,<br className=' block md: hidden' />
                    </p>
                    <div className='flex items-center gap-4 mt-6'>
                        <button onClick={() => navigate('/products')} className='lg:hidden px-2 mt-10 py-4 bg-[var(--color-primary)] shadow-lg p-2 text-white font-medium rounded-none border-2 border-white border-transparent hover:border-white active:border-white transition'>
                            Shop now
                        </button>
                        <p className='text-white text-center mt-10 text-lg [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)] relative'>
                            Shop while product is still avialable
                            <span className='absolute bottom-0 left-0 w-full h-0.5 bg-black [box-shadow:_0_0_2px_black]'></span>
                        </p>
                    </div>
                </div>
            </div>
            {/* Optional: Dots for navigation */}
            <div className="lg:hidden absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                {backgroundImages.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

export default BestOffer