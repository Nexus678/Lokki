import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Plus, Search, Edit2, Trash2, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';

export default function ProductsPage() {
  const { user } = useAuthStore();
  const [storeId, setStoreId] = useState(null);
  
  // Data state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre_producto: '',
    categoria: '',
    precio: '',
    moneda: 'MXN',
    descripcion: '',
    imagen: null
  });

  useEffect(() => {
    if (user) {
      fetchStoreIdAndProducts();
    }
  }, [user, page, searchTerm]);

  const fetchStoreIdAndProducts = async () => {
    try {
      setLoading(true);
      // 1. Obtener la tienda del usuario actual
      const { data: storeData } = await supabase
        .from('tiendas')
        .select('id')
        .eq('id_user', user.id)
        .single();
        
      if (!storeData) {
        setLoading(false);
        return; // No tierne tienda aún
      }
      setStoreId(storeData.id);

      // 2. Obtener productos con rango y búsqueda
      let query = supabase
        .from('productos')
        .select('*', { count: 'exact' })
        .eq('id_tienda', storeData.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('nombre_producto', `%${searchTerm}%`);
      }

      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data: productsData, count, error } = await query;

      if (error) throw error;
      
      setProducts(productsData || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nombre_producto: product.nombre_producto,
        categoria: product.categoria || '',
        precio: product.precio,
        moneda: product.moneda || 'MXN',
        descripcion: product.descripcion || '',
        imagen: product.imagen || null
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nombre_producto: '',
        categoria: '',
        precio: '',
        moneda: 'MXN',
        descripcion: '',
        imagen: null
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      setUploadingImage(true);
      
      // We need an id for the image name. If creating new, we generate a random id or use timestamp
      const imageId = editingProduct ? editingProduct.id : Date.now().toString();
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/products/${imageId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user_images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase
        .storage
        .from('user_images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, imagen: `${publicUrl}?t=${new Date().getTime()}` }));
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Error al subir la imagen del producto');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!storeId) {
      alert("Debes configurar tu tienda en el Dashboard primero.");
      return;
    }

    setSaving(true);
    try {
      const productData = {
        id_tienda: storeId,
        nombre_producto: formData.nombre_producto,
        categoria: formData.categoria,
        precio: parseFloat(formData.precio),
        moneda: formData.moneda,
        descripcion: formData.descripcion,
        imagen: formData.imagen,
        updated_at: new Date().toISOString()
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('productos')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('productos')
          .insert([productData]);
        if (error) throw error;
      }

      await fetchStoreIdAndProducts();
      closeModal();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) throw error;
      await fetchStoreIdAndProducts();
    } catch (err) {
      console.error('Error deleting product', err);
      alert('Error al eliminar');
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (!storeId && !loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Configura tu tienda primero</h2>
        <p>Necesitas ir al Dashboard y guardar los detalles de tu tienda antes de crear productos.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Mis Productos</h1>
        <button 
          onClick={() => openModal()}
          style={{ background: '#000', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '500' }}
        >
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      <div style={{ display: 'flex', marginBottom: '2rem', background: '#f5f5f5', borderRadius: '0.5rem', padding: '0.5rem 1rem', alignItems: 'center' }}>
        <Search size={20} style={{ color: '#666' }} />
        <input 
          type="text" 
          placeholder="Buscar por nombre..." 
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          style={{ border: 'none', background: 'transparent', outline: 'none', padding: '0.5rem', width: '100%', fontSize: '1rem' }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="animate-spin" size={32} /></div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666', background: '#fafafa', borderRadius: '1rem' }}>
          <p>No se encontraron productos.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {products.map(product => (
              <div key={product.id} style={{ border: '1px solid #eaeaea', borderRadius: '1rem', overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '200px', background: '#f9f9f9', position: 'relative' }}>
                  {product.imagen ? (
                    <img src={product.imagen} alt={product.nombre_producto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: '#ccc' }}>
                      <ImageIcon size={48} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openModal(product)} style={{ background: '#fff', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title="Editar">
                      <Edit2 size={16} style={{ color: '#111' }} />
                    </button>
                    <button onClick={() => handleDeleteProduct(product.id)} style={{ background: '#fff', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} title="Eliminar">
                      <Trash2 size={16} style={{ color: '#d32f2f' }} />
                    </button>
                  </div>
                </div>
                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#111' }}>{product.nombre_producto}</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>{product.categoria || 'Sin categoría'}</p>
                  <p style={{ fontWeight: 'bold', fontSize: '1.2rem', marginTop: 'auto', marginBottom: 0 }}>
                    ${parseFloat(product.precio).toLocaleString()} <span style={{fontSize: '0.8rem', color: '#666'}}>{product.moneda}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Anterior</button>
              <span style={{ padding: '0.5rem 1rem' }}>Página {page} de {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} style={{ padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>Siguiente</button>
            </div>
          )}
        </>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={24} /></button>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: '#f9f9f9', padding: '1.5rem', borderRadius: '1rem' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '0.5rem', background: '#eaeaea', backgroundImage: formData.imagen ? `url(${formData.imagen})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc' }}>
                  {!formData.imagen && <ImageIcon style={{ color: '#aaa' }} />}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Imagen del Producto</label>
                  <label className="upload-btn" style={{ cursor: 'pointer', padding: '0.5rem 1rem', background: '#fff', border: '1px solid #ddd', borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    {uploadingImage ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                    {uploadingImage ? 'Subiendo...' : 'Seleccionar Imagen'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImage} />
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre</label>
                <input type="text" name="nombre_producto" value={formData.nombre_producto} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Precio</label>
                  <input type="number" step="0.01" name="precio" value={formData.precio} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Moneda</label>
                  <select name="moneda" value={formData.moneda} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd', background: '#fff' }}>
                    <option value="MXN">MXN</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Categoría (opcional)</label>
                <input type="text" name="categoria" value={formData.categoria} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Descripción (opcional)</label>
                <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #ddd', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={closeModal} style={{ padding: '0.75rem 1.5rem', background: '#f5f5f5', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ padding: '0.75rem 1.5rem', background: '#000', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  Guardar Producto
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
