import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const GoogleAuthSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { handleGoogleAuthSuccess } = useAppContext();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            handleGoogleAuthSuccess(token);
        } else {
            toast.error('Google authentication failed. Please try again.');
            navigate('/');
        }
    }, [searchParams, handleGoogleAuthSuccess, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Completing Google Sign-In</h2>
                <p className="text-gray-500">Please wait while we complete your authentication...</p>
            </div>
        </div>
    );
};

export default GoogleAuthSuccess; 