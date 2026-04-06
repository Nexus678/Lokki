import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Save, Loader2, Image as ImageIcon } from 'lucide-react';
import StorePreview from '../components/StorePreview';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState(null);
  
  const [formData, setFormData] = useState({
    slug: '',
    titulo: '',
    descripcion: '',
    url_instagram: '',
    url_facebook: '',
    whatsapp: '',
    logo: null,
    banner: null
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStore();
    }
  }, [user]);

  const fetchStore = async () => {
    try {
      const { data, error } = await supabase
        .from('tiendas')
        .select('*')
        .eq('id_user', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setStoreId(data.id);
        setFormData({
          slug: data.slug || '',
          titulo: data.titulo || '',
          descripcion: data.descripcion || '',
          url_instagram: data.url_instagram || '',
          url_facebook: data.url_facebook || '',
          whatsapp: data.whatsapp || '',
          logo: data.logo || null,
          banner: data.banner || null
        });
      } else {
        // Create initial store record or leave it to save
        // Generando slug aleatorio como base
        const shortId = Math.random().toString(36).substring(7);
        setFormData(prev => ({...prev, slug: `tienda-${shortId}`}));
      }
    } catch (error) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = {
        id_user: user.id,
        slug: formData.slug,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        url_instagram: formData.url_instagram,
        url_facebook: formData.url_facebook,
        whatsapp: formData.whatsapp,
        logo: formData.logo,
        banner: formData.banner,
        updated_at: new Date().toISOString(),
      };

      if (storeId) {
        dataToSave.id = storeId;
      }

      const { data, error } = await supabase
        .from('tiendas')
        .upsert(dataToSave)
        .select()
        .single();

      if (error) throw error;
      
      if (!storeId && data) {
        setStoreId(data.id);
      }
      alert('Tienda guardada exitosamente');
    } catch (error) {
      console.error('Error saving store:', error);
      alert('Hubo un error al guardar la tienda');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event, type) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      if (type === 'logo') setUploadingLogo(true);
      else setUploadingBanner(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${type}.${fileExt}`;
      const filePath = `${user.id}/storage/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase
        .storage
        .from('user_images')
        .getPublicUrl(filePath);

      const urlWithCacheBuster = `${publicUrl}?t=${new Date().getTime()}`;
      
      setFormData(prev => ({
        ...prev,
        [type]: urlWithCacheBuster
      }));
      
      // Auto-save the store if we have an ID so the URL is persisted immediately
      if (storeId) {
        await supabase
          .from('tiendas')
          .update({ [type]: urlWithCacheBuster })
          .eq('id', storeId);
      }
      
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      alert(`Error al subir imagen de ${type}`);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  if (loading) {
    return <div className="page-loader"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', background: '#f5f5f5' }}>
      
      {/* Editor Sidebar */}
      <div style={{ width: '400px', background: '#fff', padding: '2rem', overflowY: 'auto', borderRight: '1px solid #eaeaea', height: 'calc(100vh - 64px)' }}>
        <h2>Editar Tienda</h2>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          
          <div className="form-group">
            <label>Slug (URL de tienda)</label>
            <input type="text" name="slug" value={formData.slug} onChange={handleChange} required style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem'}} />
          </div>

          <div className="form-group">
            <label>Título de Tienda</label>
            <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} required style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem'}} />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows={3} style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem', resize: 'vertical'}} />
          </div>

          {/* Image Uploaders */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Logo</label>
              <label className="upload-btn" style={{cursor: 'pointer', padding: '0.5rem', background: '#f0f0f0', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem'}}>
                {uploadingLogo ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                {uploadingLogo ? 'Subiendo...' : 'Cambiar Logo'}
                <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => handleImageUpload(e, 'logo')} disabled={uploadingLogo} />
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Banner</label>
              <label className="upload-btn" style={{cursor: 'pointer', padding: '0.5rem', background: '#f0f0f0', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem'}}>
                {uploadingBanner ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                {uploadingBanner ? 'Subiendo...' : 'Cambiar Banner'}
                <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => handleImageUpload(e, 'banner')} disabled={uploadingBanner} />
              </label>
            </div>
          </div>

          <div className="form-group" style={{marginTop: '0.5rem'}}>
            <label>WhatsApp</label>
            <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem'}} />
          </div>

          <div className="form-group">
            <label>URL Facebook</label>
            <input type="url" name="url_facebook" value={formData.url_facebook} onChange={handleChange} style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem'}} />
          </div>

          <div className="form-group">
            <label>URL Instagram</label>
            <input type="url" name="url_instagram" value={formData.url_instagram} onChange={handleChange} style={{width: '100%', padding: '0.5rem', marginTop: '0.25rem'}} />
          </div>

          <button type="submit" disabled={saving} style={{padding: '0.75rem', background: '#000', color: '#fff', border: 'none', borderRadius: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '1.5rem'}}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>

      {/* Live Preview Area */}
      <div style={{ flex: 1, padding: '2rem', height: 'calc(100vh - 64px)', overflowY: 'auto' }}>
        <h3 style={{marginBottom: '1rem', color: '#666'}}>Vista Previa en Tiempo Real</h3>
        <div style={{ background: '#fff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <StorePreview storeId={storeId} fallbackData={formData} />
        </div>
      </div>

    </div>
  );
}
