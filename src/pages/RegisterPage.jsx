import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await register(email, password, nombre);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta. Intenta de nuevo.');
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>Crear Cuenta</h2>
        <p>Únete a Lokki para descubrir tiendas increíbles</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="name">Nombre</label>
          <input
            id="name"
            type="text"
            className="form-control"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            id="email"
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña (Mín. 6 caracteres)</label>
          <input
            id="password"
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary form-submit"
          disabled={isLoading}
        >
          {isLoading ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>

      <div className="form-footer">
        ¿Ya tienes cuenta? <Link to="/login" className="form-link">Inicia sesión</Link>
      </div>
    </div>
  );
}
