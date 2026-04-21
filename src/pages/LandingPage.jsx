import { 
  Search, 
  MapPin, 
  Utensils, 
  ShoppingBag, 
  Moon, 
  Heart, 
  Sparkles, 
  Car, 
  Home, 
  MoreHorizontal,
  ChevronDown,
  Star,
  ThumbsUp,
  Image as ImageIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [tiendas, setTiendas] = useState([]);
  const [loadingTiendas, setLoadingTiendas] = useState(true);

  useEffect(() => {
    const fetchTiendas = async () => {
      try {
        const { data, error } = await supabase
          .from('tiendas')
          .select('id, titulo, descripcion, logo, banner, slug, created_at')
          .order('created_at', { ascending: false })
          .limit(9);
        
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

  const getTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000); // in minutes
    if (diff < 60) return `${Math.max(1, diff)} minutos ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} horas ago`;
    return `${Math.floor(hours / 24)} días ago`;
  };

  return (
    <div className="landing-page">
      {/* HERO SECTION WITH EMBEDDED HEADER */}
      <section className="yelp-hero-section">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="hero-background-video"
          poster="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
        >
          <source src="/Creaci%C3%B3n_de_Video_con_Logo_Giratorio.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <header className="yelp-header">
          <div className="yelp-header-top">
            <Link to="/" className="yelp-logo">
              <span className="yelp-logo-text">Lokki</span>
              <span className="yelp-logo-icon">✶</span>
            </Link>

            <div className="yelp-header-search-container">
              <form className="yelp-search-bar" onSubmit={handleSearch}>
                <div className="yelp-search-input-group primary-input">
                  <span className="search-placeholder-text">Cosas que hacer, restaurantes, tiendas...</span>
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="search-divider"></div>
                <div className="yelp-search-input-group secondary-input">
                  <span className="search-placeholder-text">Ciudad o CP</span>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <button type="submit" className="yelp-search-btn">
                  <Search size={22} strokeWidth={3} />
                </button>
              </form>
            </div>

            <div className="yelp-header-actions">
              <Link to="/dashboard" className="header-link yelp-for-business">Lokki para Empresas</Link>
              <Link to="/" className="header-link">Escribir una reseña</Link>
              <div className="header-link-with-icon">
                <span>Start a Project</span>
              </div>
              
              {!user ? (
                <>
                  <Link to="/login" className="header-btn btn-login">Acceder</Link>
                  <Link to="/register" className="header-btn btn-register">Registrarse</Link>
                </>
              ) : (
                <Link to="/profile" className="header-btn btn-login">Mi Perfil</Link>
              )}
            </div>
          </div>

          <div className="yelp-header-categories">
            <Link to="/search?q=Restaurantes" className="header-cat-link">
              Restaurantes <ChevronDown size={14} />
            </Link>
            <Link to="/search?q=Casa" className="header-cat-link">
              Casa y jardín <ChevronDown size={14} />
            </Link>
            <Link to="/search?q=Autos" className="header-cat-link">
              Servicios para autos <ChevronDown size={14} />
            </Link>
            <Link to="/search?q=Salud" className="header-cat-link">
              Health & Beauty <ChevronDown size={14} />
            </Link>
            <Link to="/search?q=Viajes" className="header-cat-link">
              Travel & Activities <ChevronDown size={14} />
            </Link>
            <Link to="/search" className="header-cat-link">
              Más <ChevronDown size={14} />
            </Link>
          </div>
        </header>

        <div className="yelp-hero-content">
          <h1 className="yelp-hero-title">Conéctate con negocios locales fantásticos</h1>
          <div className="yelp-hero-credit">
            <p className="credit-name">Lokki Local</p>
            <p className="credit-photo">Foto de Comunidad Lokki</p>
          </div>
        </div>
      </section>

      {/* RECENT ACTIVITY / STORES */}
      <section className="yelp-section yelp-recent-activity">
        <h2 className="yelp-section-title">Actividad reciente</h2>
        
        {loadingTiendas ? (
          <p style={{ textAlign: 'center', margin: '2rem 0' }}>Cargando actividad...</p>
        ) : tiendas.length > 0 ? (
          <div className="yelp-activity-grid">
            {tiendas.map((tienda) => (
              <div key={tienda.id} className="yelp-activity-card">
                <div className="activity-card-header">
                  <img 
                    src={tienda.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tienda.titulo)}&background=random`} 
                    alt={tienda.titulo} 
                    className="activity-user-avatar"
                  />
                  <div className="activity-user-info">
                    <p className="activity-user-name"><b>{tienda.titulo}</b> ha abierto su tienda</p>
                    <p className="activity-time">{getTimeAgo(tienda.created_at)}</p>
                  </div>
                </div>

                <div className="activity-store-meta">
                  <h3 className="activity-store-title">{tienda.titulo}</h3>
                  <div className="activity-rating-row">
                    <div className="star-rating">
                      {[...Array(4)].map((_, i) => <Star key={i} size={14} fill="#f43939" color="#f43939" />)}
                      <Star size={14} fill="#e6e6e6" color="#e6e6e6" />
                    </div>
                    <span className="rating-count">Nuevo</span>
                  </div>
                </div>

                <Link to={`/store/${tienda.slug}`} className="activity-photo-grid">
                  <img src={tienda.banner || 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=400&q=80'} alt={`Foto de ${tienda.titulo}`} />
                </Link>

                <div className="activity-card-footer">
                  <button className="activity-action-btn">
                    <ThumbsUp size={18} color="#666" />
                  </button>
                  <button className="activity-action-btn">
                    <ImageIcon size={18} color="#666" />
                  </button>
                </div>
                
                {tienda.descripcion && (
                  <div className="activity-review-snippet">
                    <p>{tienda.descripcion}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', margin: '2rem 0' }}>No hay actividad reciente.</p>
        )}
        
        <div className="yelp-more-link-container">
          <Link to="/search" className="yelp-more-link">Ver más actividad <ChevronDown size={16} /></Link>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="yelp-section yelp-categories">
        <h2 className="yelp-section-title">Categorías</h2>
        <div className="yelp-categories-grid">
          <Link to="/search?q=Restaurantes" className="yelp-category-card">
            <Utensils size={32} color="#f43939" strokeWidth={1.5} />
            <span>Restaurantes</span>
          </Link>
          <Link to="/search?q=Compras" className="yelp-category-card">
            <ShoppingBag size={32} color="#f43939" strokeWidth={1.5} />
            <span>Compras</span>
          </Link>
          <Link to="/search?q=Vida+nocturna" className="yelp-category-card">
            <Moon size={32} color="#f43939" strokeWidth={1.5} />
            <span>Vida nocturna</span>
          </Link>
          <Link to="/search?q=Vida+activa" className="yelp-category-card">
            <Heart size={32} color="#f43939" strokeWidth={1.5} />
            <span>Vida activa</span>
          </Link>
          <Link to="/search?q=Belleza" className="yelp-category-card">
            <Sparkles size={32} color="#f43939" strokeWidth={1.5} />
            <span>Belleza y spas</span>
          </Link>
          <Link to="/search?q=Automotriz" className="yelp-category-card">
            <Car size={32} color="#f43939" strokeWidth={1.5} />
            <span>Automotriz</span>
          </Link>
          <Link to="/search?q=Hogar" className="yelp-category-card">
            <Home size={32} color="#f43939" strokeWidth={1.5} />
            <span>Hogar</span>
          </Link>
          <Link to="/search" className="yelp-category-card">
            <MoreHorizontal size={32} color="#f43939" strokeWidth={1.5} />
            <span>Más</span>
          </Link>
        </div>
      </section>

      {/* BIG FOOTER */}
      <footer className="yelp-footer">
        <div className="yelp-footer-content">
          <div className="footer-columns">
            <div className="footer-column">
              <h4>Sobre</h4>
              <Link to="/">Sobre Lokki</Link>
              <Link to="/">Carreras</Link>
              <Link to="/">Prensa</Link>
              <Link to="/">Estrategia de Inversión</Link>
              <Link to="/">Confianza y Seguridad</Link>
              <Link to="/">Directrices de Contenido</Link>
              <Link to="/">Condiciones de Servicio</Link>
              <Link to="/">Política de Privacidad</Link>
              <Link to="/">Opciones de publicidad</Link>
              <Link to="/">Gestionar Cookies</Link>
            </div>
            <div className="footer-column">
              <h4>Descubrir</h4>
              <Link to="/">Colecciones</Link>
              <Link to="/">Conversaciones</Link>
              <Link to="/">Eventos</Link>
              <Link to="/">Blog de Lokki</Link>
              <Link to="/">Lokki móvil</Link>
              <Link to="/">Desarrolladores</Link>
              <Link to="/">RSS</Link>
            </div>
            <div className="footer-column">
              <h4>Lokki para Empresas</h4>
              <Link to="/">Reclama tu página de negocio</Link>
              <Link to="/">Gestión de Invitados de Lokki</Link>
              <Link to="/">Business Resources</Link>
              <Link to="/">Apoyo Empresarial</Link>
            </div>
            <div className="footer-column smaller">
              <h4>Idiomas</h4>
              <Link to="/" className="dropdown-style">Español <ChevronDown size={14}/></Link>
              
              <h4 style={{marginTop: '2rem'}}>Países</h4>
              <Link to="/" className="dropdown-style">México <ChevronDown size={14}/></Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>Copyright © 2024-2026 Lokki Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
