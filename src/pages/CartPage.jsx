import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShieldCheck, ChevronRight } from 'lucide-react';
import { useShop } from '../context/CartContext';
import './CartPage.css';

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useShop();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="container empty-cart">
        <h2>Tu carrito está vacío</h2>
        <p>¿No sabés qué comprar? ¡Cientos de productos te esperan!</p>
        <Link to="/" className="btn-primary" style={{marginTop: '2rem'}}>Descubrir promociones</Link>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <div className="cart-content">
        <div className="cart-items-section">
          <div className="cart-header">
            <h2>Productos ({cart.length})</h2>
            <button onClick={clearCart} className="btn-danger-text">Vaciar carrito</button>
          </div>
          
          <div className="cart-list">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.name} className="cart-item-img" />
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p className="cart-item-category">{item.category}</p>
                  
                  <div className="cart-item-actions">
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    <span className="stock-info">{item.stock} disponibles</span>
                  </div>
                </div>
                <div className="cart-item-price-area">
                  <span className="cart-item-price">${(item.price * item.quantity).toLocaleString()}</span>
                  {item.freeShipping && <span className="free-shipping">Envío gratis</span>}
                  <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-sidebar">
          <div className="summary-card">
            <h3>Resumen de compra</h3>
            <div className="summary-row">
              <span>Productos ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
              <span>${getCartTotal().toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Envíos</span>
              <span className="free-shipping">Gratis</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-total">
              <span>Total</span>
              <span>${getCartTotal().toLocaleString()}</span>
            </div>
            <button className="btn-primary checkout-btn" onClick={() => navigate('/checkout')}>
              Continuar compra <ChevronRight size={18} />
            </button>
          </div>
          
          <div className="security-badge">
            <ShieldCheck className="shield-icon" size={24} />
            <div>
              <strong>Compra Protegida</strong>
              <p>Recibí el producto que esperabas o te devolvemos tu dinero.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
