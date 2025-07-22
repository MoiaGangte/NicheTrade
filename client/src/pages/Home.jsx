import React from 'react'
import MainBanner from '../components/MainBanner'
import BestSeller from '../components/BestSeller'
import BottomBanner from '../components/BottomBanner'
import Advertise from '../components/Addvertise'

const Home = () => {
  return (
    <div className='mt-5 w-full'>
        <MainBanner />
        <BestSeller />
        <Advertise />
        <BottomBanner />
    </div>
  )
}

export default Home