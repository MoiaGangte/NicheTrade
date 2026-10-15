import { useState } from "react";

const PasswordInput = ({ className = "", ...props }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative mt-1 w-full">
            <input
                {...props}
                type={isVisible ? "text" : "password"}
                className={`${className} pr-10`}
            />
            <button
                type="button"
                onClick={() => setIsVisible((visible) => !visible)}
                aria-label={isVisible ? "Hide password" : "Show password"}
                aria-pressed={isVisible}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
                <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    {isVisible ? (
                        <>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.58 10.59a2 2 0 002.83 2.83" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.88 5.09A10.94 10.94 0 0112 4.9c5 0 9 4.5 9 7.1a8.9 8.9 0 01-2.02 3.15M6.61 6.61C4.38 8 3 10.17 3 12c0 2.6 4 7.1 9 7.1 1.29 0 2.5-.32 3.58-.86" />
                        </>
                    ) : (
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.25 12s3.5-7 9.75-7 9.75 7 9.75 7-3.5 7-9.75 7-9.75-7-9.75-7z"
                        />
                    )}
                    {!isVisible && (
                        <circle cx="12" cy="12" r="3" strokeWidth={2} />
                    )}
                </svg>
            </button>
        </div>
    );
};

export default PasswordInput;
