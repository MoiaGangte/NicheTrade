import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import ProductCart from '../components/ProductCart'
import { useLocation } from 'react-router-dom'

const AllProduct = () => {

    const { products, searchQuery } = useAppContext()
    const [filteredProducts, setFilteredProducts] = useState([])
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
    const location = useLocation();
    // Read category from query string
    const params = new URLSearchParams(location.search);
    const initialCategory = params.get('category');
    const [categoryFilter, setCategoryFilter] = useState(initialCategory);

    // Sync categoryFilter with URL query parameter
    useEffect(() => {
      const params = new URLSearchParams(location.search);
      setCategoryFilter(params.get('category'));
    }, [location.search]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        let filtered = products;
        if (searchQuery.length > 0) {
            filtered = filtered.filter(
                product => product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (categoryFilter) {
            filtered = filtered.filter(
                product => product.category && product.category.toLowerCase() === categoryFilter.toLowerCase()
            );
        }
        setFilteredProducts(filtered);
    }, [products, searchQuery, categoryFilter]);

    // Clear category filter if user starts searching
    useEffect(() => {
        if (searchQuery.length > 0 && categoryFilter) {
            setCategoryFilter(null);
        }
    }, [searchQuery]);

    return (
        <div className='mt-5 flex flex-col'>
            <div className='flex flex-col items-end w-max'>
                <p className='text-3xl font-medium uppercase'>All Products</p>
                <div className='w-20 h-0.5 bg-[var(--color-primary)] rounded-full'></div>
            </div>

            {categoryFilter ? (
                <>
                    <div className='mt-6'>
                        <p className='text-2xl font-semibold mb-2'>{categoryFilter} Products</p>
                        <div className='grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 lg:grid-cols-5 w-full'>
                            {filteredProducts.filter((product) => product.inStock).map((product, index) => (
                                <div key={index} className="w-full">
                                    <ProductCart product={product} {...(isMobile ? { smaller: true } : {})} />
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Other products section */}
                    <div className='mt-10'>
                        <p className='text-2xl font-semibold mb-2'>Other Products</p>
                        <div className='grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 lg:grid-cols-5 w-full'>
                            {products.filter(product => product.inStock && product.category && product.category.toLowerCase() !== categoryFilter.toLowerCase()).map((product, index) => (
                                <div key={index} className="w-full">
                                    <ProductCart product={product} {...(isMobile ? { smaller: true } : {})} />
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className='grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 lg:grid-cols-5 mt-4 w-full'>
                    {filteredProducts.filter((product) => product.inStock).map((product, index) => (
                        <div key={index} className="w-full">
                            <ProductCart product={product} {...(isMobile ? { smaller: true } : {})} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default AllProduct