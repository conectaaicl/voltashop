import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, MapPin, Zap, Heart } from 'lucide-react';
import { useShop } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { getCartCount, wishlist, searchQuery, setSearchQuery, saasConfig } = useShop();
  const navigate = useNavigate();

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (window.location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <header className="navbar-container">
      <div className="navbar-top container">
        <Link to="/" className="navbar-logo">
          {saasConfig.store_logo?.includes('http') ? (
            <img src={saasConfig.store_logo} alt={saasConfig.store_name} style={{ height: '35px', marginRight: '10px' }} />
          ) : (
            <Zap size={28} className="logo-icon" />
          )}
          <span>{saasConfig.store_name}</span>
        </Link>
        
        <form className="search-bar" onSubmit={handleSearchSubmit}>
          <input 
            type="text" 
            placeholder="Buscar productos, marcas y más…" 
            className="search-input"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button type="submit" className="search-btn">
            <Search size={20} />
          </button>
        </form>

        <div className="navbar-promo">
           ¡Envíos gratis en 24hs! ⚡
        </div>
      </div>

      <div className="navbar-bottom container">
        <div className="location-selector">
          <MapPin size={18} />
          <div className="location-text">
            <span className="location-label">Enviar a</span>
            <span className="location-address">Capital Federal</span>
          </div>
        </div>

        <nav className="navbar-links">
          <Link to="/">Categorías</Link>
          <Link to="/">Ofertas</Link>
          <Link to="/">Historial</Link>
        </nav>

        <div className="navbar-actions">
          <Link to="/wishlist" className="cart-action">
            <Heart size={22} />
            {wishlist.length > 0 && <span className="cart-badge">{wishlist.length}</span>}
          </Link>
          <Link to="/profile" className="user-action">Mi Cuenta</Link>
          <Link to="/cart" className="cart-action">
            <ShoppingCart size={24} />
            {getCartCount() > 0 && <span className="cart-badge">{getCartCount()}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
