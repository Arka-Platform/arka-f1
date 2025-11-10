import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider, useToast } from './contexts/ToastContext'
import Layout from './components/Layout/Layout'
import ToastContainer from './components/shared/ToastContainer/ToastContainer'
import LandingPage from './pages/LandingPage/LandingPage'
import Home from './pages/Home/Home'
import BooksMarketplace from './pages/BooksMarketplace/BooksMarketplace'
import Order from './pages/Order/Order'
import ContactUs from './pages/ContactUs/ContactUs'
import BookPickup from './pages/BookPickup/BookPickup'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Preferences from './pages/Preferences/Preferences'
import Account from './pages/Account/Account'
import OrderHistory from './pages/OrderHistory/OrderHistory'
import Tracking from './pages/Tracking/Tracking'
import SellerInventory from './pages/SellerInventory/SellerInventory'
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
          <Route path="/order" element={<Order />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/pickup" element={<BookPickup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/account" element={<Account />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/tracking/:orderId?" element={<Tracking />} />
            <Route path="/inventory" element={<SellerInventory />} />
        </Routes>
      </Layout>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <div className="app">
            <AppContent />
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  )
}

export default App

