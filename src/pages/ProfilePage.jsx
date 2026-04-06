import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Save, Loader2, Upload } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    lada: '',
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAvatar();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setFormData({
          nombre: data.nombre || '',
          telefono: data.telefono || '',
          lada: data.lada || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvatar = async () => {
    try {
      // Trying to get public URL for profile image
      const { data: { publicUrl } } = supabase
        .storage
        .from('user_images')
        .getPublicUrl(`${user.id}/perfil.jpg`);
      
      // we check if it exists by looking at public url but publicUrl doesn't check existence.
      // just set it and let browser cache handle it or we append timestamp to avoid cache
      setAvatarUrl(`${publicUrl}?t=${new Date().getTime()}`);
    } catch (error) {
       console.error(error);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .upsert({
          id: user.id,
          nombre: formData.nombre,
          telefono: formData.telefono,
          lada: formData.lada,
          correo: user.email
        });

      if (error) throw error;
      alert('Perfil guardado exitosamente');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Hubo un error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Enforce jpg or matching extension, best to unify to jpg or extract exact type
      const filePath = `${user.id}/perfil.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase
        .storage
        .from('user_images')
        .getPublicUrl(filePath);

      setAvatarUrl(`${publicUrl}?t=${new Date().getTime()}`);
      alert('Imagen subida exitosamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="page-loader"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="profile-container" style={{maxWidth: '600px', margin: '0 auto', padding: '2rem'}}>
      <h1>Mi Perfil</h1>
      
      <div className="avatar-section" style={{marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem'}}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" style={{width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover'}} />
        ) : (
          <div style={{width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            Sin Foto
          </div>
        )}
        <div>
          <label htmlFor="avatar-upload" className="upload-btn" style={{cursor: 'pointer', padding: '0.5rem 1rem', background: '#000', color: '#fff', borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'}}>
            {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
            {uploading ? 'Subiendo...' : 'Subir Foto'}
          </label>
          <input 
            type="file" 
            id="avatar-upload"
            accept="image/*"
            style={{display: 'none'}}
            onChange={handleImageUpload}
            disabled={uploading}
          />
        </div>
      </div>

      <form onSubmit={handleSave} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
        <div className="form-group">
          <label>Nombre Completo</label>
          <input 
            type="text" 
            name="nombre" 
            value={formData.nombre} 
            onChange={handleChange} 
            required
            style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem'}}
          />
        </div>
        <div style={{display: 'flex', gap: '1rem'}}>
          <div className="form-group" style={{flex: 1}}>
            <label>Lada</label>
            <input 
              type="text" 
              name="lada" 
              value={formData.lada} 
              onChange={handleChange} 
              style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem'}}
            />
          </div>
          <div className="form-group" style={{flex: 3}}>
            <label>Teléfono</label>
            <input 
              type="text" 
              name="telefono" 
              value={formData.telefono} 
              onChange={handleChange} 
              style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem'}}
            />
          </div>
        </div>
        
        <button type="submit" disabled={saving} style={{padding: '0.75rem', background: '#000', color: '#fff', border: 'none', borderRadius: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '1rem'}}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </form>
    </div>
  );
}
