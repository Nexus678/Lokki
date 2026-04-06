import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ExternalLink, Globe, Link2, MessageCircle } from 'lucide-react';

export default function StorePreview({ storeId, fallbackData }) {
  const [store, setStore] = useState(fallbackData);

  // Set store initially to fallbackData (unsaved edits)
  useEffect(() => {
    setStore(fallbackData);
  }, [fallbackData]);

  // Handle Real Time Subscription
  useEffect(() => {
    if (!storeId) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tiendas',
          filter: `id=eq.${storeId}`
        },
        (payload) => {
          console.log('Realtime Update Received!', payload);
          if (payload.new) {
            // Overwrite specific fields that changed from DB
            setStore(payload.new);
          }
        }
      )
      .subscribe((status) => {
        console.log("Supabase Realtime Status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Banner */}
      <div 
        style={{ 
          height: '200px', 
          backgroundColor: '#ddd', 
          backgroundImage: store.banner ? `url(${store.banner})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        {/* Logo overlay */}
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          left: '2rem',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          border: '4px solid #fff',
          backgroundColor: '#eee',
          backgroundImage: store.logo ? `url(${store.logo})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }} />
      </div>

      {/* Content */}
      <div style={{ padding: '2rem', paddingTop: '3rem', flex: 1, backgroundColor: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111' }}>
              {store.titulo || 'Nombre de tu Tienda'}
            </h1>
            <p style={{ color: '#666', marginTop: '0.25rem' }}>
              @{store.slug || 'slug'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {store.url_instagram && (
              <a href={store.url_instagram} target="_blank" rel="noreferrer" style={{color: '#E1306C'}} title="Instagram">
                <Globe size={24} />
              </a>
            )}
            {store.url_facebook && (
              <a href={store.url_facebook} target="_blank" rel="noreferrer" style={{color: '#1877F2'}} title="Facebook">
                <Link2 size={24} />
              </a>
            )}
            {store.whatsapp && (
              <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noreferrer" style={{color: '#25D366'}} title="WhatsApp">
                <MessageCircle size={24} />
              </a>
            )}
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Acerca de nosotros</h3>
          <p style={{ color: '#444', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
            {store.descripcion || 'Escribe una descripción para tu tienda...'}
          </p>
        </div>
        
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
           <a 
             href={`/store/${store.slug}`}
             target="_blank"
             rel="noopener noreferrer"
             style={{
               padding: '0.75rem 2rem', 
               backgroundColor: '#000', 
               color: '#fff', 
               border: 'none', 
               textDecoration: 'none',
               borderRadius: '2rem',
               display: 'flex',
               alignItems: 'center',
               gap: '0.5rem',
               fontWeight: 'bold',
               cursor: 'pointer'
             }}>
             Visitar Tienda <ExternalLink size={16} />
           </a>
        </div>
      </div>
    </div>
  );
}
