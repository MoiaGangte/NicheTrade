import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import { Toaster } from "react-hot-toast"
import Footer from './components/Footer'
import { useAppContext } from './context/AppContext'
import Login from './components/Login'
import AllProduct from './pages/AllProduct'
import ProductCategory from './pages/ProductCategory'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import AddAddress from './pages/AddAddress'
import MyOrders from './pages/MyOrders'
import SellerLogin from './components/seller/SellerLogin'
import SellerLayout from './pages/seller/SellerLayout'
import AddProduct from './pages/seller/AddProduct'
import ProductList from './pages/seller/ProductList'
import Orders from './pages/seller/Orders'
import OrderDetails from './pages/OrderDetails'
import SellerOrderDetails from './pages/seller/OrderDetails'
import Profile from './pages/Profile'
import Favorites from './pages/Favorites'
import { assets } from './assets/assets'
import GoogleAuthSuccess from './pages/GoogleAuthSuccess'

const App = () => {
  const isSellerPath = useLocation().pathname.includes("seller")
  const { showUserLogin, isSeller } = useAppContext()
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <div className='text-default min-h-screen text-black-700 bg-gray-200'>
      {isSellerPath ? null : <Navbar />}
      {showUserLogin ? <Login /> : null}

      <Toaster />
      <div className={`${isSellerPath ? "" : "px-6 md:px-16 lg:px-24 xl:px-32"}`} style={{
          backgroundImage: isHomePage ? `url(${assets.main_background_image_bg})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          minHeight: 'calc(100vh - 60px)', // Subtract footer height
          marginTop: '-60px', // Offset for navbar height
          paddingTop: '60px' // Add padding to compensate for negative margin
      }}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/products' element={<AllProduct />} />
          <Route path='/products/:category' element={<ProductCategory />} />
          <Route path='/products/:category/:id' element={<ProductDetails />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/add-address' element={<AddAddress />} />
          <Route path='/add-address/:id' element={<AddAddress />}    />
          <Route path='/favorites' element={<Favorites />} />
          <Route path='/my-orders' element={<MyOrders />} />
          <Route path='/order-details/:orderId' element={<OrderDetails />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/google-auth-success' element={<GoogleAuthSuccess />} />
          <Route path='/seller' element={isSeller ? <SellerLayout /> : <SellerLogin />}>
            <Route index element={isSeller ? <AddProduct /> : null} />
            <Route path='product-list' element={<ProductList />} />
            <Route path='orders' element={<Orders />} />
            <Route path='order-details/:orderId' element={<SellerOrderDetails />} />
          </Route>
        </Routes>
      </div>
      {!isSellerPath && <Footer />}
    </div>
  )
}

export default App