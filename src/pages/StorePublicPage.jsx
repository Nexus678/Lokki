import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Globe, Link2, MessageCircle, AlertCircle, ShoppingCart, X, Plus, Minus, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';

export default function StorePublicPage() {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout Form State
  const [checkoutForm, setCheckoutForm] = useState({
    nombre_cliente: '',
    direccion: '',
    correo: '',
    numero_telefonico: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchStoreAndProducts = async () => {
      try {
        const { data: storeData, error: storeError } = await supabase
          .from('tiendas')
          .select('*')
          .eq('slug', slug)
          .single();

        if (storeError) throw storeError;
        setStore(storeData);

        const { data: productsData, error: productsError } = await supabase
          .from('productos')
          .select('*')
          .eq('id_tienda', storeData.id)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;
        setProducts(productsData || []);

      } catch (err) {
        console.error('Error fetching store:', err);
        setError('No pudimos encontrar esta tienda. Puede que la URL sea incorrecta o la tienda ya no exista.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchStoreAndProducts();
  }, [slug]);

  // Cart Actions
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    // Optional: open cart or show toast indicator
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) => prev.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.product.precio) * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckoutChange = (e) => {
    setCheckoutForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setIsSubmitting(true);
    try {
      // 1. Save to database
      const orderData = {
        id_tienda: store.id,
        detalle_pedido: cart,
        nombre_cliente: checkoutForm.nombre_cliente,
        direccion: checkoutForm.direccion,
        correo: checkoutForm.correo,
        numero_telefonico: checkoutForm.numero_telefonico,
        estatus: 'pendiente'
      };

      const { data, error } = await supabase.from('pedidos').insert([orderData]).select().single();
      if (error) throw error;

      // 2. Format WhatsApp Message
      let message = `*Nuevo Pedido #${data.id.split('-')[0]}*\n\n`;
      message += `*Cliente:* ${checkoutForm.nombre_cliente}\n`;
      if (checkoutForm.direccion) message += `*Dirección:* ${checkoutForm.direccion}\n`;
      if (checkoutForm.numero_telefonico) message += `*Teléfono:* ${checkoutForm.numero_telefonico}\n\n`;
      
      message += `*Productos:*\n`;
      cart.forEach(item => {
        message += `- ${item.quantity}x ${item.product.nombre_producto} ($${item.product.precio} ${item.product.moneda})\n`;
      });
      message += `\n*TOTAL: $${cartTotal.toLocaleString()}*\n`;

      // 3. Open WhatsApp
      if (store.whatsapp) {
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${store.whatsapp}?text=${encodedMessage}`, '_blank');
      } else {
        alert('Pedido registrado con éxito. El comercio no tiene WhatsApp configurado.');
      }

      // 4. Clear Cart and Close
      setCart([]);
      setIsCartOpen(false);
      setCheckoutForm({ nombre_cliente: '', direccion: '', correo: '', numero_telefonico: '' });

    } catch (err) {
      console.error('Error submitting order', err);
      alert('Hubo un error al enviar tu pedido. Inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#666' }} />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5', textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={48} style={{ color: '#d32f2f', marginBottom: '1rem' }} />
        <h2>Tienda no encontrada</h2>
        <p style={{ color: '#666', maxWidth: '400px', marginTop: '0.5rem' }}>{error}</p>
        <Link to="/" style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#000', color: '#fff', textDecoration: 'none', borderRadius: '0.5rem' }}>
          Volver al Inicio
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'transparent', position: 'relative' }}>
      
      {/* Floating Cart Button */}
      <button 
        onClick={() => setIsCartOpen(true)}
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 40,
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '2rem',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontWeight: '500'
        }}
      >
        <ShoppingCart size={20} />
        {cartItemsCount > 0 && (
          <span style={{ background: '#fff', color: '#000', borderRadius: '1rem', padding: '0.1rem 0.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
            {cartItemsCount}
          </span>
        )}
      </button>

      {/* Banner */}
      <div 
        style={{ 
          height: '250px', 
          backgroundColor: '#ddd', 
          backgroundImage: store.banner ? `url(${store.banner})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', height: '100%' }}>
          <div style={{
            position: 'absolute',
            bottom: '-50px',
            left: '2rem',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: '4px solid #fff',
            backgroundColor: '#eee',
            backgroundImage: store.logo ? `url(${store.logo})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }} />
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '2rem', paddingTop: '4rem', flex: 1, backgroundColor: '#fff', boxShadow: '0 0 20px rgba(0,0,0,0.02)' }}>
        
        {/* Store Header Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#111' }}>
              {store.titulo || 'Nombre de tu Tienda'}
            </h1>
            <p style={{ color: '#666', marginTop: '0.25rem', fontSize: '1.1rem' }}>
              @{store.slug}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {store.url_instagram && (
              <a href={store.url_instagram} target="_blank" rel="noreferrer" style={{color: '#E1306C', padding: '0.5rem', borderRadius: '50%', background: '#fff0f5', display: 'flex'}} title="Instagram">
                <Globe size={24} />
              </a>
            )}
            {store.url_facebook && (
              <a href={store.url_facebook} target="_blank" rel="noreferrer" style={{color: '#1877F2', padding: '0.5rem', borderRadius: '50%', background: '#eef4ff', display: 'flex'}} title="Facebook">
                <Link2 size={24} />
              </a>
            )}
            {store.whatsapp && (
              <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noreferrer" style={{color: '#25D366', padding: '0.5rem', borderRadius: '50%', background: '#ecfdf5', display: 'flex'}} title="WhatsApp">
                <MessageCircle size={24} />
              </a>
            )}
          </div>
        </div>

        {store.descripcion && (
          <div style={{ marginTop: '2.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #eaeaea', paddingBottom: '0.5rem' }}>Acerca de nosotros</h3>
            <p style={{ color: '#444', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontSize: '1.05rem' }}>
              {store.descripcion}
            </p>
          </div>
        )}
        
        {/* Products Grid */}
        <div style={{ marginTop: '4rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#111' }}>Catálogo de Productos</h2>
          
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#fafafa', borderRadius: '1rem', color: '#666' }}>
              Esta tienda aún no tiene productos disponibles.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
              {products.map(product => (
                <div key={product.id} style={{ display: 'flex', flexDirection: 'column', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #eaeaea', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-4px)' } }}>
                  <div style={{ height: '220px', background: '#f5f5f5', position: 'relative' }}>
                    {product.imagen ? (
                      <img src={product.imagen} alt={product.nombre_producto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: '#ccc' }}>
                        <ImageIcon size={48} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{product.nombre_producto}</h3>
                    <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>{product.categoria || 'Sin categoría'}</p>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                        ${parseFloat(product.precio).toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'normal' }}>{product.moneda}</span>
                      </span>
                      <button 
                        onClick={() => addToCart(product)}
                        style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '2rem', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Plus size={16} /> Agregar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Cart Drawer / Modal */}
      {isCartOpen && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '450px', background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', animation: 'slideIn 0.3s ease-out' }}>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={24} /> Tu Pedido
              </h2>
              <button onClick={() => setIsCartOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#666' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
                  <ShoppingCart size={48} style={{ color: '#ccc', margin: '0 auto 1rem auto' }} />
                  <p>Tu carrito está vacío</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {cart.map(item => (
                    <div key={item.product.id} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #f5f5f5', paddingBottom: '1rem' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '0.5rem', background: '#f5f5f5', backgroundImage: item.product.imagen ? `url(${item.product.imagen})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.25rem 0' }}>{item.product.nombre_producto}</h4>
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>${parseFloat(item.product.precio).toLocaleString()} {item.product.moneda}</p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f5f5f5', borderRadius: '2rem', padding: '0.25rem' }}>
                            <button onClick={() => updateQuantity(item.product.id, -1)} style={{ background: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Minus size={14} /></button>
                            <span style={{ fontSize: '0.9rem', minWidth: '1rem', textAlign: 'center' }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, 1)} style={{ background: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Plus size={14} /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.product.id)} style={{ background: 'transparent', border: 'none', color: '#d32f2f', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Trash2 size={14} /> Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px dashed #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem', color: '#666' }}>Total:</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${cartTotal.toLocaleString()}</span>
                  </div>

                  {/* Checkout Form */}
                  <form onSubmit={submitOrder} style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f9f9f9', padding: '1.5rem', borderRadius: '1rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>Datos de Envío</h3>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Nombre Completo *</label>
                      <input type="text" name="nombre_cliente" required value={checkoutForm.nombre_cliente} onChange={handleCheckoutChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Teléfono / WhatsApp *</label>
                      <input type="tel" name="numero_telefonico" required value={checkoutForm.numero_telefonico} onChange={handleCheckoutChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Dirección de Entrega</label>
                      <input type="text" name="direccion" value={checkoutForm.direccion} onChange={handleCheckoutChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Correo Electrónico</label>
                      <input type="email" name="correo" value={checkoutForm.correo} onChange={handleCheckoutChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      style={{ marginTop: '1rem', padding: '1rem', background: '#25D366', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <MessageCircle size={20} />}
                      {isSubmitting ? 'Enviando...' : 'Hacer Pedido por WhatsApp'}
                    </button>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#666', textAlign: 'center' }}>Serás redirigido a WhatsApp para confirmar tu pedido.</p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer style={{ background: '#111', color: '#fff', textAlign: 'center', padding: '1.5rem', marginTop: 'auto' }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#aaa' }}>Powered by Lokki Store</p>
      </footer>
    </div>
  );
}
