import React from 'react';
import { MessageCircle } from 'lucide-react';
import './WhatsAppBtn.css';

const WhatsAppBtn = () => {
  const whatsappNumber = "56912345678"; // Dummy LATAM number
  const message = "Hola! Vengo de VoltaShop y quiero hacer una consulta sobre: ";

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
