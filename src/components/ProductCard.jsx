import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { useShop } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useShop();
  const navigate = useNavigate();
  const liked = isInWishlist(product.id);

  const handleCardClick = (e) => {
    // Prevent navigating if clicking cart or heart
    if(e.target.closest('button')) return;
    navigate(`/product/${product.id}`);
  };

  return (
    <div className="product-card" onClick={handleCardClick}>
      <button 
        className={`wishlist-heart ${liked ? 'liked' : ''}`}
        onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
      >
        <Heart size={20} fill={liked ? "var(--danger)" : "none"} color={liked ? "var(--danger)" : "#999"} />
      </button>

      <div className="product-image">
        {product.image && (product.image.endsWith('.mp4') || product.image.endsWith('.webm') || product.image.endsWith('.mov')) ? (
          <video 
            src={product.image} 
            muted 
            loop 
            playsInline 
            onMouseOver={(e) => e.target.play()} 
            onMouseOut={(e) => e.target.pause()}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
          />
        ) : (
          <img src={product.image} alt={product.name} />
        )}
      </div>
      <div className="product-info">
        <h3 className="product-price">${product.price.toLocaleString()}</h3>
        {product.freeShipping && <span className="free-shipping">Llega gratis mañana</span>}
        <h4 className="product-title">{product.name}</h4>
      </div>
      <div className="product-actions" onClick={e => e.stopPropagation()}>
        <button className="btn-primary add-to-cart" onClick={() => addToCart(product)}>
          <ShoppingCart size={18} /> Comprar Rápidamente
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
