import React, { useState, useEffect } from 'react'
import ProductCart from './ProductCart'
import { useAppContext } from '../context/AppContext'

const BestSeller = () => {
  const { products } = useAppContext()
  // Add state to track if the screen is mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Filter products to only show best sellers
  const bestSellerProducts = products.filter(product => product.isBestSeller)

  return (
    <div className='mt-5'>
      <div className='flex items-center justify-between'>
        <p className='text-2xl font-semibold text-black [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)]'>Best Seller</p>
      </div>
      <div className='flex py-4 mt-8 overflow-x-auto no-scrollbar gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6'>
        {bestSellerProducts.slice(0, 8).map((product) => (
          <div key={product._id} className='min-w-[110px] md:min-w-0'>
            <ProductCart product={product} {...(isMobile ? { small: true } : {})} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default BestSeller