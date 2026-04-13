import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '../context/CartContext';
import { CheckCircle2, Lock, XCircle, Loader2 } from 'lucide-react';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const { cart, getCartTotal, clearCart } = useShop(); 
  const navigate = useNavigate();
  const location = useLocation();
  
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Formularios
  const [formData, setFormData] = useState({
    name: '', document: '', email: '', phone: ''
  });

  // Verificar si venimos de un pago exitoso/fallido de Mercado Pago
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    
    if (status === 'success') {
      setSuccess(true);
      clearCart();
      setTimeout(() => navigate('/'), 5000);
    } else if (status === 'failure') {
      setError(true);
    }
  }, [location, clearCart, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setLoading(true);

    const amount = getCartTotal();
    const order_id = "ORD-" + Math.floor(Math.random() * 100000);

    try {
      // 1. Crear Preferencia en Backend
      const resp = await fetch('/api/payments/create_preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order_id,
          customer: formData.name,
          document: formData.document,
          email: formData.email,
          phone: formData.phone,
          amount: amount,
          items: cart.map(item => ({
            id: item.id,
            title: item.name,
            unit_price: item.price,
            quantity: item.quantity
          }))
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        // 2. Redirigir al Checkout de Mercado Pago
        window.location.href = data.init_point;
      } else {
        throw new Error("Error al crear preferencia");
      }
      
    } catch (err) {
      console.error("Error contactando a la API de pagos", err);
      alert("Hubo un error al procesar el pago. Intenta de nuevo.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container" style={{maxWidth: '600px', padding: '4rem 0'}}>
        <div className="checkout-success">
          <CheckCircle2 color="#00a650" size={80} className="success-icon" />
          <h2>¡Pago procesado con éxito!</h2>
          <p>Tu orden ha sido confirmada. Te enviamos los detalles al correo.</p>
          <p>En breve recibirás un WhatsApp con el seguimiento de tu pedido.</p>
          
          <div className="post-checkout-cta" style={{marginTop: '3rem', padding: '2rem', background: '#f0f7ff', borderRadius: '12px', border: '1px solid #cce3ff'}}>
             <h4 style={{marginBottom: '0.5rem'}}>¿Deseas seguir tu pedido?</h4>
             <p style={{fontSize: '0.9rem', marginBottom: '1.5rem'}}>Crea una contraseña opcional para guardar tus datos y ver el historial de compras en futuras visitas.</p>
             <div style={{display: 'flex', gap: '10px'}}>
               <input type="password" placeholder="Nueva Contraseña" style={{flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd'}} />
               <button className="btn-primary" style={{padding: '0.75rem 1.5rem'}}>Crear Cuenta</button>
             </div>
          </div>

          <p className="redirect-text" style={{marginTop: '2rem'}}>Serás redirigido al inicio en unos segundos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container checkout-success" style={{borderColor: 'var(--danger)'}}>
        <XCircle color="var(--danger)" size={80} className="success-icon" />
        <h2>El pago no pudo ser procesado</h2>
        <p>Hubo un problema con la transacción. Por favor, intenta con otro medio de pago.</p>
        <button onClick={() => navigate('/cart')} className="btn-primary" style={{marginTop: '2rem'}}>
          Volver al Carrito
        </button>
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <div className="checkout-content">
        <form className="payment-form" onSubmit={handleSubmit}>
          <h2><Lock size={20} className="lock-icon"/> Pago Seguro con Mercado Pago</h2>
          <p className="payment-subtitle">Completa tus datos para procesar el envío y recibir tu boleta electrónica.</p>
          
          <div className="form-group">
            <label>Nombre del Titular</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Carlos Mejías" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>RUT / DNI</label>
              <input type="text" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} placeholder="Ej: 12.345.678-9" required />
            </div>
            <div className="form-group">
              <label>Teléfono (WhatsApp)</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+56 9..." required />
            </div>
          </div>

          <div className="form-group">
            <label>Correo Electrónico</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Para enviarte el comprobante" required />
          </div>

          <hr style={{margin: '1.5rem 0', borderColor:'#ddd', borderTop:'1px'}}/>

          <button type="submit" className="btn-primary pay-btn" disabled={loading || cart.length === 0}>
            {loading ? (
              <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                <Loader2 className="animate-spin" /> Redirigiendo a Mercado Pago...
              </span>
            ) : `Pagar Total: $${getCartTotal().toLocaleString()}`}
          </button>
        </form>

        <div className="checkout-summary">
           <img src="https://logospng.org/download/mercado-pago/logo-mercado-pago-icon-1024.png" alt="Mercado Pago" className="mp-logo" />
           <h3>Pago Protegido</h3>
           <p>Tus datos están encriptados y protegidos por Mercado Pago Chile.</p>
           
           <div style={{marginTop: '2rem', textAlign: 'left', width: '100%', padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #ddd'}}>
             <h4 style={{marginBottom: '0.5rem', fontSize: '0.9rem'}}>Resumen del pedido:</h4>
             {cart.map(item => (
               <div key={item.id} style={{fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem'}}>
                 <span>{item.quantity}x {item.name}</span>
                 <span>${(item.price * item.quantity).toLocaleString()}</span>
               </div>
             ))}
             <div style={{borderTop: '1px solid #eee', marginTop: '0.5rem', paddingTop: '0.5rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between'}}>
               <span>Total:</span>
               <span>${getCartTotal().toLocaleString()}</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
