import React, { useState, useEffect } from 'react';
import { User, Package, Settings, LogOut, ChevronRight, Edit3, Save, X } from 'lucide-react';
import './UserProfile.css';

const UserProfile = () => {
  const [activeSection, setActiveSection] = useState('orders');
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', email: '', new_password: '' });
  const [saveMsg, setSaveMsg] = useState('');

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/users/me', { headers }).then(r => r.ok ? r.json() : null),
      fetch('/api/orders', { headers }).then(r => r.ok ? r.json() : []),
    ]).then(([user, ords]) => {
      setUserData(user);
      setOrders(Array.isArray(ords) ? ords : []);
      if (user) setEditForm({ username: user.username, email: user.email || '', new_password: '' });
    }).finally(() => setLoading(false));
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {};
    if (editForm.username !== userData.username) payload.username = editForm.username;
    if (editForm.email !== userData.email) payload.email = editForm.email;
    if (editForm.new_password) payload.new_password = editForm.new_password;
    if (Object.keys(payload).length === 0) { setEditing(false); return; }

    const res = await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setUserData(prev => ({ ...prev, username: data.username, email: data.email }));
      setSaveMsg('Cambios guardados');
      setEditing(false);
      setTimeout(() => setSaveMsg(''), 3000);
    } else {
      const err = await res.json();
      setSaveMsg(err.detail || 'Error al guardar');
    }
  };

  if (loading) {
    return (
      <div className="profile-container container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#666' }}>Cargando perfil...</p>
      </div>
    );
  }

  if (!token || !userData) {
    return (
      <div className="profile-container container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <User size={60} color="#ccc" />
          <h3 style={{ margin: '1rem 0 0.5rem' }}>Acceso restringido</h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>Debes iniciar sesión como administrador.</p>
          <a href="/admin" className="btn-primary" style={{ textDecoration: 'none', padding: '0.75rem 2rem' }}>Ir al panel</a>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container container">
      <aside className="profile-sidebar">
        <div className="user-info-card">
          <div className="user-avatar"><User size={40} /></div>
          <h3>{userData.username}</h3>
          <p>{userData.email || 'Sin email registrado'}</p>
          {userData.is_admin && (
            <span style={{ fontSize: '0.75rem', background: 'var(--accent)', color: '#000', padding: '2px 10px', borderRadius: '20px', fontWeight: 700 }}>Admin</span>
          )}
        </div>

        <nav className="profile-nav">
          <button className={`nav-item ${activeSection === 'orders' ? 'active' : ''}`} onClick={() => setActiveSection('orders')}>
            <Package size={20} /><span>Mis Compras ({orders.length})</span><ChevronRight size={16} />
          </button>
          <button className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`} onClick={() => setActiveSection('settings')}>
            <Settings size={20} /><span>Mis Datos</span><ChevronRight size={16} />
          </button>
          <hr />
          <button className="nav-item logout" onClick={handleLogout}>
            <LogOut size={20} /><span>Cerrar Sesión</span>
          </button>
        </nav>
      </aside>

      <main className="profile-content">
        {/* === MIS COMPRAS === */}
        {activeSection === 'orders' && (
          <>
            <header className="content-header">
              <h2>Mis Compras</h2>
              <p>Historial de pedidos registrados.</p>
            </header>
            <div className="orders-list">
              {orders.length === 0 ? (
                <div className="empty-orders">
                  <Package size={60} />
                  <h3>Aún no hay pedidos</h3>
                  <p>Los pedidos aparecerán aquí una vez que se realicen compras.</p>
                  <button className="btn-primary" onClick={() => window.location.href = '/'}>Ir a la Tienda</button>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-main">
                      <div className="order-icon"><Package size={24} /></div>
                      <div className="order-details">
                        <h4>Orden #{order.id}</h4>
                        <span>{order.date?.split(' ')[0]}</span>
                        {order.customer && <span style={{ color: '#888', fontSize: '0.85rem' }}> · {order.customer}</span>}
                      </div>
                      <div className="order-status">
                        <span className={`status-badge ${order.status?.toLowerCase()}`}>{order.status}</span>
                      </div>
                    </div>
                    <div className="order-footer">
                      <div className="order-amount">Total: <strong>${order.amount?.toLocaleString()}</strong></div>
                      {order.tracking_number && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
                          {order.courier}: {order.tracking_number}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* === MIS DATOS === */}
        {activeSection === 'settings' && (
          <>
            <header className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2>Mis Datos</h2>
                <p>Actualiza tu información de perfil.</p>
              </div>
              {!editing && (
                <button className="btn-outline" onClick={() => setEditing(true)} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Edit3 size={16} /> Editar
                </button>
              )}
            </header>

            {saveMsg && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1.5rem', background: saveMsg.includes('Error') ? '#fce8e6' : '#e6f4ea', color: saveMsg.includes('Error') ? '#c5221f' : '#1e7e34', fontSize: '0.9rem' }}>
                {saveMsg}
              </div>
            )}

            {editing ? (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 480 }}>
                <div className="form-group">
                  <label>Nombre de usuario</label>
                  <input type="text" value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Nueva contraseña <span style={{ color: '#aaa', fontSize: '0.8rem' }}>(dejar vacío para no cambiar)</span></label>
                  <input type="password" value={editForm.new_password} onChange={e => setEditForm({ ...editForm, new_password: e.target.value })} placeholder="••••••••" minLength={8} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn-primary" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Save size={16} /> Guardar</button>
                  <button type="button" className="btn-outline" onClick={() => setEditing(false)} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><X size={16} /> Cancelar</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 480 }}>
                {[
                  { label: 'Nombre de usuario', value: userData.username },
                  { label: 'Email', value: userData.email || '—' },
                  { label: 'Rol', value: userData.is_admin ? 'Administrador' : 'Cliente' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default UserProfile;
