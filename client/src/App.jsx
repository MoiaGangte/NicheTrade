import React, { useEffect } from 'react'
import Navbar from './components/Navbar'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import { Toaster } from "react-hot-toast"
import Footer from './components/Footer'
import { useAppContext } from './context/AppContext'
import Login from './components/Login'
import AllProduct from './pages/AllProduct'
import ProductCategory from './pages/ProductCategory'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import DeliveryDetails from './pages/DeliveryDetails'
import AddAddress from './pages/AddAddress'
import MyOrders from './pages/MyOrders'
import SellerLayout from './pages/seller/SellerLayout'
import SellerRegistration from './pages/seller/SellerRegistration'
import AddProduct from './pages/seller/AddProduct'
import ProductList from './pages/seller/ProductList'
import Orders from './pages/seller/Orders'
import OrderDetails from './pages/OrderDetails'
import SellerOrderDetails from './pages/seller/OrderDetails'
import Profile from './pages/Profile'
import Favorites from './pages/Favorites'
import GoogleAuthSuccess from './pages/GoogleAuthSuccess'
import CategoryNav from './components/CategoryNav'
import AdminLogin from './components/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import LostFoundDetails from './pages/LostFoundDetails'
import RequestItemPage from './pages/RequestItemPage'
import RequestItemDetails from './pages/RequestItemDetails'
import DeveloperTeam from './pages/DeveloperTeam'
import Objective from './pages/Objective'
import Documentation from './pages/Documentation'
import Regulation from './pages/Regulation'
import Donate from './pages/Donate'

const App = () => {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const isPortalPath = location.pathname.startsWith('/seller') || location.pathname.startsWith('/admin')
  const { showUserLogin, user, isSeller, isSellerLoading, isAdmin, isAdminLoading } = useAppContext()
  const isHomePage = location.pathname === '/'

  return (
    <div className='text-default min-h-screen text-black-700 bg-gray-200'>
      {isPortalPath ? null : <Navbar />}
      {isPortalPath ? null : <CategoryNav />}
      {showUserLogin ? <Login /> : null}

      <Toaster />
      <div className={`${isPortalPath ? "" : `${isHomePage ? "md:px-16 lg:px-24 xl:px-32" : "px-6 md:px-16 lg:px-24 xl:px-32"}`} ${isHomePage ? "no-bg-mobile home-page-background" : ""}`} style={{
          backgroundImage: isHomePage ? undefined : 'none',
          minHeight: 'calc(100vh - 70px)', // Subtract footer height
      }}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/regulation' element={<Regulation />} />
          <Route path='/developer-team' element={<DeveloperTeam />} />
          <Route path='/objective' element={<Objective />} />
          <Route path='/documentation' element={<Documentation />} />
          <Route path='/donate' element={<Donate />} />
          <Route path='/lost-found/:id' element={<LostFoundDetails />} />
          <Route path='/request-item/add' element={<RequestItemPage />} />
          <Route path='/request-item/:id' element={<RequestItemDetails />} />
          <Route path='/products' element={<AllProduct />} />
          <Route path='/products/:category' element={<ProductCategory />} />
          <Route path='/products/:category/:id' element={<ProductDetails />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/order/delivery' element={<DeliveryDetails />} />
          <Route path='/add-address' element={<AddAddress />} />
          <Route path='/add-address/:id' element={<AddAddress />}    />
          <Route path='/favorites' element={<Favorites />} />
          <Route path='/my-orders' element={<MyOrders />} />
          <Route path='/order-details/:orderId' element={<OrderDetails />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/google-auth-success' element={<GoogleAuthSuccess />} />
          <Route path='/seller/login' element={<Navigate to='/' replace />} />
          <Route path='/seller/register' element={isSeller ? <Navigate to='/seller' replace /> : <SellerRegistration />} />
          <Route path='/seller' element={
            isSellerLoading ? <div className='min-h-screen grid place-items-center'>Loading seller account...</div>
              : isSeller && user ? <SellerLayout /> : <Navigate to='/' replace />
          }>
            <Route index element={<AddProduct />} />
            <Route path='product-list' element={<ProductList />} />
            <Route path='orders' element={<Orders />} />
            <Route path='order-details/:orderId' element={<SellerOrderDetails />} />
          </Route>
          <Route path='/admin/login' element={isAdmin ? <Navigate to='/admin/sellers' replace /> : <AdminLogin />} />
          <Route path='/admin' element={
            isAdminLoading ? <div className='min-h-screen grid place-items-center'>Loading admin account...</div>
              : isAdmin ? <AdminLayout /> : <Navigate to='/admin/login' replace />
          }>
            <Route index element={<Navigate to='/admin/sellers' replace />} />
            <Route path='sellers' element={<AdminDashboard section='sellers' />} />
            <Route path='upload-requests' element={<AdminDashboard section='upload-requests' />} />
            <Route path='products' element={<AdminDashboard section='products' />} />
            <Route path='lost-found' element={<AdminDashboard section='lost-found' />} />
            <Route path='request-items' element={<AdminDashboard section='request-items' />} />
          </Route>
        </Routes>
      </div>
      {!isPortalPath && <Footer />}
    </div>
  )
}

export default App