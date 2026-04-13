import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ShieldAlert } from 'lucide-react';
import './AdminLogin.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Usamos format x-www-form-urlencoded que exige OAuth2PasswordRequestForm en FastAPI
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }

      const data = await response.json();
      localStorage.setItem('admin_token', data.access_token);
      onLoginSuccess();
    } catch (err) {
      setError('Acceso denegado. Verifique su usuario y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <Lock size={40} color="var(--accent)" />
          <h2>Acceso Restringido</h2>
          <p>Portal de Administración VoltaShop</p>
        </div>
        
        {error && (
          <div className="error-banner">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="form-group">
            <label>Administrador</label>
            <input 
              type="text" 
              required 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nombre de Usuario"
            />
          </div>
          <div className="form-group">
            <label>Contraseña Cifrada</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading} style={{width: '100%', marginTop: '1rem'}}>
            {loading ? 'Verificando Criptografía...' : 'Ingresar al Dashboard'}
          </button>

          <div style={{textAlign: 'center', marginTop: '1.5rem'}}>
            <Link to="/forgot-password" style={{color: 'var(--accent)', fontSize: '0.9rem'}}>¿Olvidaste tu contraseña?</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
