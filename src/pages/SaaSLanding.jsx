import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Rocket, Zap, Smartphone, Cpu, ShieldCheck, PieChart, ArrowRight } from 'lucide-react';
import './SaaSLanding.css';

const SaaSLanding = () => {
    const [config, setConfig] = useState(null);

    useEffect(() => {
        fetch('/api/landing')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error("Error cargando landing:", err));
    }, []);

    if (!config) return <div className="loading-saas">Cargando VoltaShop SaaS...</div>;

    const features = [
        { icon: <Smartphone size={32} />, title: config.feature_1_title, desc: config.feature_1_desc },
        { icon: <Cpu size={32} />, title: config.feature_2_title, desc: config.feature_2_desc },
        { icon: <Zap size={32} />, title: config.feature_3_title, desc: config.feature_3_desc },
        { icon: <ShieldCheck size={32} />, title: "Seguridad Bancaria", desc: "Protocolos HTTPS y encriptación de claves RSA para máxima confianza." },
        { icon: <PieChart size={32} />, title: "Dashboard en Vivo", desc: "Métricas de ventas y stock actualizadas al segundo vía WebSockets." },
        { icon: <Rocket size={32} />, title: "SEO Ready", desc: "Optimización nativa para aparecer en los primeros lugares de Google Ads." },
    ];

    return (
        <div className="saas-landing">
            {/* HERO SECTION */}
            <section className="saas-hero">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="hero-content container"
                >
                    <span className="badge-modern">¡PROYECTO DISPONIBLE!</span>
                    <h1>{config.hero_title}</h1>
                    <p>{config.hero_subtitle}</p>
                    <div className="hero-btns">
                        <button className="btn-saas-primary">
                            {config.cta_text} <ArrowRight size={20} />
                        </button>
                        <button className="btn-saas-outline">Ver Demo en Vivo</button>
                    </div>
                </motion.div>
                
                <div className="hero-gradient"></div>
            </section>

            {/* MOCKUP SECTION (Dashboard Preview) */}
            <section className="saas-preview container">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="dashboard-mockup"
                >
                    <div className="mockup-header">
                        <div className="dots"><span></span><span></span><span></span></div>
                        <div className="url-bar">voltashop-admin.conectaai.cl</div>
                    </div>
                    <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200" alt="Dashboard Preview" />
                </motion.div>
            </section>

            {/* FEATURES */}
            <section className="saas-features container">
                <div className="section-title">
                    <h2>Potencia tu negocio con tecnología de punta</h2>
                    <p>Todo el ecosistema de VoltaShop ha sido diseñado para maximizar las ventas y automatizar procesos.</p>
                </div>
                
                <div className="features-grid">
                    {features.map((f, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="feature-card-premium"
                        >
                            <div className="feature-icon-wrapper">{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* PRICING */}
            <section className="saas-pricing container">
                <div className="section-title">
                    <h2>Elige tu plan estratégico</h2>
                    <p>Sin comisiones por venta. Un solo pago por licencia o suscripción mensual.</p>
                </div>

                <div className="pricing-grid">
                    <div className="pricing-card">
                        <h3>Starter</h3>
                        <div className="price">${config.price_starter}<span>/único</span></div>
                        <ul>
                            <li><Check size={18} /> Backend Completo FastAPI</li>
                            <li><Check size={18} /> Panel de Administración</li>
                            <li><Check size={18} /> 1 Dominio Incluido</li>
                            <li className="disabled"><Check size={18} /> IA Optimization</li>
                        </ul>
                        <button className="btn-saas-outline">Seleccionar</button>
                    </div>

                    <div className="pricing-card featured">
                        <div className="popular-badge">MÁS POPULAR</div>
                        <h3>Pro Enterprise</h3>
                        <div className="price">${config.price_pro}<span>/único</span></div>
                        <ul>
                            <li><Check size={18} /> Todo lo del plan Starter</li>
                            <li><Check size={18} /> ConectaAI Intelligence (IA)</li>
                            <li><Check size={18} /> Integración n8n Webhooks</li>
                            <li><Check size={18} /> Notificaciones WhatsApp</li>
                        </ul>
                        <button className="btn-saas-primary">Obtener Todo el Ecosistema</button>
                    </div>
                </div>
            </section>

            {/* FOOTER SAAS */}
            <footer className="saas-footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <Zap size={30} fill="var(--accent)" />
                            <span>VoltaShop SaaS</span>
                        </div>
                        <p>© 2026 ConectaAI Automation & VoltaShop Chile. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SaaSLanding;
