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

const LandingPage = lazy(() => import('./screens/LandingPage/LandingPage'))
const Home = lazy(() => import('./screens/Home/Home'))
const BooksMarketplace = lazy(() => import('./screens/BooksMarketplace/BooksMarketplace'))
const Browse = lazy(() => import('./screens/Browse/Browse'))
const BookDetails = lazy(() => import('./screens/BookDetails/BookDetails'))
const Recycling = lazy(() => import('./screens/Recycling/Recycling'))
const Cart = lazy(() => import('./screens/Cart/Cart'))
const Order = lazy(() => import('./screens/Order/Order'))
const ContactUs = lazy(() => import('./screens/ContactUs/ContactUs'))
const Login = lazy(() => import('./screens/Login/Login'))
const Register = lazy(() => import('./screens/Register/Register'))
const OAuthCallback = lazy(() => import('./screens/Login/OAuthCallback'))
const OTPVerification = lazy(() => import('./screens/Login/OTPVerification'))
const Preferences = lazy(() => import('./screens/Preferences/Preferences'))
const Account = lazy(() => import('./screens/Account/Account'))
const OrderHistory = lazy(() => import('./screens/OrderHistory/OrderHistory'))
const Tracking = lazy(() => import('./screens/Tracking/Tracking'))
const SellerInventory = lazy(() => import('./screens/SellerInventory/SellerInventory'))
const Subscriptions = lazy(() => import('./screens/Subscriptions/Subscriptions'))
const Analytics = lazy(() => import('./screens/Analytics/Analytics'))
const Community = lazy(() => import('./screens/Community/Community'))
const CircleDetail = lazy(() => import('./screens/CircleDetail/CircleDetail'))
const StartChain = lazy(() => import('./screens/StartChain/StartChain'))
const Exchange = lazy(() => import('./screens/Exchange/Exchange'))
const MyExchanges = lazy(() => import('./screens/MyExchanges/MyExchanges'))
const ExchangeDetail = lazy(() => import('./screens/ExchangeDetail/ExchangeDetail'))
const Donation = lazy(() => import('./screens/Donation/Donation'))
const BookRequests = lazy(() => import('./screens/BookRequests/BookRequests'))
const Wishlist = lazy(() => import('./screens/Wishlist/Wishlist'))
const Bookshelf = lazy(() => import('./screens/Bookshelf/Bookshelf'))
const AdminLogin = lazy(() => import('./screens/Admin/AdminLogin/AdminLogin'))
const AdminNGOs = lazy(() => import('./screens/Admin/AdminNGOs/AdminNGOs'))
const AdminShipments = lazy(() => import('./screens/Admin/AdminShipments/AdminShipments'))

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
            <Route path="/browse" element={<Browse />} />
            <Route path="/books/:bookId" element={<BookDetails />} />
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
              <Route path="/admin/shipments" element={<AdminRoute><AdminShipments /></AdminRoute>} />
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

