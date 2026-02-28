import React, {useEffect, useRef, useState} from "react"
import { useNavigate } from "react-router-dom";

function useIsLargeScreen() {
    const [isLarge, setIsLarge] = useState(() => window.innerWidth >= 1024);
    useEffect(() => {
        const onResize = () => setIsLarge(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListner('resize', onResize);
    }, []);
    return isLarge;
}
const SLIDE_INTERVAL_IMAGE = 2000;
const SLIDE_INTERVAL_VIDEO = 3000;

const Trending = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const intervalRef = useRef(null);
    const bannerRef = useRef(null);
    const slideCount = 3;
    const [touchStartX, setTouchStartX] = useState(null);
    const [touchEndX, setTouchEndX] = useState(null);
    const isLargeScreen = useIsLargeScreen();

    useEffect(() => {
        if (isLargeScreen) return;
        startAutoSlide();
        return () => stopAutoSlide();
    }, [currentSlide, isLargeScreen])
}