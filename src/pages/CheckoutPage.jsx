import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '../context/CartContext';
import { CheckCircle2, Lock, XCircle, Loader2, CreditCard, Building2 } from 'lucide-react';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const { cart, getCartTotal, clearCart } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const [success, setSuccess] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payMethod, setPayMethod] = useState('card');
  const [payConfig, setPayConfig] = useState({ mp_enabled: false, transfer_enabled: false });
  const [formData, setFormData] = useState({ name: '', document: '', email: '', phone: '' });

  useEffect(() => {
    fetch('/api/config/payment-public').then(r=>r.json()).then(d=>{
      setPayConfig(d);
      if (!d.mp_enabled && d.transfer_enabled) setPayMethod('transfer');
      else if (d.mp_enabled) setPayMethod('card');
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (status === 'success') { setSuccess(true); clearCart(); setTimeout(()=>navigate('/'), 5000); }
    else if (status === 'failure') { setError(true); }
  }, [location, clearCart, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cart.length) return;
    setLoading(true);
    const amount = getCartTotal();
    const order_id = 'ORD-' + Math.floor(Math.random()*100000);
    const payload = {
      id: order_id, customer: formData.name, document: formData.document,
      email: formData.email, phone: formData.phone, amount,
      items: cart.map(i=>({id:i.id,title:i.name,unit_price:i.price,quantity:i.quantity}))
    };

    if (payMethod === 'transfer') {
      try {
        const resp = await fetch('/api/payments/transfer', {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
        });
        if (resp.ok) {
          const data = await resp.json();
          setTransferSuccess({...data.bank, order_id, amount, customer: formData.name, email: formData.email});
          clearCart();
        } else {
          const err = await resp.json().catch(()=>({}));
          alert('Error: ' + (err.detail || 'No se pudo procesar la orden'));
        }
      } catch { alert('Error de conexion. Intenta de nuevo.'); }
      setLoading(false);
      return;
    }

    // Pago con tarjeta (Mercado Pago)
    try {
      const resp = await fetch('/api/payments/create_preference', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
      });
      if (resp.ok) {
        const data = await resp.json();
        window.location.href = data.init_point;
      } else {
        const err = await resp.json().catch(()=>({}));
        const errMsg = err.detail || 'Error al conectar con Mercado Pago';
        fetch('/api/payments/notify-failure', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({order_id, customer: formData.name, email: formData.email, amount, error: errMsg})
        }).catch(()=>{});
        alert('Error al procesar el pago: ' + errMsg + (payConfig.transfer_enabled ? '\n\nPuedes pagar por transferencia bancaria.' : ''));
        setLoading(false);
      }
    } catch { alert('Error de conexion. Intenta de nuevo.'); setLoading(false); }
  };

  if (success) return (
    <div className="container" style={{maxWidth:'600px',padding:'4rem 0'}}>
      <div className="checkout-success">
        <CheckCircle2 color="#00a650" size={80} className="success-icon"/>
        <h2>Pago procesado con exito</h2>
        <p>Tu orden ha sido confirmada. Te enviamos los detalles al correo.</p>
        <p className="redirect-text" style={{marginTop:'2rem'}}>Seras redirigido al inicio en unos segundos...</p>
      </div>
    </div>
  );

  if (transferSuccess) return (
    <div className="container" style={{maxWidth:'620px',padding:'3rem 0'}}>
      <div className="checkout-success">
        <CheckCircle2 color="#f7c948" size={80} className="success-icon"/>
        <h2 style={{color:'#333'}}>Pedido registrado</h2>
        <p>Hola <strong>{transferSuccess.customer}</strong>, recibimos tu pedido <strong>{transferSuccess.order_id}</strong> por <strong>${transferSuccess.amount?.toLocaleString()}</strong>.</p>
        <p>Te enviamos las instrucciones a <strong>{transferSuccess.email}</strong>. Datos para transferir:</p>
        <div style={{background:'#fffbea',border:'2px solid #f7c948',borderRadius:'12px',padding:'1.5rem',textAlign:'left',width:'100%',marginTop:'1rem'}}>
          {transferSuccess.bank_name&&<p style={{margin:'0.3rem 0'}}><b>Banco:</b> {transferSuccess.bank_name}</p>}
          {transferSuccess.bank_account_type&&<p style={{margin:'0.3rem 0'}}><b>Tipo:</b> {transferSuccess.bank_account_type}</p>}
          {transferSuccess.bank_account_number&&<p style={{margin:'0.3rem 0'}}><b>N cuenta:</b> {transferSuccess.bank_account_number}</p>}
          {transferSuccess.bank_holder_name&&<p style={{margin:'0.3rem 0'}}><b>Titular:</b> {transferSuccess.bank_holder_name}</p>}
          {transferSuccess.bank_holder_rut&&<p style={{margin:'0.3rem 0'}}><b>RUT:</b> {transferSuccess.bank_holder_rut}</p>}
          {transferSuccess.bank_email&&<p style={{margin:'0.3rem 0'}}><b>Email confirmacion:</b> {transferSuccess.bank_email}</p>}
          {transferSuccess.transfer_instructions&&<p style={{marginTop:'0.8rem',fontSize:'0.88rem',color:'#666'}}>{transferSuccess.transfer_instructions}</p>}
        </div>
        <button onClick={()=>navigate('/')} className="btn-primary" style={{marginTop:'2rem'}}>Volver al inicio</button>
      </div>
    </div>
  );

  if (error) return (
    <div className="container checkout-success" style={{borderColor:'var(--danger)'}}>
      <XCircle color="var(--danger)" size={80} className="success-icon"/>
      <h2>El pago no pudo ser procesado</h2>
      <p>Hubo un problema con la transaccion.</p>
      {payConfig.transfer_enabled&&(
        <button onClick={()=>{setError(false);setPayMethod('transfer');}} className="btn-primary" style={{marginTop:'1rem',marginRight:'1rem',background:'#2d3748'}}>
          Pagar por Transferencia
        </button>
      )}
      <button onClick={()=>navigate('/cart')} className="btn-primary" style={{marginTop:'1rem'}}>Volver al Carrito</button>
    </div>
  );

  const bothEnabled = payConfig.mp_enabled && payConfig.transfer_enabled;

  return (
    <div className="container checkout-page">
      <div className="checkout-content">
        <form className="payment-form" onSubmit={handleSubmit}>
          <h2><Lock size={20} className="lock-icon"/> Pago Seguro</h2>
          <p className="payment-subtitle">Completa tus datos para procesar el envio.</p>

          {bothEnabled&&(
            <div style={{display:'flex',gap:'12px',marginBottom:'1.5rem'}}>
              <button type="button" onClick={()=>setPayMethod('card')} style={{flex:1,padding:'0.9rem',borderRadius:'10px',border:payMethod==='card'?'2px solid var(--accent)':'1px solid #ddd',background:payMethod==='card'?'#fff9e6':'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',fontWeight:600,color:'#333'}}>
                <CreditCard size={18} color={payMethod==='card'?'#f7c948':'#888'}/> Tarjeta / MP
              </button>
              <button type="button" onClick={()=>setPayMethod('transfer')} style={{flex:1,padding:'0.9rem',borderRadius:'10px',border:payMethod==='transfer'?'2px solid var(--accent)':'1px solid #ddd',background:payMethod==='transfer'?'#fff9e6':'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',fontWeight:600,color:'#333'}}>
                <Building2 size={18} color={payMethod==='transfer'?'#f7c948':'#888'}/> Transferencia
              </button>
            </div>
          )}
          {!payConfig.mp_enabled&&payConfig.transfer_enabled&&(
            <div style={{background:'#f0f9ff',border:'1px solid #90cdf4',borderRadius:'8px',padding:'0.8rem 1rem',marginBottom:'1rem',fontSize:'0.88rem',color:'#2b6cb0',display:'flex',alignItems:'center',gap:'8px'}}>
              <Building2 size={16}/> Pago por transferencia bancaria
            </div>
          )}

          <div className="form-group">
            <label>Nombre del Titular</label>
            <input type="text" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} placeholder="Ej: Carlos Mejias" required/>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>RUT / DNI</label>
              <input type="text" value={formData.document} onChange={e=>setFormData({...formData,document:e.target.value})} placeholder="12.345.678-9" required/>
            </div>
            <div className="form-group">
              <label>Telefono (WhatsApp)</label>
              <input type="text" value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})} placeholder="+56 9..." required/>
            </div>
          </div>
          <div className="form-group">
            <label>Correo Electronico</label>
            <input type="email" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} placeholder="Para enviarte el comprobante" required/>
          </div>

          {payMethod==='transfer'&&payConfig.transfer_enabled&&(
            <div style={{background:'#fffbea',border:'1px solid #f7c948',borderRadius:'10px',padding:'1rem 1.2rem',margin:'1rem 0',fontSize:'0.88rem'}}>
              <p style={{fontWeight:600,marginBottom:'0.5rem',color:'#7c5c00'}}>Datos para transferencia:</p>
              {payConfig.bank_name&&<p style={{margin:'0.2rem 0'}}>Banco: <b>{payConfig.bank_name}</b></p>}
              {payConfig.bank_account_type&&<p style={{margin:'0.2rem 0'}}>Tipo: <b>{payConfig.bank_account_type}</b></p>}
              {payConfig.bank_account_number&&<p style={{margin:'0.2rem 0'}}>N cuenta: <b>{payConfig.bank_account_number}</b></p>}
              {payConfig.bank_holder_name&&<p style={{margin:'0.2rem 0'}}>Titular: <b>{payConfig.bank_holder_name}</b></p>}
              {payConfig.bank_holder_rut&&<p style={{margin:'0.2rem 0'}}>RUT: <b>{payConfig.bank_holder_rut}</b></p>}
              {payConfig.bank_email&&<p style={{margin:'0.2rem 0'}}>Email confirmacion: <b>{payConfig.bank_email}</b></p>}
            </div>
          )}

          <hr style={{margin:'1.5rem 0',borderColor:'#ddd'}}/>
          <button type="submit" className="btn-primary pay-btn" disabled={loading||!cart.length||(!payConfig.mp_enabled&&!payConfig.transfer_enabled)}>
            {loading
              ? <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px'}}><Loader2 className="animate-spin"/>{payMethod==='transfer'?'Procesando...':'Redirigiendo a Mercado Pago...'}</span>
              : payMethod==='transfer'
                ? `Confirmar por Transferencia: $${getCartTotal().toLocaleString()}`
                : `Pagar $${getCartTotal().toLocaleString()} con Mercado Pago`
            }
          </button>
          {!payConfig.mp_enabled&&!payConfig.transfer_enabled&&(
            <p style={{color:'#e53e3e',fontSize:'0.85rem',marginTop:'0.5rem',textAlign:'center'}}>Pagos no configurados. Contacta al administrador.</p>
          )}
        </form>

        <div className="checkout-summary">
          {payMethod==='card'&&payConfig.mp_enabled&&(
            <img src="https://logospng.org/download/mercado-pago/logo-mercado-pago-icon-1024.png" alt="Mercado Pago" className="mp-logo"/>
          )}
          {payMethod==='transfer'&&<div style={{fontSize:'3rem',marginBottom:'0.5rem'}}>🏦</div>}
          <h3>{payMethod==='transfer'?'Transferencia Bancaria':'Pago Protegido'}</h3>
          <p>{payMethod==='transfer'?'Recibiras las instrucciones por correo al confirmar.':'Datos encriptados y protegidos por Mercado Pago Chile.'}</p>
          <div style={{marginTop:'2rem',textAlign:'left',width:'100%',padding:'1rem',background:'#fff',borderRadius:'8px',border:'1px solid #ddd'}}>
            <h4 style={{marginBottom:'0.5rem',fontSize:'0.9rem'}}>Resumen:</h4>
            {cart.map(item=>(
              <div key={item.id} style={{fontSize:'0.8rem',display:'flex',justifyContent:'space-between',marginBottom:'0.3rem'}}>
                <span>{item.quantity}x {item.name}</span>
                <span>${(item.price*item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div style={{borderTop:'1px solid #eee',marginTop:'0.5rem',paddingTop:'0.5rem',fontWeight:'bold',display:'flex',justifyContent:'space-between'}}>
              <span>Total:</span><span>${getCartTotal().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
