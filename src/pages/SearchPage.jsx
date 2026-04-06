import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { StoreIcon, Search, ImageIcon, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  
  const [tiendasResult, setTiendasResult] = useState([]);
  const [productosResult, setProductosResult] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!q.trim()) {
        setTiendasResult([]);
        setProductosResult([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      
      try {
        // 1. Busqueda directa en tiendas (titulo o descripcion)
        const { data: tiendasData, error: tiendasError } = await supabase
          .from('tiendas')
          .select('id, titulo, descripcion, logo, banner, slug')
          .or(`titulo.ilike.%${q}%,descripcion.ilike.%${q}%`);
          
        if (tiendasError) throw tiendasError;

        // 2. Busqueda en productos (nombre o descripcion) y traemos su tienda unida
        const { data: productosData, error: productosError } = await supabase
          .from('productos')
          .select(`
            *,
            tiendas:id_tienda (id, titulo, descripcion, logo, banner, slug)
          `)
          .or(`nombre_producto.ilike.%${q}%,descripcion.ilike.%${q}%`);
          
        if (productosError) throw productosError;

        // Combinar ambas listas de tiendas sin duplicados
        const uniqueStoresMap = new Map();
        
        // Agregar las tiendas directas
        (tiendasData || []).forEach(tienda => {
          if (tienda) uniqueStoresMap.set(tienda.id, tienda);
        });
        
        // Agregar las tiendas relacionadas por productos encontrados
        (productosData || []).forEach(item => {
          if (item?.tiendas) {
            // item.tiendas contiene la tienda al tener FK hacia la tabla 'tiendas'
            const tienda = Array.isArray(item.tiendas) ? item.tiendas[0] : item.tiendas; 
            if (tienda && !uniqueStoresMap.has(tienda.id)) {
              uniqueStoresMap.set(tienda.id, tienda);
            }
          }
        });

        setTiendasResult(Array.from(uniqueStoresMap.values()));
        setProductosResult(productosData || []);
      } catch (err) {
        console.error('Error buscando:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [q]);

  return (
    <div className="search-page" style={{ padding: '4rem 1rem', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
        <Search size={36} color="var(--primary-color)" />
        <h2 style={{ fontSize: '2.5rem', color: 'var(--text-dark)', fontWeight: '800' }}>
          Resultados para "{q}"
        </h2>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: '4rem', fontSize: '1.2rem' }}>Buscando...</p>
      ) : tiendasResult.length > 0 ? (
        <div className="stores-grid">
          {tiendasResult.map((tienda) => (
            <div key={tienda.id} className="store-card">
              <div className="store-banner-container">
                <img 
                  src={tienda.banner || 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=400&q=80'} 
                  alt={`Banner de ${tienda.titulo}`} 
                  className="store-banner" 
                />
                <div className="store-logo-wrapper">
                  <img 
                    src={tienda.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tienda.titulo)}&background=random`} 
                    alt={`Logo de ${tienda.titulo}`} 
                    className="store-logo" 
                  />
                </div>
              </div>
              <div className="store-info">
                <h4 className="store-name">{tienda.titulo}</h4>
                <p className="store-desc">{tienda.descripcion || 'Visita nuestra tienda para ver nuestros productos.'}</p>
                <div className="store-action">
                  <Link to={`/store/${tienda.slug}`} className="btn-store">
                    <StoreIcon size={18} />
                    Ver tienda
                  </Link>
                </div>
              </div>
              </div>
            ))}
          </div>
      ) : productosResult.length > 0 ? null : (
        <div style={{ textAlign: 'center', marginTop: '6rem', backgroundColor: 'var(--bg-white)', padding: '4rem 2rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
          <StoreIcon size={64} color="var(--border-color)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.8rem', color: 'var(--text-dark)', marginBottom: '1rem', fontWeight: 'bold' }}>Sin resultados</h3>
          <p style={{ color: 'var(--text-light)', fontSize: '1.2rem', marginBottom: '2rem' }}>No encontramos ninguna tienda ni producto que coincida con "{q}".</p>
          <Link to="/" className="btn-outline btn" style={{ padding: '0.75rem 1.5rem', fontWeight: '600' }}>Volver al inicio</Link>
        </div>
      )}

      {!loading && productosResult.length > 0 && (
        <div style={{ marginTop: tiendasResult.length > 0 ? '4rem' : '1rem' }}>
          <h3 style={{ fontSize: '1.8rem', color: '#111', marginBottom: '2rem' }}>Productos Encontrados</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
            {productosResult.map(product => {
              const tienda = Array.isArray(product.tiendas) ? product.tiendas[0] : product.tiendas;
              return (
              <div key={product.id} className="product-search-card" style={{ display: 'flex', flexDirection: 'column', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #eaeaea', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-4px)' } }}>
                <div style={{ height: '220px', background: '#f5f5f5', position: 'relative' }}>
                  {product.imagen ? (
                    <img src={product.imagen} alt={product.nombre_producto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: '#ccc' }}>
                      <ImageIcon size={48} />
                    </div>
                  )}
                  {tienda && (
                     <div style={{position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,255,255,0.95)', padding: '0.4rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', color: 'var(--text-dark)'}}>
                        <StoreIcon size={14} /> {tienda.titulo}
                     </div>
                  )}
                </div>
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#111' }}>{product.nombre_producto}</h3>
                  <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>{product.categoria || 'Sin categoría'}</p>
                  <p style={{ color: '#888', fontSize: '0.85rem', flex: 1, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.descripcion}</p>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#111' }}>
                      ${parseFloat(product.precio).toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'normal' }}>{product.moneda}</span>
                    </span>
                    {tienda && (
                      <Link 
                        to={`/store/${tienda.slug}`}
                        style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '2rem', padding: '0.6rem 1.2rem', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(211, 35, 35, 0.2)' }}
                      >
                         <ExternalLink size={16} /> Ver tienda
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}
    </div>
  );
}
