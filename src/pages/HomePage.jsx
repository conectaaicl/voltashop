import React from 'react';
import HeroBanner from '../components/HeroBanner';
import ProductGrid from '../components/ProductGrid';
import { useShop } from '../context/CartContext';

const HomePage = () => {
  const { products } = useShop();
  const [filter, setFilter] = React.useState('Todos');
  const categories = ['Todos', 'Smartphones', 'Tablet', 'Laptop', 'Accesorios'];

  const filteredProducts = filter === 'Todos' 
    ? products 
    : products.filter(p => p.category === filter);

  return (
    <>
      <HeroBanner />
      <div className="container">
        <div className="category-filters" style={{display: 'flex', gap: '1rem', margin: '2rem 0', overflowX: 'auto', paddingBottom: '0.5rem'}}>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '30px',
                border: '1px solid #e2e8f0',
                background: filter === cat ? 'var(--accent)' : 'white',
                color: filter === cat ? 'white' : 'var(--primary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <h2 style={{margin: '1rem 0', fontSize: '1.5rem'}}>
          {filter === 'Todos' ? 'Basado en tu última visita' : `Explorando ${filter}`}
        </h2>
        <ProductGrid products={filteredProducts} />
      </div>
    </>
  );
};

export default HomePage;
