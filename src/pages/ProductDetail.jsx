import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShop } from '../context/CartContext';
import { ShoppingCart, Truck, ShieldCheck, Heart, ArrowLeft, Star, MessageSquare } from 'lucide-react';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, toggleWishlist, isInWishlist } = useShop();
  const [timeLeft, setTimeLeft] = useState(3600); 
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ userName: '', rating: 5, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const product = products.find(p => p.id === parseInt(id));

  const fetchReviews = async () => {
    try {
      const resp = await fetch(`/api/products/${id}/reviews`);
      const data = await resp.json();
      setReviews(data);
    } catch (err) {
      console.error("Error fetching reviews", err);
    }
  };

  useEffect(() => {
    if(!product) return;
    fetchReviews();
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [id, product]);

  if (!product) {
    return <div className="container" style={{padding: '4rem 0'}}><h2>Producto no encontrado</h2><button onClick={()=>navigate('/')} className="btn-primary">Volver</button></div>;
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const resp = await fetch(`/api/products/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: newReview.userName,
          rating: newReview.rating,
          comment: newReview.comment
        })
      });
      if (resp.ok) {
        setNewReview({ userName: '', rating: 5, comment: '' });
        fetchReviews();
      }
    } catch (err) {
      console.error("Error submitting review", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const liked = isInWishlist(product.id);
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;

  return (
    <div className="container product-detail-page">
      <button className="back-link" onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> Volver al listado
      </button>

      <div className="pdp-container">
        <div className="pdp-image-section">
          {product.image && (product.image.endsWith('.mp4') || product.image.endsWith('.webm') || product.image.endsWith('.mov')) ? (
            <video 
              src={product.image} 
              autoPlay 
              muted 
              controls 
              loop 
              playsInline 
              style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
            />
          ) : (
            <img src={product.image} alt={product.name} />
          )}
        </div>

        <div className="pdp-info-section">
          <p className="pdp-category">VoltaShop &gt; {product.category}</p>
          <div className="pdp-header-actions">
            <h1>{product.name}</h1>
            <button className="icon-btn-large" onClick={() => toggleWishlist(product.id)}>
               <Heart size={28} fill={liked ? "var(--danger)" : "none"} color={liked ? "var(--danger)" : "#666"} />
            </button>
          </div>

          <div className="pdp-price">
            <span className="current-price">${product.price.toLocaleString()}</span>
            <span className="installments">Mismo precio en 6 cuotas de ${(product.price / 6).toFixed(2)}</span>
          </div>

          <div className="pdp-urgency">
            <span className="badge-oferta">OFERTA DEL DÍA</span>
            <span className="timer">Termina en: 00:{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}</span>
          </div>

          <div className="pdp-delivery">
            <Truck size={24} color="#00a650" />
            <div>
              <strong className="free-shipping">Llega gratis mañana</strong>
              <p>Conocé los tiempos en tu domicilio</p>
            </div>
          </div>

          <div className="pdp-stock">
            <p><strong>Stock disponible</strong></p>
            <p className="stock-count">({product.stock} unidades)</p>
          </div>

          <div className="pdp-buy-actions">
            <button className="btn-primary btn-block buy-now" onClick={() => { addToCart(product); navigate('/cart'); }}>
              Comprar ahora
            </button>
            <button className="btn-secondary btn-block add-cart" onClick={() => addToCart(product)}>
              Agregar al carrito
            </button>
          </div>

          <div className="pdp-security">
            <ShieldCheck size={20} color="#666" />
            <span><strong>Compra Protegida</strong>, recibí el producto que esperabas o te devolvemos tu dinero.</span>
          </div>

          <div className="pdp-description">
            <h3>Descripción</h3>
            <p style={{whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#8f9ba8'}}>{product.description || "Un excelente producto que no te puedes perder. Diseñado con altos estándares de calidad."}</p>
          </div>
        </div>
      </div>

      <div className="pdp-reviews-section">
        <div className="reviews-header">
          <h3>Opiniones sobre el producto</h3>
          <div className="reviews-stats">
            <Star color="#ffb100" fill="#ffb100" size={20} />
            <strong> {reviews.length > 0 ? (reviews.reduce((a,b)=>a+b.rating,0)/reviews.length).toFixed(1) : "0.0"}</strong>
            <span> ({reviews.length} reseñas)</span>
          </div>
        </div>

        <div className="reviews-list">
          {reviews.length === 0 ? (
            <p style={{textAlign: 'center', padding: '2rem', color: '#666'}}>
              Aún no hay opiniones. ¡Sé el primero en comentar!
            </p>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="review-card">
                <div className="review-top">
                  <span className="review-user">{r.user_name}</span>
                  <div className="review-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < r.rating ? "#ffb100" : "none"} color={i < r.rating ? "#ffb100" : "#ccc"} />
                    ))}
                  </div>
                </div>
                <span className="review-date">{new Date(r.created_at).toLocaleDateString()}</span>
                <p className="review-comment">{r.comment}</p>
              </div>
            ))
          )}
        </div>

        <div className="add-review-form">
          <h4>¿Qué te pareció este producto?</h4>
          <form onSubmit={handleSubmitReview} className="review-inputs">
            <div className="rating-input">
              <label>Tu calificación: </label>
              {[1,2,3,4,5].map(star => (
                <button 
                  key={star} 
                  type="button" 
                  className="star-btn"
                  onClick={() => setNewReview({...newReview, rating: star})}
                >
                  <Star size={24} fill={star <= newReview.rating ? "#ffb100" : "none"} color={star <= newReview.rating ? "#ffb100" : "#ccc"} />
                </button>
              ))}
            </div>
            
            <input 
              type="text" 
              placeholder="Tu nombre" 
              value={newReview.userName}
              onChange={e => setNewReview({...newReview, userName: e.target.value})}
              required
            />
            
            <textarea 
              placeholder="Escribe tu opinión aquí..." 
              value={newReview.comment}
              onChange={e => setNewReview({...newReview, comment: e.target.value})}
              required
            />

            <button type="submit" className="btn-primary submit-review-btn" disabled={isSubmitting}>
              {isSubmitting ? "Publicando..." : "Publicar opinión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
