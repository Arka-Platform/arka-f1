import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider, useToast } from './contexts/ToastContext'
import Layout from './components/Layout/Layout'
import ToastContainer from './components/shared/ToastContainer/ToastContainer'
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'
import LandingPage from './pages/LandingPage/LandingPage'
import Home from './pages/Home/Home'
import BooksMarketplace from './pages/BooksMarketplace/BooksMarketplace'
import Recycling from './pages/Recycling/Recycling'
import Cart from './pages/Cart/Cart'
import Order from './pages/Order/Order'
import ContactUs from './pages/ContactUs/ContactUs'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import OAuthCallback from './pages/Login/OAuthCallback'
import OTPVerification from './pages/Login/OTPVerification'
import Preferences from './pages/Preferences/Preferences'
import Account from './pages/Account/Account'
import OrderHistory from './pages/OrderHistory/OrderHistory'
import Tracking from './pages/Tracking/Tracking'
import SellerInventory from './pages/SellerInventory/SellerInventory'
import Subscriptions from './pages/Subscriptions/Subscriptions'
import Analytics from './pages/Analytics/Analytics'
import Community from './pages/Community/Community'
import CircleDetail from './pages/CircleDetail/CircleDetail'
import StartChain from './pages/StartChain/StartChain'
import Exchange from './pages/Exchange/Exchange'
import MyExchanges from './pages/MyExchanges/MyExchanges'
import ExchangeDetail from './pages/ExchangeDetail/ExchangeDetail'
import Donation from './pages/Donation/Donation'
import BookRequests from './pages/BookRequests/BookRequests'
import Wishlist from './pages/Wishlist/Wishlist'
import Bookshelf from './pages/Bookshelf/Bookshelf'
import AdminLogin from './pages/Admin/AdminLogin/AdminLogin'
import AdminNGOs from './pages/Admin/AdminNGOs/AdminNGOs'
import './App.css'

function AppContent() {
  const { toasts, removeToast } = useToast()

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/books" element={<BooksMarketplace />} />
          <Route path="/recycling" element={<Recycling />} />
          <Route path="/pickup" element={<Recycling />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<Order />} />
          <Route path="/contact" element={<ContactUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/otp-verification" element={<OTPVerification />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/account" element={<Account />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/tracking/:orderId?" element={<Tracking />} />
            <Route path="/inventory" element={<SellerInventory />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/community" element={<Community />} />
            <Route path="/circles/:circleId" element={<CircleDetail />} />
            <Route path="/start-chain" element={<StartChain />} />
            <Route path="/exchange" element={<Exchange />} />
            <Route path="/exchanges/my" element={<MyExchanges />} />
            <Route path="/exchanges/:exchangeId" element={<ExchangeDetail />} />
            <Route path="/donation" element={<Donation />} />
            <Route path="/requests" element={<BookRequests />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/bookshelf" element={<Bookshelf />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/ngos" element={<AdminNGOs />} />
        </Routes>
      </Layout>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <div className="app">
                <ErrorBoundary>
                  <AppContent />
                </ErrorBoundary>
              </div>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App

