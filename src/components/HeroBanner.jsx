import React from 'react';
import { useShop } from '../context/CartContext';
import './HeroBanner.css';

const HeroBanner = () => {
  const { bannerConfig } = useShop();

  return (
    <div className="hero-banner" style={{
      background: `linear-gradient(135deg, ${bannerConfig.gradientStart} 0%, ${bannerConfig.gradientEnd} 100%)`
    }}>
      <div className="hero-content container">
        {bannerConfig.badge && <span className="hero-badge">{bannerConfig.badge}</span>}
        <h1>{bannerConfig.title}</h1>
        <p>{bannerConfig.subtitle}</p>
        <button className="btn-primary" style={{marginTop: '1rem', background: '#3483fa', color: '#fff'}}>
          {bannerConfig.buttonText}
        </button>
      </div>
    </div>
  );
};

export default HeroBanner;
