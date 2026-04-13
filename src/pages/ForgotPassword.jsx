import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import './AdminLogin.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', msg: '' });

        try {
            const resp = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await resp.json();
            setStatus({ type: 'success', msg: data.message });
        } catch (err) {
            setStatus({ type: 'error', msg: 'Error de conexión. Reintenta.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="login-card">
                <Link to="/admin" className="back-link">
                    <ArrowLeft size={16} /> Volver a Iniciar Sesión
                </Link>
                
                <div className="login-header" style={{textAlign: 'center', marginBottom: '2rem'}}>
                    <div className="login-icon" style={{margin: '0 auto 1rem'}}>
                        <Mail size={32} color="var(--accent)" />
                    </div>
                    <h2>Recuperar Contraseña</h2>
                    <p style={{color: '#666', fontSize: '0.9rem'}}>Ingresa tu correo y te enviaremos un enlace seguro.</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Tu Correo Electrónico</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ejemplo@conectaaai.cl" 
                            required 
                        />
                    </div>

                    {status.msg && (
                        <div className={`status-alert ${status.type}`} style={{
                            padding: '1rem', 
                            borderRadius: '8px', 
                            marginBottom: '1rem',
                            fontSize: '0.85rem',
                            background: status.type === 'success' ? '#e6f4ea' : '#fce8e6',
                            color: status.type === 'success' ? '#1e7e34' : '#c5221f'
                        }}>
                            {status.msg}
                        </div>
                    )}

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? "Enviando..." : (
                            <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                                <Send size={18} /> Enviar Enlace
                            </span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
