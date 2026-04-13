import React, { useState, useEffect } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import './LiveNotification.css';

const MOCK_NAMES = ["Carlos M.", "Valentina S.", "Diego P.", "Camila R.", "Sebastián V.", "Javiera T."];
const MOCK_LOCATIONS = ["Santiago", "Viña del Mar", "Concepción", "Valparaíso", "Antofagasta"];
const MOCK_PRODUCTS = ["iPhone 15 Pro", "Sony WH-1000XM5", "Nintendo Switch", "MacBook Pro M3", "Monitor LG UltraGear"];

const LiveNotification = () => {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // 🔗 Real-time WebSocket Connection
    const socket = new WebSocket('ws://localhost:8000/ws');
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'new_order' || data.event === 'new_order_created') {
          setNotification({
            name: data.customer,
            loc: "VoltaShop",
            prod: data.items ? data.items[0]?.name : "Nueva Venta",
            id: Date.now()
          });
          
          // Auto dismiss
          setTimeout(() => setNotification(null), 8000);
        }
      } catch (err) {
        console.error("WS Error:", err);
      }
    };

    // 🎭 FOMO Simulator (fallback/extra)
    const triggerFomo = () => {
      const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
      const loc = MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)];
      const prod = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
      setNotification({ name, loc, prod, id: Date.now() });
      setTimeout(() => setNotification(null), 5000);
    };

    const interval = setInterval(() => {
      triggerFomo();
    }, 45000); // Less frequent when live

    return () => {
      socket.close();
      clearInterval(interval);
    };
  }, []);

  if (!notification) return null;

  return (
    <div className="fomo-toast slide-in-left">
      <div className="fomo-icon">
        <ShoppingBag size={20} color="white" />
      </div>
      <div className="fomo-content">
        <p className="fomo-text">
          <strong>{notification.name}</strong> de {notification.loc} acaba de comprar
        </p>
        <p className="fomo-product">{notification.prod}</p>
        <span className="fomo-time">Hace unos instantes</span>
      </div>
      <button className="fomo-close" onClick={() => setNotification(null)}>
        <X size={14} />
      </button>
    </div>
  );
};

export default LiveNotification;
