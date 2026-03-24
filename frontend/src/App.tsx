import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider, useToast } from './contexts/ToastContext'
import Layout from './components/Layout/Layout'
import { ProtectedRoute, AdminRoute } from './components/RouteGuards/RouteGuards'
import ToastContainer from './components/shared/ToastContainer/ToastContainer'
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'
import './App.css'

const LandingPage = lazy(() => import('./pages/LandingPage/LandingPage'))
const Home = lazy(() => import('./pages/Home/Home'))
const BooksMarketplace = lazy(() => import('./pages/BooksMarketplace/BooksMarketplace'))
const Recycling = lazy(() => import('./pages/Recycling/Recycling'))
const Cart = lazy(() => import('./pages/Cart/Cart'))
const Order = lazy(() => import('./pages/Order/Order'))
const ContactUs = lazy(() => import('./pages/ContactUs/ContactUs'))
const Login = lazy(() => import('./pages/Login/Login'))
const Register = lazy(() => import('./pages/Register/Register'))
const OAuthCallback = lazy(() => import('./pages/Login/OAuthCallback'))
const OTPVerification = lazy(() => import('./pages/Login/OTPVerification'))
const Preferences = lazy(() => import('./pages/Preferences/Preferences'))
const Account = lazy(() => import('./pages/Account/Account'))
const OrderHistory = lazy(() => import('./pages/OrderHistory/OrderHistory'))
const Tracking = lazy(() => import('./pages/Tracking/Tracking'))
const SellerInventory = lazy(() => import('./pages/SellerInventory/SellerInventory'))
const Subscriptions = lazy(() => import('./pages/Subscriptions/Subscriptions'))
const Analytics = lazy(() => import('./pages/Analytics/Analytics'))
const Community = lazy(() => import('./pages/Community/Community'))
const CircleDetail = lazy(() => import('./pages/CircleDetail/CircleDetail'))
const StartChain = lazy(() => import('./pages/StartChain/StartChain'))
const Exchange = lazy(() => import('./pages/Exchange/Exchange'))
const MyExchanges = lazy(() => import('./pages/MyExchanges/MyExchanges'))
const ExchangeDetail = lazy(() => import('./pages/ExchangeDetail/ExchangeDetail'))
const Donation = lazy(() => import('./pages/Donation/Donation'))
const BookRequests = lazy(() => import('./pages/BookRequests/BookRequests'))
const Wishlist = lazy(() => import('./pages/Wishlist/Wishlist'))
const Bookshelf = lazy(() => import('./pages/Bookshelf/Bookshelf'))
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin/AdminLogin'))
const AdminNGOs = lazy(() => import('./pages/Admin/AdminNGOs/AdminNGOs'))

function AppContent() {
  const { toasts, removeToast } = useToast()

  return (
    <>
      <Layout>
        <Suspense fallback={<div style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}>Loading...</div>}>
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
              <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
              <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
              <Route path="/tracking/:orderId?" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><SellerInventory /></ProtectedRoute>} />
              <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
              <Route path="/circles/:circleId" element={<ProtectedRoute><CircleDetail /></ProtectedRoute>} />
              <Route path="/start-chain" element={<ProtectedRoute><StartChain /></ProtectedRoute>} />
              <Route path="/exchange" element={<ProtectedRoute><Exchange /></ProtectedRoute>} />
              <Route path="/exchanges/my" element={<ProtectedRoute><MyExchanges /></ProtectedRoute>} />
              <Route path="/exchanges/:exchangeId" element={<ProtectedRoute><ExchangeDetail /></ProtectedRoute>} />
              <Route path="/donation" element={<ProtectedRoute><Donation /></ProtectedRoute>} />
              <Route path="/requests" element={<ProtectedRoute><BookRequests /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
              <Route path="/bookshelf" element={<ProtectedRoute><Bookshelf /></ProtectedRoute>} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/ngos" element={<AdminRoute><AdminNGOs /></AdminRoute>} />
          </Routes>
        </Suspense>
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

