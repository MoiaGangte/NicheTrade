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
const SLIDE_INTERVAL_VIDEO = 5000;

const MainBanner = () => {
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

    // Slides array
    const slides = [
        // Image background
        <div key="img" className="w-full h-full flex-shrink-0 relative">
            <div className="bg-[url('/main_background_image_bg.png')] bg-cover bg-center bg-no-repeat w-full h-full lg:bg-none">
                <div>
                    <div className="relative z-10 flex flex-col items-center justify-center text-center" >
                        <img src={assets.gocc} alt="" className='w-full h-full object-cover' />
                        <h1 className='text-4xl md:text-5xl lg:text-4xl font-bold text-white [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)]'>Welcome to EimiCart</h1>
                        <p className='text-lg md:text-xl text-white outline outline-black mt-4 [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)] md:text-left'>
                            Best offer price,<br className='block md:hidden' />
                            Exclusive top brand,<br className=' block md: hidden' />
                            DoorStep Delivery at LAMKA!!
                        </p>
                        <div className='flex self-start gap-4 mt-6'>
                            <button onClick={() => navigate('/products')} className='px-1 mt-18 py-2 bg-[var(--color-primary)] shadow-lg p-2 text-white font-medium rounded-none border-1 border-white border-transparent hover:border-white active:border-white transition'>
                                Shop now
                            </button>
                            <p className='text-white text-center mt-10 text-lg [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)] relative'>
                                Shop with us with love and joy!!
                                <span className='absolute bottom-0 left-0 w-full h-0.5 bg-black [box-shadow:_0_0_2px_black]'></span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        // goccvideo
        <div key="grt" className="w-full h-full flex-shrink-0 relative">
            <video
                src="/grt.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover block md:hidden z-0"
            />
            <div className="lg:hidden relative z-10 flex flex-col items-start justify-center text-center h-full">
                <button
                    onClick={() => navigate('/products?category=Household')}
                    className="lg:hidden px-4 mt-59 py-2 bg-[var(--color-primary)] shadow-lg text-white font-medium rounded border border-white hover:border-white active:border-white transition"
                >
                    Shop now
                </button>
            </div>
        </div>,


        // backgroundvideo
        <div key="backgroundvideo" className="w-full h-full flex-shrink-0 relative">
            <video
                src="/backgroundvideo.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover block md:hidden z-0"
            />
            <div className="lg:hidden relative z-10 flex flex-col items-center justify-center text-center" >
                <h1 className='text-4xl md:text-5xl lg:text-4xl font-bold text-white [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)]'>Top Brand Fasion</h1>
                <p className='text-lg md:text-xl text-white outline outline-black mt-4 [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)] md:text-left'>
                    Styliest fasion,<br className='block md:hidden' />
                    Branded and Exclusive,<br className=' block md: hidden' />
                    DoorStep Delivery at LAMKA!!<br className='block md:hidden' />
                </p>
                <div className='lg:hidden flex self-start mt-6'>
                    <button onClick={() => navigate('/products?category=fasion')} className='px-1 mt-18 py-2 bg-[var(--color-primary)] shadow-lg p-2 text-white font-medium rounded-none border-1 border-white border-transparent hover:border-white active:border-white transition'>
                        Shop now
                    </button>
                </div>
            </div>
        </div>
    ];

    if (isLargeScreen) {
        // Only show the first slide, no handlers, no transform
        return (
            <div className="w-full h-full relative">
                <div className="w-full h-full flex-shrink-0">
                    {slides[0]}
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
                className="flex transition-transform duration-700 ease-in-out w-full h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
                {slides.map((slide, idx) => (
                    <div key={idx} className="w-full h-full flex-shrink-0">
                        {slide}
                    </div>
                ))}
            </div>
            {/* Optional: Dots for navigation */}
            <div className="lg:hidden absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        className={`w-8 h-1 rounded transition-colors duration-200 ${currentSlide === idx ? 'bg-blue-300' : 'bg-gray-400'} opacity-80 hover:bg-blue-500 cursor-pointer`}
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

export default MainBanner