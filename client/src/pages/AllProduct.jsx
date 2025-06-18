import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import ProductCart from '../components/ProductCart'

const AllProduct = () => {

    const { products, searchQuery } = useAppContext()
    const [filteredProducts, setFilteredProducts] = useState([])

    useEffect(() => {
        if (searchQuery.length > 0) {
            setFilteredProducts(products.filter(
                product => product.name.toLowerCase().includes(searchQuery.toLowerCase())
            ))
        } else {
            setFilteredProducts(products)
        }
    }, [products, searchQuery])

    return (
        <div className='mt-5 flex flex-col'>
            <div className='flex flex-col items-end w-max'>
                <p className='text-2xl font-medium uppercase'>All Products</p>
                <div className='w-16 h-0.5 bg-[var(--color-primary)] rounded-full'></div>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mt-6'>
                {filteredProducts.filter((product) => product.inStock).map((product, index) => (
                    <div key={index} className="w-full">
                        <ProductCart product={product} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default AllProduct