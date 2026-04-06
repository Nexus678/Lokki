import { Search, MapPin, StoreIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [tiendas, setTiendas] = useState([]);
  const [loadingTiendas, setLoadingTiendas] = useState(true);

  useEffect(() => {
    const fetchTiendas = async () => {
      try {
        const { data, error } = await supabase
          .from('tiendas')
          .select('id, titulo, descripcion, logo, banner, slug')
          .order('created_at', { ascending: false })
          .limit(8);
        
        if (error) throw error;
        setTiendas(data || []);
      } catch (err) {
        console.error('Error cargando tiendas:', err);
      } finally {
        setLoadingTiendas(false);
      }
    };
    
    fetchTiendas();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    } else {
      console.log('Buscar', { location });
    }
  };

  return (
    <div>
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Lokki</h1>
          <h2 className="hero-subtitle">Descubre las mejores tiendas locales cerca de ti.</h2>
          
          <form className="search-box" onSubmit={handleSearch}>
            <div className="search-input-group">
              <Search size={20} color="var(--text-light)" />
              <input 
                type="text" 
                placeholder="¿Qué estás buscando? (ej. Ropa, comida, etc)" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="search-input-group">
              <MapPin size={20} color="var(--text-light)" />
              <input 
                type="text" 
                placeholder="Ciudad o CP" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button type="submit" className="search-btn">
              <Search size={18} />
              Buscar
            </button>
          </form>
        </div>
      </section>

      <section className="categories-section">
        <h3 className="section-title">Categorías Populares</h3>
        <div className="category-grid">
          <div className="category-card">
            <div className="card-img-container">
              <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80" alt="Restaurantes" className="card-img" />
            </div>
            <div className="card-info">
              <h4 className="card-title">Restaurantes</h4>
            </div>
          </div>
          <div className="category-card">
            <div className="card-img-container">
              <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80" alt="Ropa" className="card-img" />
            </div>
            <div className="card-info">
              <h4 className="card-title">Tiendas de Ropa</h4>
            </div>
          </div>
          <div className="category-card">
            <div className="card-img-container">
              <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80" alt="Abarrotes" className="card-img" />
            </div>
            <div className="card-info">
              <h4 className="card-title">Abarrotes Especializados</h4>
            </div>
          </div>
          <div className="category-card">
            <div className="card-img-container">
              <img src="https://images.unsplash.com/photo-1516961642265-531546e84af2?auto=format&fit=crop&w=400&q=80" alt="Servicios" className="card-img" />
            </div>
            <div className="card-info">
              <h4 className="card-title">Servicios Locales</h4>
            </div>
          </div>
        </div>
      </section>

      <section className="stores-section">
        <h3 className="section-title">Nuevas Tiendas</h3>
        {loadingTiendas ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>Cargando tiendas...</p>
        ) : tiendas.length > 0 ? (
          <div className="stores-grid">
            {tiendas.map((tienda) => (
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
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>No hay tiendas disponibles por el momento.</p>
        )}
      </section>
    </div>
  );
}
