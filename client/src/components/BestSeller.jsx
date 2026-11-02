import React from 'react'
import ProductCart from './ProductCart'
import { useAppContext } from '../context/AppContext'

const BestSeller = () => {
  const { products } = useAppContext()
  // Filter products to only show best sellers
  const bestSellerProducts = products.filter(product => product.isBestSeller)

  return (
    <div className='mt-2'>
      <div className='flex items-center justify-between'>
        <p className='text-2xl font-semibold text-black [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)]'>Best Sellers</p>
      </div>
      <div className='flex bg-white py-4 overflow-x-auto no-scrollbar gap-4 snap-x snap-mandatory md:bg-transparent md:grid md:grid-cols-2 md:overflow-visible md:snap-none lg:grid-cols-3 xl:grid-cols-4 md:gap-4'>
        {bestSellerProducts.slice(0, 8).map((product) => (
          <div key={product._id} className='min-w-[110px] shrink-0 snap-start md:min-w-0 md:shrink'>
            <ProductCart product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default BestSeller