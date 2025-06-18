import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const MainBanner = () => {
    const navigate = useNavigate()

    return (
        <div className='flex flex-col items-center justify-center text-center'>
            <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-white [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)]'>Welcome to EimiCart</h1>
            <p className='text-lg md:text-xl text-white outline outline-black mt-1 [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)]'>Best offer price, Exclusive top brand, DoorStep Delivery at LAMKA!! </p>
            <div className='flex items-center gap-4 mt-4'>
                <button onClick={() => navigate('/products')} className='px-8 mt-4 py-3 bg-[var(--color-primary)] shadow-lg p-4 text-white font-medium rounded-none border-2 border-transparent hover:border-white active:border-white transition'>
                    Shop now
                </button>
                <p className='text-white mt-4 text-lg [text-shadow:_1px_1px_0_rgb(0_0_0_/_100%)] relative'>
                    Shop with us with love and joy!!
                    <span className='absolute bottom-0 left-0 w-full h-0.5 bg-black [box-shadow:_0_0_2px_black]'></span>
                </p>
            </div>
        </div>
    )
}

export default MainBanner