import React, { useState, useEffect } from 'react';
import { useShop } from '../context/CartContext';
import { Package, Plus, TrendingUp, DollarSign, Edit3, Image, LayoutTemplate, Search, ShoppingBag, Lock, Truck, Rocket, CreditCard, Building2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLogin from './AdminLogin';
import './AdminDashboard.css';

const data = [
  { name: 'Lun', ventas: 400 }, { name: 'Mar', ventas: 300 }, { name: 'Mié', ventas: 500 },
  { name: 'Jue', ventas: 280 }, { name: 'Vie', ventas: 590 }, { name: 'Sáb', ventas: 800 }, { name: 'Dom', ventas: 700 },
];

const AdminDashboard = () => {
  const { products, removeProduct, addProduct, bannerConfig, updateBanner, seoConfig, updateSeo } = useShop();
  const [activeTab, setActiveTab] = useState('resumen');
  const [payConfig, setPayConfig] = useState({mp_access_token:'',transfer_enabled:false,bank_name:'',bank_account_type:'',bank_account_number:'',bank_holder_name:'',bank_holder_rut:'',bank_email:'',transfer_instructions:''});
  const [payConfigMsg, setPayConfigMsg] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('admin_token'));
  const [realOrders, setRealOrders] = useState([]);
  const [saasConfig, setSaasConfig] = useState(null);

  // Cargar ventas REALES desde la Base de Datos (Backend)
  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('admin_token');
      fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : [])
        .then(data => { if(Array.isArray(data)) setRealOrders(data); })
        .catch(err => console.error('Error cargando ventas:', err));
        
      fetch('/api/landing')
        .then(res => res.json())
        .then(data => setSaasConfig(data))
        .catch(err => console.error('Error cargando SaaS Config:', err));
    }
  }, [isAuthenticated, activeTab]); // Recarga al cambiar de pestaña
  
  // States for products logic
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category: '', image: '', images: [], description: '', freeShipping: false });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadType, setUploadType] = useState(null);
  const [catL1, setCatL1] = useState(''); const [catL2, setCatL2] = useState(''); const [catL3, setCatL3] = useState('');
  const [newCatL1, setNewCatL1] = useState(''); const [newCatL2, setNewCatL2] = useState(''); const [newCatL3, setNewCatL3] = useState('');

  // States for SEO/Banner Config logic
  const [bannerForm, setBannerForm] = useState(bannerConfig);
  const [seoForm, setSeoForm] = useState(seoConfig);

  // States for Shipping Modal
  const [shipModal, setShipModal] = useState(false);
  const [shipOrderId, setShipOrderId] = useState('');
  const [shipCourier, setShipCourier] = useState('');
  const [shipTracking, setShipTracking] = useState('');
  const [shipLoading, setShipLoading] = useState(false);

  const handleShipOrder = async () => {
    setShipLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/orders/${shipOrderId}/ship`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courier: shipCourier, tracking_number: shipTracking })
      });
      const data = await res.json();
      alert(`✅ ${data.message}`);
      // Actualizar estado local de la orden
      const updatedOrders = orders.map(o => o.id === shipOrderId 
        ? { ...o, status: 'Enviado', courier: shipCourier, tracking_number: shipTracking } 
        : o
      );
      // Forzar re-render (si tu context lo permite)
      window.location.reload();
    } catch (err) {
      alert('❌ Error al despachar. Revisa la consola del Backend.');
    }
    setShipLoading(false);
    setShipModal(false);
    setShipCourier('');
    setShipTracking('');
  };

  const handleAiOptimize = async () => {
    if (!newProduct.name || !newProduct.category) {
      alert('Por favor ingressa el nombre y categoría primero');
      return;
    }
    
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProduct)
      });
      if (!res.ok) throw new Error('Error al optimizar');
      const data = await res.json();
      setNewProduct(prev => ({ ...prev, description: data.optimized_description }));
    } catch (err) {
      alert('❌ Error al conectar con ConectaAI Intelligence');
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingFile(true);
    const uploaded = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) { const err = await res.json(); alert('Error: ' + err.detail); continue; }
        const data = await res.json();
        uploaded.push({ url: data.url, type: data.type });
      } catch { alert('Error al subir archivo'); }
    }
    if (uploaded.length) {
      setNewProduct(prev => {
        const newImages = [...prev.images, ...uploaded];
        return { ...prev, images: newImages, image: newImages[0]?.url || prev.image };
      });
    }
    setUploadingFile(false);
    e.target.value = '';
  };

  const removeMedia = (index) => {
    setNewProduct(prev => {
      const imgs = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: imgs, image: imgs[0]?.url || '' };
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const imagesJson = JSON.stringify(newProduct.images.map(m => m.url));
    const productData = {
      ...newProduct,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock),
      image: newProduct.images[0]?.url || newProduct.image,
      images: imagesJson,
    };
    const result = await addProduct(productData);
    if (result) {
      setAddSuccess('Producto "' + newProduct.name + '" publicado correctamente');
      setNewProduct({ name: '', price: '', stock: '', category: '', image: '', images: [], description: '', freeShipping: false });
      setUploadPreview(null); setUploadType(null);
      setCatL1(''); setCatL2(''); setCatL3('');
      setNewCatL1(''); setNewCatL2(''); setNewCatL3('');
      setTimeout(() => setAddSuccess(''), 5000);
    }
  };

  const handleBannerSave = (e) => {
    e.preventDefault();
    updateBanner(bannerForm);
    alert('Portada actualizada en vivo');
  };

  const handleSeoSave = (e) => {
    e.preventDefault();
    updateSeo(seoForm);
    alert('Configuración SEO/SEM guardada');
  };

  const totalValue = products.reduce((acc, curr) => acc + (curr.price * curr.stock), 0);
  const totalSales = realOrders.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Lógica para Generar Gráfico Real Basado en Ventas
  const getChartData = () => {
    // 1. Obtener los últimos 7 días
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      last7Days.push({ 
        date: dateStr, 
        name: days[d.getDay()], 
        ventas: 0 
      });
    }

    // 2. Sumar ventas reales por día
    realOrders.forEach(order => {
      const orderDate = order.date?.split(' ')[0]; // Extraer YYYY-MM-DD
      const dayData = last7Days.find(d => d.date === orderDate);
      if (dayData && order.status === 'Pagado') {
        dayData.ventas += order.amount || 0;
      }
    });

    return last7Days;
  };

  const dynamicChartData = getChartData();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <div className="admin-sidebar">
        <h2 className="admin-logo">VoltaAdmin</h2>
        <nav className="admin-nav">
          <a onClick={()=>setActiveTab('resumen')} className={activeTab==='resumen'?'active':''}><TrendingUp size={20}/> Resumen</a>
          <a onClick={()=>setActiveTab('productos')} className={activeTab==='productos'?'active':''}><Package size={20}/> Inventario</a>
          <a onClick={()=>setActiveTab('ventas')} className={activeTab==='ventas'?'active':''}><ShoppingBag size={20}/> Ventas ({realOrders.length})</a>
          <a onClick={()=>setActiveTab('apariencia')} className={activeTab==='apariencia'?'active':''}><LayoutTemplate size={20}/> Apariencia</a>
          <a onClick={()=>setActiveTab('seo')} className={activeTab==='seo'?'active':''}><Search size={20}/> SEO / SEM</a>
          <a onClick={()=>setActiveTab('saas')} className={activeTab==='saas'?'active':''}><Rocket size={20}/> Config & Redes</a>
          <a onClick={()=>{setActiveTab('pagos');const t=localStorage.getItem('admin_token');fetch('/api/config/payment',{headers:{Authorization:'Bearer '+t}}).then(r=>r.json()).then(d=>setPayConfig({mp_access_token:d.mp_access_token||'',transfer_enabled:d.transfer_enabled||false,bank_name:d.bank_name||'',bank_account_type:d.bank_account_type||'',bank_account_number:d.bank_account_number||'',bank_holder_name:d.bank_holder_name||'',bank_holder_rut:d.bank_holder_rut||'',bank_email:d.bank_email||'',transfer_instructions:d.transfer_instructions||''})).catch(()=>{});}} className={activeTab==='pagos'?'active':''}><CreditCard size={20}/> Pagos</a>
          <div style={{marginTop: 'auto', paddingTop: '2rem'}}>
            <a onClick={handleLogout} style={{color: '#ff5a5f'}}><Lock size={20}/> Cerrar Sesión</a>
          </div>
        </nav>
      </div>

      {/* CONTENT */}
      <div className="admin-content">
        
        {/* === TAB RESUMEN === */}
        {activeTab === 'resumen' && (
          <div className="tab-pane">
            <header className="admin-header"><h1>Dashboard General</h1></header>
            <div className="admin-stats">
              <div className="stat-card"><h3>Ingresos Totales</h3><p className="text-accent">${totalSales.toLocaleString()}</p></div>
              <div className="stat-card"><h3>Ventas Realizadas</h3><p>{realOrders.length}</p></div>
              <div className="stat-card"><h3>Pendientes de Despacho</h3><p style={{color:'#ffc107'}}>{realOrders.filter(o => o.status === 'Pendiente').length}</p></div>
              <div className="stat-card"><h3>Valor del Inventario</h3><p>${totalValue.toLocaleString()}</p></div>
            </div>
            
            <div className="chart-container">
              <h3>Ingresos de esta semana (Ventas Reales)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dynamicChartData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                  <XAxis dataKey="name" stroke="#a0aec0" />
                  <YAxis stroke="#a0aec0" tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip contentStyle={{backgroundColor: '#1a1c23', border: '1px solid #2d3748'}} formatter={(value) => `$${value.toLocaleString()}`} />
                  <Line type="monotone" dataKey="ventas" stroke="var(--accent)" strokeWidth={3} dot={{r: 4, fill: "var(--accent)"}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* === TAB PRODUCTOS === */}
        {activeTab === 'productos' && (
          <div className="tab-pane">
            <header className="admin-header">
              <h1>Inventario</h1>
              <button className="btn-primary" onClick={() => setIsAdding(!isAdding)}>
                <Plus size={20} /> {isAdding ? 'Cancelar' : 'Nuevo Producto'}
              </button>
            </header>

            {isAdding && (
              <form className="admin-form" onSubmit={handleAddSubmit}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.5rem'}}>
                  <h3 style={{margin:0}}>Agregar Nuevo Producto</h3>
                  <button type="button" onClick={()=>{setIsAdding(false);setNewProduct({name:'',price:'',stock:'',category:'',image:'',images:[],description:'',freeShipping:false});setCatL1('');setCatL2('');setCatL3('');}} style={{background:'none',border:'1px solid #272a38',color:'#a0aec0',padding:'4px 12px',borderRadius:'6px',cursor:'pointer',fontSize:'0.82rem'}}>Cerrar</button>
                </div>
                <div className="form-grid">
                  <input type="text" placeholder="Nombre del Producto" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  <input type="number" placeholder="Precio ($)" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                  <div style={{display:'flex',flexDirection:'column',gap:'6px',gridColumn:'1/-1'}}>
                    <label style={{fontSize:'0.85rem',color:'#a0aec0'}}>Categoría (árbol)</label>
                    {(() => {
                      const tree = {};
                      products.forEach(p => {
                        const pts = (p.category||'').split('/').map(s=>s.trim()).filter(Boolean);
                        if(pts[0]){if(!tree[pts[0]])tree[pts[0]]={};if(pts[1]){if(!tree[pts[0]][pts[1]])tree[pts[0]][pts[1]]=new Set();if(pts[2])tree[pts[0]][pts[1]].add(pts[2]);}}
                      });
                      const eL1=catL1==='__new__'?newCatL1:catL1;
                      const eL2=catL2==='__new__'?newCatL2:catL2;
                      const eL3=catL3==='__new__'?newCatL3:catL3;
                      const path=[eL1,eL2,eL3].filter(Boolean).join(' / ');
                      if(newProduct.category!==path) setTimeout(()=>setNewProduct(p=>({...p,category:path})),0);
                      const sel={background:'#12141c',border:'1px solid #272a38',color:'white',padding:'0.5rem 0.7rem',borderRadius:'8px',fontSize:'0.88rem',flex:1,cursor:'pointer'};
                      const inp={background:'#12141c',border:'1px solid var(--accent)',color:'white',padding:'0.5rem 0.7rem',borderRadius:'8px',fontSize:'0.88rem',flex:1,outline:'none'};
                      return <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                        <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                          <select style={sel} value={catL1} onChange={e=>{setCatL1(e.target.value);setCatL2('');setCatL3('');setNewCatL1('');}}>
                            <option value="">-- Categoría principal --</option>
                            {Object.keys(tree).map(k=><option key={k} value={k}>{k}</option>)}
                            <option value="__new__">+ Nueva categoría</option>
                          </select>
                          {catL1==='__new__'&&<input style={inp} value={newCatL1} onChange={e=>setNewCatL1(e.target.value)} placeholder="Ej: Hogar"/>}
                        </div>
                        {eL1&&<div style={{display:'flex',gap:'6px',alignItems:'center',paddingLeft:'14px'}}>
                          <span style={{color:'#444',fontSize:'0.8rem'}}>▶</span>
                          <select style={sel} value={catL2} onChange={e=>{setCatL2(e.target.value);setCatL3('');setNewCatL2('');}}>
                            <option value="">-- Subcategoría (opcional) --</option>
                            {tree[eL1]?Object.keys(tree[eL1]).map(k=><option key={k} value={k}>{k}</option>):null}
                            <option value="__new__">+ Nueva</option>
                          </select>
                          {catL2==='__new__'&&<input style={inp} value={newCatL2} onChange={e=>setNewCatL2(e.target.value)} placeholder="Ej: Cortinas"/>}
                        </div>}
                        {eL1&&eL2&&<div style={{display:'flex',gap:'6px',alignItems:'center',paddingLeft:'28px'}}>
                          <span style={{color:'#444',fontSize:'0.8rem'}}>▶</span>
                          <select style={sel} value={catL3} onChange={e=>{setCatL3(e.target.value);setNewCatL3('');}}>
                            <option value="">-- Sub-subcategoría (opcional) --</option>
                            {tree[eL1]?.[eL2]?[...tree[eL1][eL2]].map(k=><option key={k} value={k}>{k}</option>):null}
                            <option value="__new__">+ Nueva</option>
                          </select>
                          {catL3==='__new__'&&<input style={inp} value={newCatL3} onChange={e=>setNewCatL3(e.target.value)} placeholder="Ej: Roller Blackout"/>}
                        </div>}
                        {path&&<p style={{fontSize:'0.82rem',color:'var(--accent)',margin:'3px 0 0',padding:'4px 10px',background:'rgba(247,201,72,0.07)',borderRadius:'6px'}}>📂 {path}</p>}
                      </div>;
                    })()}
                  </div>
                  <input type="number" placeholder="Stock Inicial" required value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                  
                  <div className="full-width" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <label style={{fontSize: '0.9rem', color: '#a0aec0'}}>Descripción Detallada</label>
                      <button 
                        type="button"
                        className="btn-ai-magic"
                        onClick={handleAiOptimize}
                        disabled={!newProduct.name || !newProduct.category || uploadingFile}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontWeight: '600',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      >
                        ✨ Optimizar con ConectaAI
                      </button>
                    </div>
                    <textarea 
                      className="full-width" 
                      rows="6" 
                      placeholder="Escribe una idea técnica básica..." 
                      value={newProduct.description} 
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})} 
                      style={{background:'#12141c', border:'1px solid #272a38', color:'white', padding:'0.75rem 1rem', borderRadius:'var(--radius-sm)', fontFamily:'inherit', fontSize:'0.95rem', resize:'vertical'}} 
                    />
                  </div>
                  
                  <div className="full-width" style={{display:'flex',flexDirection:'column',gap:'0.7rem'}}>
                    <label style={{fontSize:'0.9rem',color:'#a0aec0'}}>Fotos y Videos</label>
                    <div style={{border:'2px dashed #272a38',borderRadius:'12px',padding:'1.2rem',textAlign:'center',cursor:'pointer',position:'relative',background:'#0d0f18'}}>
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" multiple onChange={handleFileUpload} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',opacity:0,cursor:'pointer'}}/>
                      {uploadingFile?<p style={{color:'var(--accent)',margin:0}}>Subiendo...</p>:<div><p style={{color:'#8f9ba8',marginBottom:'0.3rem',fontSize:'0.9rem'}}>Arrastra o clic para subir (selección múltiple)</p><p style={{color:'#555',fontSize:'0.78rem',margin:0}}>JPG PNG WEBP GIF MP4 WEBM</p></div>}
                    </div>
                    {newProduct.images.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}}>
                      {newProduct.images.map((media,idx)=>(
                        <div key={idx} style={{position:'relative',borderRadius:'8px',overflow:'hidden',border:idx===0?'2px solid var(--accent)':'1px solid #272a38'}}>
                          {idx===0&&<span style={{position:'absolute',top:2,left:2,background:'var(--accent)',color:'#000',fontSize:'9px',fontWeight:700,padding:'1px 4px',borderRadius:'4px',zIndex:1}}>PORTADA</span>}
                          {media.type==='video'?<video src={media.url} style={{width:80,height:80,objectFit:'cover',display:'block'}} muted/>:<img src={media.url} alt="" style={{width:80,height:80,objectFit:'cover',display:'block'}}/>}
                          <button type="button" onClick={()=>removeMedia(idx)} style={{position:'absolute',top:2,right:2,background:'rgba(0,0,0,0.75)',border:'none',borderRadius:'50%',width:18,height:18,cursor:'pointer',color:'#fff',fontSize:'11px',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>&times;</button>
                        </div>
                      ))}
                      <label style={{width:80,height:80,border:'1px dashed #272a38',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#555',fontSize:'24px',position:'relative',flexShrink:0}}>
                        +<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" multiple onChange={handleFileUpload} style={{position:'absolute',opacity:0,width:'100%',height:'100%',cursor:'pointer',top:0,left:0}}/>
                      </label>
                    </div>}
                    <input type="text" placeholder="...o pega una URL de imagen externa" style={{background:'#12141c',border:'1px solid #272a38',color:'white',padding:'0.6rem 1rem',borderRadius:'8px',fontSize:'0.88rem',width:'100%',boxSizing:'border-box'}} value={newProduct.image} onChange={e=>{const u=e.target.value;setNewProduct(prev=>({...prev,image:u,images:u?[{url:u,type:'image'}]:prev.images}));}}/>
                  </div>
                  
                  <label className="checkbox-label full-width">
                    <input type="checkbox" checked={newProduct.freeShipping} onChange={e => setNewProduct({...newProduct, freeShipping: e.target.checked})} /> Ofrecer Envío Gratis
                  </label>
                </div>
                {addSuccess&&<p style={{color:'#48bb78',background:'rgba(72,187,120,0.1)',border:'1px solid rgba(72,187,120,0.3)',borderRadius:'8px',padding:'0.7rem 1rem',fontSize:'0.88rem',margin:'0'}}>{addSuccess}</p>}
                <button type="submit" className="btn-primary" disabled={!newProduct.image&&newProduct.images.length===0}>Publicar Producto</button>
              </form>
            )}

            <div className="admin-table-container">
              <table className="admin-table">
                <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td className="product-cell">
                        {(product.image?.endsWith('.mp4') || product.image?.endsWith('.webm') || product.image?.endsWith('.mov')) ? (
                          <div style={{width:'40px', height:'40px', background:'#000', borderRadius:'4px', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <video src={product.image} style={{width:'100%', height:'100%', objectFit:'cover'}} muted />
                          </div>
                        ) : (
                          <img src={product.image} alt="IMG"/>
                        )}
                        <span>{product.name}</span>
                      </td>
                      <td>{product.category}</td>
                      <td>${product.price.toLocaleString()}</td>
                      <td><span className={`stock-badge ${product.stock < 10 ? 'low-stock' : ''}`}>{product.stock}</span></td>
                      <td><button className="icon-btn delete" onClick={() => removeProduct(product.id)}>Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === TAB VENTAS === */}
        {activeTab === 'ventas' && (
          <div className="tab-pane">
            <header className="admin-header"><h1>📋 Ventas Registradas</h1></header>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead><tr><th>ID Pedido</th><th>Fecha</th><th>Cliente (DNI)</th><th>Contacto</th><th>Monto</th><th>Estado</th><th>Logística</th><th>Acción</th></tr></thead>
                <tbody>
                  {realOrders.map(ord => (
                    <tr key={ord.id}>
                      <td style={{fontWeight: 'bold', color: 'var(--accent)'}}>{ord.id}</td>
                      <td>{ord.date}</td>
                      <td>{ord.customer} <br/><span style={{fontSize:'0.8rem', color:'#a0aec0'}}>{ord.document}</span></td>
                      <td style={{fontSize:'0.82rem'}}>
                        {ord.email}<br/>
                        <span style={{color:'#a0aec0'}}>{ord.phone}</span>
                      </td>
                      <td>${ord.amount?.toLocaleString()}</td>
                      <td>
                        <span className={`stock-badge ${ord.status === 'Enviado' ? 'shipped' : ord.status === 'Pendiente' ? 'pending' : ''}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td style={{fontSize:'0.85rem', color:'#a0aec0'}}>
                        {ord.courier ? (
                          <>{ord.courier}<br/><span style={{color:'var(--accent)', fontSize:'0.78rem'}}>{ord.tracking_number}</span></>
                        ) : '—'}
                      </td>
                      <td style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                        {ord.status === 'Pagado' && (
                          <button className="btn-primary" style={{fontSize: '0.8rem', padding: '0.4rem 0.8rem'}} onClick={() => {
                            setShipOrderId(ord.id);
                            setShipModal(true);
                          }}>🚚 Despachar</button>
                        )}
                        {ord.status === 'Enviado' && (
                          <span style={{color: '#48bb78', fontWeight: 600, fontSize: '0.85rem'}}>✓ Despachado</span>
                        )}
                        {(ord.status === 'Pendiente' || ord.status === 'Pagado') && (
                          <button
                            style={{fontSize:'0.78rem', padding:'0.35rem 0.7rem', background:'transparent', border:'1px solid #e53e3e', color:'#e53e3e', borderRadius:6, cursor:'pointer'}}
                            onClick={async () => {
                              if (!window.confirm(`¿Cancelar orden ${ord.id}?`)) return;
                              const t = localStorage.getItem('admin_token');
                              await fetch(`/api/orders/${ord.id}/cancel`, { method:'PUT', headers:{Authorization:`Bearer ${t}`} });
                              window.location.reload();
                            }}
                          >✕ Cancelar</button>
                        )}
                        {ord.status === 'Cancelado' && (
                          <span style={{color:'#e53e3e', fontWeight:600, fontSize:'0.85rem'}}>Cancelado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MODAL DE DESPACHO */}
            {shipModal && (
              <div className="ship-modal-overlay" onClick={() => setShipModal(false)}>
                <div className="ship-modal" onClick={(e) => e.stopPropagation()}>
                  <h3>🚚 Registrar Despacho — {shipOrderId}</h3>
                  <p style={{color: '#a0aec0', marginBottom: '1.5rem'}}>Ingresa los datos de la boleta de envío para notificar al cliente automáticamente.</p>
                  
                  <div className="form-group-admin">
                    <label>Empresa de Courier</label>
                    <select value={shipCourier} onChange={e => setShipCourier(e.target.value)} style={{width:'100%', padding:'0.8rem', borderRadius:'8px', background:'#1a1c23', color:'white', border:'1px solid #2d3748', fontSize:'1rem'}}>
                      <option value="">— Seleccionar —</option>
                      <option value="Chilexpress">Chilexpress</option>
                      <option value="Starken">Starken</option>
                      <option value="Correos de Chile">Correos de Chile</option>
                      <option value="Bluexpress">Bluexpress</option>
                    </select>
                  </div>

                  <div className="form-group-admin" style={{marginTop: '1rem'}}>
                    <label>N° de Seguimiento / Boleta</label>
                    <input 
                      type="text" 
                      placeholder="Ej: 99887766554"
                      value={shipTracking}
                      onChange={e => setShipTracking(e.target.value)}
                      style={{width:'100%', padding:'0.8rem', borderRadius:'8px', background:'#1a1c23', color:'white', border:'1px solid #2d3748', fontSize:'1rem'}}
                    />
                  </div>

                  <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                    <button 
                      className="btn-primary" 
                      style={{flex: 1}} 
                      disabled={!shipCourier || !shipTracking || shipLoading}
                      onClick={handleShipOrder}
                    >
                      {shipLoading ? 'Enviando Aviso...' : 'Confirmar Despacho y Notificar'}
                    </button>
                    <button style={{flex: 0.4, background: '#2d3748', color:'white', borderRadius:'8px', border:'none', cursor:'pointer'}} onClick={() => setShipModal(false)}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === TAB APARIENCIA === */}
        {activeTab === 'apariencia' && (
          <div className="tab-pane">
            <header className="admin-header"><h1>Personalizar Portada (Hero)</h1></header>
            <form className="admin-form full-form" onSubmit={handleBannerSave}>
              <div className="form-group-admin">
                <label>Título Principal</label>
                <input type="text" value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} />
              </div>
              <div className="form-group-admin">
                <label>Subtítulo Promocional</label>
                <textarea rows="2" value={bannerForm.subtitle} onChange={e => setBannerForm({...bannerForm, subtitle: e.target.value})} />
              </div>
              <div className="form-row-admin">
                <div className="form-group-admin">
                  <label>Etiqueta / Badge (ej. OFERTA)</label>
                  <input type="text" value={bannerForm.badge} onChange={e => setBannerForm({...bannerForm, badge: e.target.value})} />
                </div>
                <div className="form-group-admin">
                  <label>Texto del Botón</label>
                  <input type="text" value={bannerForm.buttonText} onChange={e => setBannerForm({...bannerForm, buttonText: e.target.value})} />
                </div>
              </div>
              <div className="form-row-admin">
                <div className="form-group-admin">
                  <label>Color Fondo (Inicio Gradiente)</label>
                  <input type="color" value={bannerForm.gradientStart} onChange={e => setBannerForm({...bannerForm, gradientStart: e.target.value})} />
                </div>
                <div className="form-group-admin">
                  <label>Color Fondo (Fin Gradiente)</label>
                  <input type="color" value={bannerForm.gradientEnd} onChange={e => setBannerForm({...bannerForm, gradientEnd: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn-primary">Aplicar Cambios a la Tienda</button>
            </form>
          </div>
        )}

        {/* === TAB SEO / SEM === */}
        {activeTab === 'seo' && (
          <div className="tab-pane">
            <header className="admin-header"><h1>Optimización SEO y Campañas</h1></header>
            
            <form className="admin-form full-form" onSubmit={handleSeoSave}>
              <h3 style={{color:'white', marginBottom:'1rem'}}>Metadatos de la Tienda</h3>
              <div className="form-group-admin">
                <label>Meta Title (Aparece en pestaña del navegador)</label>
                <input type="text" value={seoForm.metaTitle} onChange={e => setSeoForm({...seoForm, metaTitle: e.target.value})} />
              </div>
              <div className="form-group-admin">
                <label>Meta Descripción</label>
                <textarea rows="3" value={seoForm.metaDescription} onChange={e => setSeoForm({...seoForm, metaDescription: e.target.value})} />
              </div>
              <div className="form-group-admin">
                <label>Palabras Clave (Keywords separadas por coma)</label>
                <input type="text" value={seoForm.keywords} onChange={e => setSeoForm({...seoForm, keywords: e.target.value})} />
              </div>
              
              <hr style={{borderColor:'#2d3748', margin:'2rem 0'}} />
              
              <h3 style={{color:'white', marginBottom:'1rem'}}>Google Ads SEM (Demo)</h3>
              <div className="form-row-admin">
                <div className="form-group-admin">
                  <label>Presupuesto Diario Google Ads ($)</label>
                  <input type="number" value={seoForm.semBudget} onChange={e => setSeoForm({...seoForm, semBudget: e.target.value})} />
                </div>
                <div className="form-group-admin">
                  <label className="checkbox-label" style={{marginTop:'2rem'}}>
                    <input type="checkbox" checked={seoForm.semActive} onChange={e => setSeoForm({...seoForm, semActive: e.target.checked})} /> Habilitar Campaña PPC Activa
                  </label>
                </div>
              </div>
              
              <button type="submit" className="btn-primary" style={{marginTop:'1.5rem'}}>Guardar Configuración de Marketing</button>
            </form>
          </div>
        )}

        {/* === TAB SAAS === */}
        {activeTab === 'pagos' && (
          <div className="tab-pane">
            <header className="admin-header"><h1>Configuracion de Pagos</h1></header>
            <p style={{color:'#a0aec0',marginBottom:'2rem'}}>Activa Mercado Pago y/o transferencia bancaria. Los clientes podran elegir al momento de pagar.</p>
            {payConfigMsg&&<p style={{color:'#48bb78',background:'rgba(72,187,120,0.1)',border:'1px solid rgba(72,187,120,0.3)',borderRadius:'8px',padding:'0.8rem 1rem',marginBottom:'1rem'}}>{payConfigMsg}</p>}
            <form className="admin-form full-form" onSubmit={async(e)=>{
              e.preventDefault();
              const t=localStorage.getItem('admin_token');
              const res=await fetch('/api/config/payment',{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify(payConfig)});
              if(res.ok){setPayConfigMsg('Configuracion guardada');setTimeout(()=>setPayConfigMsg(''),4000);}
              else{alert('Error al guardar');}
            }}>
              <div style={{background:'#12141c',border:'1px solid #272a38',borderRadius:'12px',padding:'1.5rem',marginBottom:'1.5rem'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'1rem'}}>
                  <CreditCard size={22} color="#f7c948"/>
                  <h3 style={{margin:0,color:'white'}}>Mercado Pago</h3>
                  {payConfig.mp_access_token&&<span style={{background:'rgba(72,187,120,0.15)',color:'#48bb78',fontSize:'0.75rem',padding:'2px 10px',borderRadius:'20px',border:'1px solid rgba(72,187,120,0.3)'}}>Activo</span>}
                </div>
                <div className="form-group-admin">
                  <label>Access Token (APP_USR-...)</label>
                  <input type="password" placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={payConfig.mp_access_token} onChange={e=>setPayConfig({...payConfig,mp_access_token:e.target.value})} style={{fontFamily:'monospace'}}/>
                  <small style={{color:'#718096',fontSize:'0.78rem'}}>Obtenlo en mercadopago.com.cl/developers</small>
                </div>
              </div>
              <div style={{background:'#12141c',border:'1px solid #272a38',borderRadius:'12px',padding:'1.5rem'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'1rem'}}>
                  <Building2 size={22} color="#f7c948"/>
                  <h3 style={{margin:0,color:'white'}}>Transferencia Bancaria</h3>
                  <label style={{display:'flex',alignItems:'center',gap:'8px',marginLeft:'auto',cursor:'pointer'}}>
                    <input type="checkbox" checked={payConfig.transfer_enabled} onChange={e=>setPayConfig({...payConfig,transfer_enabled:e.target.checked})} style={{width:18,height:18,cursor:'pointer'}}/>
                    <span style={{color:'#a0aec0',fontSize:'0.88rem'}}>Habilitar</span>
                  </label>
                </div>
                {payConfig.transfer_enabled&&(
                  <div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                      <div className="form-group-admin">
                        <label>Banco</label>
                        <input type="text" placeholder="Ej: Banco de Chile" value={payConfig.bank_name} onChange={e=>setPayConfig({...payConfig,bank_name:e.target.value})}/>
                      </div>
                      <div className="form-group-admin">
                        <label>Tipo de Cuenta</label>
                        <input type="text" placeholder="Corriente / Vista / RUT" value={payConfig.bank_account_type} onChange={e=>setPayConfig({...payConfig,bank_account_type:e.target.value})}/>
                      </div>
                      <div className="form-group-admin">
                        <label>Numero de Cuenta</label>
                        <input type="text" placeholder="0001234567" value={payConfig.bank_account_number} onChange={e=>setPayConfig({...payConfig,bank_account_number:e.target.value})}/>
                      </div>
                      <div className="form-group-admin">
                        <label>Titular</label>
                        <input type="text" placeholder="Nombre completo" value={payConfig.bank_holder_name} onChange={e=>setPayConfig({...payConfig,bank_holder_name:e.target.value})}/>
                      </div>
                      <div className="form-group-admin">
                        <label>RUT del Titular</label>
                        <input type="text" placeholder="12.345.678-9" value={payConfig.bank_holder_rut} onChange={e=>setPayConfig({...payConfig,bank_holder_rut:e.target.value})}/>
                      </div>
                      <div className="form-group-admin">
                        <label>Email de Confirmacion</label>
                        <input type="email" placeholder="pagos@tutienda.cl" value={payConfig.bank_email} onChange={e=>setPayConfig({...payConfig,bank_email:e.target.value})}/>
                      </div>
                    </div>
                    <div className="form-group-admin" style={{marginTop:'1rem'}}>
                      <label>Instrucciones adicionales (opcional)</label>
                      <textarea rows="2" placeholder="Ej: Incluir el numero de pedido en la descripcion de la transferencia." value={payConfig.transfer_instructions} onChange={e=>setPayConfig({...payConfig,transfer_instructions:e.target.value})}/>
                    </div>
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary" style={{marginTop:'2rem'}}>Guardar Configuracion de Pagos</button>
            </form>
          </div>
        )}

        {activeTab === 'saas' && saasConfig && (
          <div className="tab-pane">
            <header className="admin-header"><h1>Configuración de la Tienda</h1></header>
            <p style={{color: '#a0aec0', marginBottom: '2rem'}}>Nombre, logo, colores, redes sociales y textos de la landing de venta.</p>
            
            <form className="admin-form full-form" onSubmit={async (e) => {
                e.preventDefault();
                const token = localStorage.getItem('admin_token');
                const res = await fetch('/api/landing', {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(saasConfig)
                });
                if(res.ok) alert('✅ Landing SaaS actualizada con éxito');
            }}>
              <div className="form-group-admin">
                <label>Título Hero</label>
                <input type="text" value={saasConfig.hero_title} onChange={e => setSaasConfig({...saasConfig, hero_title: e.target.value})} />
              </div>
              <div className="form-group-admin">
                <label>Subtítulo Hero</label>
                <textarea rows="2" value={saasConfig.hero_subtitle} onChange={e => setSaasConfig({...saasConfig, hero_subtitle: e.target.value})} />
              </div>
              
              <div className="form-row-admin">
                <div className="form-group-admin">
                  <label>Feature 1 Título</label>
                  <input type="text" value={saasConfig.feature_1_title} onChange={e => setSaasConfig({...saasConfig, feature_1_title: e.target.value})} />
                </div>
                <div className="form-group-admin">
                  <label>Feature 1 Descripción</label>
                  <input type="text" value={saasConfig.feature_1_desc} onChange={e => setSaasConfig({...saasConfig, feature_1_desc: e.target.value})} />
                </div>
              </div>

              <div className="form-row-admin">
                <div className="form-group-admin">
                  <label>Precio Starter ($)</label>
                  <input type="number" value={saasConfig.price_starter} onChange={e => setSaasConfig({...saasConfig, price_starter: parseFloat(e.target.value)})} />
                </div>
                <div className="form-group-admin">
                  <label>Precio Pro ($)</label>
                  <input type="number" value={saasConfig.price_pro} onChange={e => setSaasConfig({...saasConfig, price_pro: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="form-group-admin">
                <label>Texto Botón CTA</label>
                <input type="text" value={saasConfig.cta_text} onChange={e => setSaasConfig({...saasConfig, cta_text: e.target.value})} />
              </div>

              {/* --- WHITE LABEL IDENTITY --- */}
              <div className="admin-section-divider"></div>
              <h2 style={{marginTop: '1.5rem', marginBottom: '1rem'}}>Identidad de Marca (White Label)</h2>
              
              <div className="form-row-admin">
                <div className="form-group-admin">
                  <label>Nombre de la Tienda</label>
                  <input type="text" value={saasConfig.store_name} onChange={e => setSaasConfig({...saasConfig, store_name: e.target.value})} />
                </div>
                <div className="form-group-admin">
                  <label>URL del Logo (Img)</label>
                  <input type="text" value={saasConfig.store_logo} onChange={e => setSaasConfig({...saasConfig, store_logo: e.target.value})} />
                </div>
              </div>

              <div className="form-group-admin">
                <label>Elegir Skin / Diseño (Tema Activo)</label>
                <div className="theme-selector-grid">
                  {[
                    { id: 1, name: 'VoltaClassic', desc: 'Estilo Mercado Libre', color: '#fff159' },
                    { id: 2, name: 'Minimal Dark', desc: 'Lujo y Elegancia', color: '#1a1a1a' },
                    { id: 3, name: 'Boutique', desc: 'Suave y Chic', color: '#f8edeb' },
                    { id: 4, name: 'CyberTech', desc: 'Gaming & Neon', color: '#7000ff' },
                    { id: 5, name: 'Glassmorphism', desc: 'Moderno y Pro', color: '#6366f1' },
                  ].map(t => (
                    <div 
                      key={t.id} 
                      className={`theme-option ${saasConfig.active_theme === t.id ? 'active' : ''}`}
                      onClick={() => setSaasConfig({...saasConfig, active_theme: t.id})}
                      style={{ borderLeft: `5px solid ${t.color}` }}
                    >
                      <strong>{t.name}</strong>
                      <span>{t.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* --- CONTACTO & REDES SOCIALES --- */}
              <div className="admin-section-divider"></div>
              <h2 style={{marginTop: '1.5rem', marginBottom: '1rem'}}>📱 Contacto & Redes Sociales</h2>

              <div className="form-row-admin">
                <div className="form-group-admin">
                  <label>Número WhatsApp (con código país, sin +)</label>
                  <input type="text" placeholder="56912345678" value={saasConfig.whatsapp_number || ''} onChange={e => setSaasConfig({...saasConfig, whatsapp_number: e.target.value})} />
                </div>
                <div className="form-group-admin">
                  <label>Color Acento (#hex)</label>
                  <div style={{display:'flex', gap:8, alignItems:'center'}}>
                    <input type="color" value={saasConfig.accent_color || '#f7c948'} onChange={e => setSaasConfig({...saasConfig, accent_color: e.target.value})} style={{width:48, height:38, padding:2, border:'1px solid #2d3748', borderRadius:6, background:'#1a1c23', cursor:'pointer'}} />
                    <input type="text" value={saasConfig.accent_color || '#f7c948'} onChange={e => setSaasConfig({...saasConfig, accent_color: e.target.value})} style={{flex:1}} />
                  </div>
                </div>
              </div>

              <div className="form-row-admin">
                <div className="form-group-admin">
                  <label>Instagram URL</label>
                  <input type="text" placeholder="https://instagram.com/tutienda" value={saasConfig.instagram_url || ''} onChange={e => setSaasConfig({...saasConfig, instagram_url: e.target.value})} />
                </div>
                <div className="form-group-admin">
                  <label>Facebook URL</label>
                  <input type="text" placeholder="https://facebook.com/tutienda" value={saasConfig.facebook_url || ''} onChange={e => setSaasConfig({...saasConfig, facebook_url: e.target.value})} />
                </div>
              </div>

              <div className="form-group-admin">
                <label>TikTok URL</label>
                <input type="text" placeholder="https://tiktok.com/@tutienda" value={saasConfig.tiktok_url || ''} onChange={e => setSaasConfig({...saasConfig, tiktok_url: e.target.value})} />
              </div>

              <button type="submit" className="btn-primary" style={{marginTop: '2rem'}}>Guardar Configuración</button>
              <button type="button" className="btn-secondary" style={{marginLeft: '1rem'}} onClick={() => window.open('/saas', '_blank')}>Ver Landing en Vivo</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
