import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useShop } from '../context/CartContext';
import './Footer.css';

const Footer = () => {
  const { saasConfig } = useShop();
  // Simulador de "visitas reales" que fluctúa
  const [visitors, setVisitors] = useState(42);

  useEffect(() => {
    const interval = setInterval(() => {
      // Sube o baja entre 1 y 3 visitantes reales que entran o salen de la web
      const change = Math.floor(Math.random() * 5) - 2;
      setVisitors(prev => {
        let n = prev + change;
        if(n < 15) n = 15; // Mínimo de gente "siempre" online para FOMO
        if(n > 85) n = 80;
        return n;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="footer-container">
      <div className="container footer-grid">
        <div className="footer-col">
          <h3 className="footer-title">Acerca de nosotros</h3>
          <p>{saasConfig.store_name} es tu tienda en línea de confianza. Ofrecemos la mejor tecnología al mejor precio, directamente hasta la puerta de tu casa.</p>
          <div className="trust-badges mt-2">
            <ShieldCheck size={28} color="#00a650" />
            <span style={{fontSize: '0.9rem', color: '#666', fontWeight: 500}}>100% Compra Protegida</span>
          </div>
        </div>
        
        <div className="footer-col">
          <h3 className="footer-title">Enlaces Útiles</h3>
          <ul>
            <li><a href="#">Términos y Condiciones</a></li>
            <li><a href="#">Política de Privacidad</a></li>
            <li><a href="#">Cómo cuidamos tu privacidad</a></li>
            <li><a href="#">Defensa del Consumidor</a></li>
            <li><a href="#">Ayuda y Sugerencias</a></li>
          </ul>
        </div>
        
        <div className="footer-col">
          <h3 className="footer-title">Medios de Pago</h3>
          <div className="payment-logos">
            <img src="https://logospng.org/download/mercado-pago/logo-mercado-pago-icon-1024.png" alt="Mercado Pago" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg" alt="MasterCard" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%(2018%).svg" alt="Amex" />
          </div>
        </div>

        <div className="footer-col" style={{textAlign: 'right'}}>
          <h3 className="footer-title">Síguenos en Redes</h3>
          <div className="social-icons" style={{gap: '1.5rem', marginTop: '1rem', fontWeight: 'bold'}}>
            <a href="#" className="social-link" style={{background: 'none', width: 'auto'}}>Instagram</a>
            <a href="#" className="social-link" style={{background: 'none', width: 'auto'}}>Facebook</a>
            <a href="#" className="social-link" style={{background: 'none', width: 'auto'}}>Twitter (X)</a>
          </div>
          
          <div className="live-counter">
            <span className="live-dot"></span>
            <strong>{visitors}</strong> usuarios están navegando ahora.
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>Copyright © {new Date().getFullYear()} {saasConfig.store_name} S.R.L. Av. Siempre Viva 123, Santiago.</p>
      </div>
    </footer>
  );
};

export default Footer;
