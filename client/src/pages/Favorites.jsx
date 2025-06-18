import React from 'react';
import { useAppContext } from '../context/AppContext';
import ProductCart from '../components/ProductCart';

const Favorites = () => {
    const { products, favorites } = useAppContext();

    // Filter products to only show favorited ones
    const favoritedProducts = products.filter(product => favorites[product._id]);

    return (
        <div className='mt-16'>
            <div className='flex flex-col items-end w-max'>
                <p className='text-2xl font-medium'>Favorites</p>
                <div className='w-16 h-0.5 bg-[var(--color-primary)] rounded-full'></div>
            </div>

            {favoritedProducts.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mt-6'>
                    {favoritedProducts.map((product) => (
                        <ProductCart key={product._id} product={product} />
                    ))}
                </div>
            ) : (
                <div className='flex items-center justify-center h-[60vh]'>
                    <p className='text-2xl font-medium text-[var(--color-primary)]'>No favorites yet</p>
                </div>
            )}
        </div>
    );
};

export default Favorites; 