import React from 'react'
import MainBanner from '../components/MainBanner'
import BestSeller from '../components/BestSeller'
import BottomBanner from '../components/BottomBanner'
import Advertise from '../components/Addvertise'

const Home = () => {
  return (
    <div className="mt-3 w-full m-0 p-0">
        <MainBanner />
        <BestSeller />
        <Advertise />
        <BottomBanner />
    </div>
  )
}

export default Home