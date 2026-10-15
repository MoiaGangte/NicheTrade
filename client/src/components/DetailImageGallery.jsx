import { useEffect, useState } from "react";

const DetailImageGallery = ({ src, alt }) => {
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        if (!isFullScreen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") setIsFullScreen(false);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFullScreen]);

    return (
        <>
            <div className="md:w-1/2">
                <div className="relative">
                    {src ? (
                        <button
                            type="button"
                            onClick={() => setIsFullScreen(true)}
                            aria-label={`View larger image of ${alt}`}
                            className="block w-full cursor-zoom-in"
                        >
                            <img
                                src={src}
                                alt={alt}
                                className="h-[400px] w-full rounded-lg object-contain"
                            />
                        </button>
                    ) : (
                        <div className="flex h-[400px] w-full items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500">
                            No image available
                        </div>
                    )}
                </div>
            </div>

            {isFullScreen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setIsFullScreen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Image of ${alt}`}
                >
                    <button
                        type="button"
                        onClick={() => setIsFullScreen(false)}
                        aria-label="Close full-screen image"
                        className="absolute right-5 top-4 z-10 text-3xl leading-none text-white hover:text-gray-300"
                    >
                        &times;
                    </button>
                    <img
                        src={src}
                        alt={alt}
                        className="max-h-full max-w-full object-contain"
                        onClick={(event) => event.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
};

export default DetailImageGallery;
