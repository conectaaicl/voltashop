import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useShop } from '../context/CartContext';
import './WhatsAppBtn.css';

const WhatsAppBtn = () => {
  const { saasConfig } = useShop();
  const whatsappNumber = saasConfig?.whatsapp_number || "56912345678";
  const storeName = saasConfig?.store_name || "VoltaShop";
  const message = `Hola! Vengo de ${storeName} y quiero hacer una consulta: `;

  return (
    <a 
      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="whatsapp-float"
      title="Atención al cliente por WhatsApp"
    >
      <div className="whatsapp-content">
        <MessageCircle size={32} />
        <span className="whatsapp-tooltip">¡Escríbenos!</span>
      </div>
    </a>
  );
};

export default WhatsAppBtn;
