import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Store, LogOut, User, LayoutDashboard, Settings, ChevronDown, Package, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav className="navbar" style={{ position: 'relative', zIndex: 50 }}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="/Lokki.png" alt="Lokki" style={{ height: '35px' }} />
        </Link>
        
        <div className="navbar-actions">
          {user ? (
            <div className="user-menu-container" ref={dropdownRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  background: 'transparent', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                }}
                className="user-indicator hover-bg"
              >
                <User size={18} />
                <span style={{ fontWeight: '500', color: '#111' }}>
                  {user.user_metadata?.nombre || user.email}
                </span>
                <ChevronDown size={14} style={{ color: '#666', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {dropdownOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    background: '#fff',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid #eaeaea',
                    minWidth: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eaeaea', background: '#fafafa' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Conectado como</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '500', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </p>
                  </div>
                  
                  <Link 
                    to="/profile" 
                    onClick={() => setDropdownOpen(false)}
                    style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#333', textDecoration: 'none', borderBottom: '1px solid #f5f5f5' }}
                  >
                    <Settings size={16} /> Mi Cuenta
                  </Link>
                  
                  <Link 
                    to="/mis-productos" 
                    onClick={() => setDropdownOpen(false)}
                    style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#333', textDecoration: 'none', borderBottom: '1px solid #f5f5f5' }}
                  >
                    <Package size={16} /> Mis Productos
                  </Link>

                  <Link 
                    to="/mis-pedidos" 
                    onClick={() => setDropdownOpen(false)}
                    style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#333', textDecoration: 'none', borderBottom: '1px solid #f5f5f5' }}
                  >
                    <ShoppingBag size={16} /> Mis Pedidos
                  </Link>

                  <Link 
                    to="/dashboard" 
                    onClick={() => setDropdownOpen(false)}
                    style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#333', textDecoration: 'none', borderBottom: '1px solid #f5f5f5' }}
                  >
                    <LayoutDashboard size={16} /> Mi Dashboard
                  </Link>

                  <button 
                    onClick={() => {
                        setDropdownOpen(false);
                        logout();
                    }} 
                    style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d32f2f', background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none', textAlign: 'left', width: '100%' }}
                  >
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Iniciar sesión</Link>
              <Link to="/register" className="btn btn-primary">Crear cuenta</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
