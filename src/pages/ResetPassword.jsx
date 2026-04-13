import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import './AdminLogin.css';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [token, setToken] = useState('');
    const [status, setStatus] = useState({ type: '', msg: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const t = params.get('token');
        if (!t) {
            setStatus({ type: 'error', msg: 'Enlace inválido o incompleto.' });
        } else {
            setToken(t);
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setStatus({ type: 'error', msg: 'Las contraseñas no coinciden.' });
            return;
        }
        if (password.length < 8) {
            setStatus({ type: 'error', msg: 'La contraseña debe tener al menos 8 caracteres.' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', msg: '' });

        try {
            const resp = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, new_password: password })
            });
            const data = await resp.json();
            if (resp.ok) {
                setStatus({ type: 'success', msg: data.message });
                setTimeout(() => navigate('/admin'), 3000);
            } else {
                setStatus({ type: 'error', msg: data.detail || 'Error al restablecer.' });
            }
        } catch (err) {
            setStatus({ type: 'error', msg: 'Error de conexión.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="login-card">
                <div className="login-header" style={{textAlign: 'center', marginBottom: '2rem'}}>
                    <div className="login-icon" style={{margin: '0 auto 1rem', background: 'var(--success-bg)'}}>
                        <Lock size={32} color="#1e7e34" />
                    </div>
                    <h2>Nueva Contraseña</h2>
                    <p style={{color: '#666', fontSize: '0.9rem'}}>Elige una clave segura para tu cuenta.</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Contraseña Nueva</label>
                        <div style={{position: 'relative'}}>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="8+ caracteres" 
                                required 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#666'}}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirmar Contraseña</label>
                        <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repite la clave" 
                            required 
                        />
                    </div>

                    {status.msg && (
                        <div className={`status-alert ${status.type}`} style={{
                            padding: '1rem', 
                            borderRadius: '8px', 
                            marginBottom: '1rem',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: status.type === 'success' ? '#e6f4ea' : '#fce8e6',
                            color: status.type === 'success' ? '#1e7e34' : '#c5221f'
                        }}>
                             {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                             {status.msg}
                        </div>
                    )}

                    <button type="submit" className="login-btn" disabled={loading || !token}>
                        {loading ? "Actualizando..." : "Actualizar Contraseña"}
                    </button>
                </form>

                <div className="login-footer" style={{textAlign: 'center', marginTop: '1.5rem'}}>
                    <Link to="/admin" style={{fontSize: '0.9rem', color: 'var(--accent)'}}>Volver al Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
