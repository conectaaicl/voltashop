import React from 'react';
import ProductGrid from '../components/ProductGrid';
import { useShop } from '../context/CartContext';
import { Heart } from 'lucide-react';

const WishlistPage = () => {
  const { wishlist } = useShop();

  return (
    <div className="container" style={{paddingTop: '2rem'}}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' }}>
        <Heart size={28} fill="var(--danger)" color="var(--danger)" /> 
        Tus Favoritos
      </h1>
      
      {wishlist.length === 0 ? (
        <div style={{textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '8px'}}>
          <h3>Aún no tienes favoritos</h3>
          <p style={{color: '#666', marginTop: '1rem'}}>Navega y guarda los productos que más te gustan con el corazón.</p>
        </div>
      ) : (
        <ProductGrid products={wishlist} />
      )}
    </div>
  );
};

export default WishlistPage;
