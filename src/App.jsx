import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetail from './pages/ProductDetail';
import WishlistPage from './pages/WishlistPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UserProfile from './pages/UserProfile';
import SaaSLanding from './pages/SaaSLanding';
import Footer from './components/Footer';
import WhatsAppBtn from './components/WhatsAppBtn';
import LiveNotification from './components/LiveNotification';
import './styles/ThemeManager.css';

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Navbar />
        <main className="page-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/saas" element={<SaaSLanding />} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppBtn />
        <LiveNotification />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
