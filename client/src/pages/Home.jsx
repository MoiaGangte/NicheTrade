import React from 'react'
import MainBanner from '../components/MainBanner'
import BestSeller from '../components/BestSeller'
import BottomBanner from '../components/BottomBanner'

const Home = () => {
  return (
    <div className='mt-5'>
        <MainBanner />
        <BestSeller />
        <BottomBanner />
    </div>
  )
}

export default Home