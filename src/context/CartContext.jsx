import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useShop = () => useContext(CartContext);

// Datos iniciales de ejemplo PRO
const initialProducts = [
  { id: 1, name: 'Samsung Galaxy S24 Ultra', price: 1299.99, image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=400', category: 'Smartphones', stock: 15, freeShipping: true, description: 'Pantalla Dynamic AMOLED 2X, 120Hz, cámara de 200MP. Rendimiento superior potenciado por IA.' },
  { id: 2, name: 'MacBook Pro 14" M3', price: 1999.00, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400', category: 'Laptops', stock: 8, freeShipping: true, description: 'Potencia sin precedentes con el chip M3 Pro. Batería para todo el día y pantalla Liquid Retina XDR.' },
  { id: 3, name: 'Sony WH-1000XM5', price: 348.50, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=400', category: 'Audio', stock: 25, freeShipping: false, description: 'Cancelación de ruido líder en la industria. Sonido de alta fidelidad y llamadas súper claras.' },
  { id: 4, name: 'Nintendo Switch OLED', price: 349.99, image: 'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?auto=format&fit=crop&q=80&w=400', category: 'Consolas', stock: 10, freeShipping: true, description: 'Colores vibrantes en pantalla OLED de 7 pulgadas. Memoria expandida e ideal para viaje.' },
  { id: 5, name: 'Monitor LG UltraGear 27"', price: 299.99, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400', category: 'Monitores', stock: 5, freeShipping: false, description: 'Experiencia gamer fluida con panel IPS a 144Hz y G-Sync Compatible.' },
  { id: 6, name: 'Teclado Mecánico Keychron K2', price: 89.90, image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=400', category: 'Accesorios', stock: 30, freeShipping: true, description: 'Teclado inalámbrico bluetooth táctil para creativos y programadores.' },
];

export const CartProvider = ({ children }) => {
  // --- STORE: PRODUCTS, CART AND WISHLIST ---
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- STORE: SAAS CONFIG (WHITE LABEL) ---
  const [saasConfig, setSaasConfig] = useState({
    store_name: 'VoltaShop',
    store_logo: 'https://img.icons8.com/clouds/100/shopping-cart.png',
    active_theme: 1
  });

  const fetchLandingConfig = async () => {
    try {
      const res = await fetch('/api/landing');
      if (res.ok) {
        const data = await res.json();
        setSaasConfig(data);
        // Aplicar tema al body
        document.body.setAttribute('data-theme', data.active_theme || 1);
      }
    } catch (err) {
      console.error("Error al cargar configuración SaaS:", err);
    }
  };

  useEffect(() => {
    fetchLandingConfig();
  }, []);
  
  // Conexión Dinámica al Servidor FastAPI (Cable Maestro)
  const fetchBackendData = async (filters = {}) => {
    try {
      let url = '/api/products';
      const query = new URLSearchParams();
      
      if (filters.q) query.append('q', filters.q);
      if (filters.category) query.append('category', filters.category);
      if (filters.minPrice) query.append('min_price', filters.minPrice);
      if (filters.maxPrice) query.append('max_price', filters.maxPrice);
      
      const queryString = query.toString();
      if (queryString) url += `?${queryString}`;

      const prodRes = await fetch(url);
      if(prodRes.ok) {
         const data = await prodRes.json();
         setProducts(data);
      }
    } catch (err) {
      console.error("Modo Offline: Usando Mock Data.");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBackendData({ q: searchQuery });
    }, 400); // Debounce de 400ms
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const [bannerConfig, setBannerConfig] = useState({
    title: 'Tecnología que te conecta al mejor precio.',
    subtitle: 'Aprovechá hasta 40% OFF en productos seleccionados y cuotas sin interés en VoltaShop.',
    badge: '¡NUEVA TEMPORADA!',
    buttonText: 'Ver Promociones',
    gradientStart: '#1f2355',
    gradientEnd: '#2d3277'
  });

  const [seoConfig, setSeoConfig] = useState({
    metaTitle: 'VoltaShop - Tu Tienda de Electrónica Online',
    metaDescription: 'Descubre los mejores smartphones, laptops y más en VoltaShop. Envíos gratis.',
    keywords: 'tecnologia, celulares, computadoras, mercadolibre, voltashop',
    semBudget: 500,
    semActive: true
  });

  // Inject SEO metadata natively
  useEffect(() => {
    document.title = seoConfig.metaTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", seoConfig.metaDescription);
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = seoConfig.metaDescription;
      document.head.appendChild(meta);
    }
  }, [seoConfig]);

  // --- ACTIONS ---
  
  // Cart
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };
  const removeFromCart = (productId) => setCart((prevCart) => prevCart.filter(item => item.id !== productId));
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart((prevCart) => prevCart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
  };
  const clearCart = () => setCart([]);
  const getCartTotal = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const getCartCount = () => cart.reduce((count, item) => count + item.quantity, 0);

  // Wishlist
  const toggleWishlist = (product) => {
    const isLiked = wishlist.some(item => item.id === product.id);
    if (isLiked) {
      setWishlist(wishlist.filter(item => item.id !== product.id));
    } else {
      setWishlist([...wishlist, product]);
    }
  };
  const isInWishlist = (productId) => wishlist.some(item => item.id === productId);

  // Orders
  const createOrder = (customerData) => {
    const newOrder = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toLocaleDateString(),
      customer: customerData.name || 'Invitado',
      document: customerData.document || 'S/N',
      amount: getCartTotal(),
      status: 'Pagado'
    };
    setOrders([newOrder, ...orders]);
  };

  // Admin Actions
  const addProduct = async (newProduct) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProduct)
      });
      if(res.ok) {
        const product = await res.json();
        setProducts(prev => [product, ...prev]);
        return product;
      } else if(res.status === 401) {
        alert('Sesión expirada. Por favor vuelve a iniciar sesión.');
        localStorage.removeItem('admin_token');
        window.location.reload();
      } else {
        const err = await res.json().catch(()=>({}));
        alert('Error al publicar: ' + (err.detail || res.status));
      }
    } catch (err) {
      console.error("Error al guardar producto:", err);
      alert('Error de conexión al publicar producto');
    }
  };

  const removeProduct = async (id) => {
    try {
      const token = localStorage.getItem('admin_token');
      // Necesitaremos añadir este endpoint al backend si no existe
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(res.ok) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (err) {
      setProducts(products.filter(p => p.id !== id)); // Fallback local
    }
  };

  const updateProduct = async (id, updatedProduct) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProduct)
      });
      if(res.ok) {
        const product = await res.json();
        setProducts(products.map(p => p.id === id ? product : p));
      }
    } catch (err) {
      setProducts(products.map(p => p.id === id ? { ...p, ...updatedProduct } : p));
    }
  };
  const updateBanner = (newConfig) => setBannerConfig({ ...bannerConfig, ...newConfig });
  const updateSeo = (newConfig) => setSeoConfig({ ...seoConfig, ...newConfig });

  return (
    <CartContext.Provider value={{
      // State
      products, cart, wishlist, orders, bannerConfig, seoConfig,
      // Selectors
      getCartTotal, getCartCount, isInWishlist,
      // Actions
      addToCart, removeFromCart, updateQuantity, clearCart, 
      toggleWishlist, createOrder,
      // Search
      searchQuery, setSearchQuery,
      // Saas Config
      saasConfig, setSaasConfig, fetchLandingConfig,
      // Admin Actions
      addProduct, removeProduct, updateProduct, updateBanner, updateSeo
    }}>
      {children}
    </CartContext.Provider>
  );
};
