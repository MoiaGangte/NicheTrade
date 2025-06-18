import React from 'react'
import ProductCart from './ProductCart'
import { useAppContext } from '../context/AppContext'

const BestSeller = () => {
  const { products } = useAppContext()
  
  // Filter products to only show best sellers
  const bestSellerProducts = products.filter(product => product.isBestSeller)

  return (
    <div className='mt-10'>
      <div className='flex items-center justify-between'>
        <p className='text-2xl font-semibold text-white [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)]'>Best Seller</p>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8'>
        {bestSellerProducts.slice(0, 8).map((product) => (
          <ProductCart key={product._id} product={product} />
        ))}
      </div>
    </div>
  )
}

export default BestSeller