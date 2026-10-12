import React from 'react'
import MainBanner from '../components/MainBanner'
import BestSeller from '../components/BestSeller'
import LostAndFound from '../components/LostAndFound'
import RequestItems from '../components/RequestItems'

const Home = () => {
  return (
    <div className="w-full min-w-full h-full min-h-screen mt-1 p-0 overflow-x-hidden">
        <MainBanner />
        <div id="best-products" className="home-dashboard-panel">
          <BestSeller />
        </div>
        <div id="lost-and-found" className="home-dashboard-panel scroll-mt-28">
          <LostAndFound />
        </div>
        <div id="request-items" className="home-dashboard-panel scroll-mt-28">
          <RequestItems />
        </div>
    </div>
  )
}

export default Home