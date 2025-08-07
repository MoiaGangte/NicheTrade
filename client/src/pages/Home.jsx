import React from 'react'
import MainBanner from '../components/MainBanner'
import BestSeller from '../components/BestSeller'
import BottomBanner from '../components/BottomBanner'
import Advertise from '../components/Addvertise'

const Home = () => {
  return (
    <div className="w-full min-w-full h-full min-h-screen mt-1 p-0 overflow-x-hidden">
        <MainBanner />
        <BestSeller />
        <Advertise />
        <BottomBanner />
    </div>
  )
}

export default Home