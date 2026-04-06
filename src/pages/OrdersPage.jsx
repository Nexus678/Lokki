import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const STATUS_COLORS = {
  'pendiente': { bg: '#fff0f0', color: '#d32f2f', icon: <Clock size={16} /> },
  'pagado': { bg: '#eef4ff', color: '#1877F2', icon: <CheckCircle size={16} /> },
  'enviado': { bg: '#fef3c7', color: '#d97706', icon: <Truck size={16} /> },
  'entregado': { bg: '#ecfdf5', color: '#059669', icon: <CheckCircle size={16} /> },
  'cancelado': { bg: '#f3f4f6', color: '#4b5563', icon: <XCircle size={16} /> },
};

export default function OrdersPage() {
  const { user } = useAuthStore();
  const [storeId, setStoreId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (user) {
      fetchStoreAndOrders();
    }
  }, [user]);

  const fetchStoreAndOrders = async () => {
    try {
      setLoading(true);
      // 1. Obtener la tienda
      const { data: storeData } = await supabase
        .from('tiendas')
        .select('id')
        .eq('id_user', user.id)
        .single();
        
      if (!storeData) {
        setLoading(false);
        return;
      }
      setStoreId(storeData.id);

      // 2. Obtener los pedidos
      const { data: ordersData, error: ordersError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id_tienda', storeData.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estatus: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      // Update local state without refetching all
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, estatus: newStatus } : o));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Hubo un error al actualizar el estatus.');
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  if (!storeId && !loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Configura tu tienda primero</h2>
        <p>Necesitas crear tu tienda en el Dashboard antes de poder recibir pedidos.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ margin: '0 0 2rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Package size={28} /> Mis Pedidos
      </h1>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fafafa', borderRadius: '1rem', color: '#666' }}>
          <Package size={48} style={{ color: '#ccc', margin: '0 auto 1rem auto' }} />
          <h3>Aún no tienes pedidos</h3>
          <p>Los pedidos que realicen tus clientes aparecerán aquí.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => {
            const date = new Date(order.created_at).toLocaleDateString('es-ES', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
            });
            const statusStyle = STATUS_COLORS[order.estatus] || STATUS_COLORS['pendiente'];
            const isExpanded = expandedOrder === order.id;
            
            // Calculate total from detail
            const cartTotal = Array.isArray(order.detalle_pedido) ? 
                order.detalle_pedido.reduce((acc, item) => acc + (parseFloat(item.product.precio) * item.quantity), 0) : 0;

            return (
              <div key={order.id} style={{ background: '#fff', borderRadius: '1rem', border: '1px solid #eaeaea', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                {/* Header Row */}
                <div 
                  onClick={() => toggleExpand(order.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', cursor: 'pointer', background: isExpanded ? '#fafafa' : '#fff' }}
                >
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#666' }}>ID Pedido</p>
                      <p style={{ margin: 0, fontWeight: 'bold', fontFamily: 'monospace' }}>#{order.id.split('-')[0]}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#666' }}>Fecha</p>
                      <p style={{ margin: 0, fontWeight: '500' }}>{date}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#666' }}>Cliente</p>
                      <p style={{ margin: 0, fontWeight: '500' }}>{order.nombre_cliente}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#666' }}>Total</p>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>${cartTotal.toLocaleString()} MXN</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '2rem', background: statusStyle.bg, color: statusStyle.color, fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                      {statusStyle.icon} {order.estatus}
                    </div>
                    {isExpanded ? <ChevronUp size={20} color="#666" /> : <ChevronDown size={20} color="#666" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: '1.5rem', borderTop: '1px solid #eaeaea', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    
                    {/* Customer Info */}
                    <div style={{ flex: 1, minWidth: '250px', background: '#f9f9f9', padding: '1.5rem', borderRadius: '0.5rem' }}>
                      <h4 style={{ margin: '0 0 1rem 0' }}>Datos del Cliente</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <strong style={{ color: '#666' }}>Nombre:</strong> <span>{order.nombre_cliente}</span>
                        <strong style={{ color: '#666' }}>Teléfono:</strong> <span>{order.numero_telefonico || 'N/A'}</span>
                        <strong style={{ color: '#666' }}>Correo:</strong> <span>{order.correo || 'N/A'}</span>
                        <strong style={{ color: '#666' }}>Dirección:</strong> <span>{order.direccion || 'N/A'}</span>
                      </div>
                      
                      {/* Action selector */}
                      <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eaeaea' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Actualizar Estatus</label>
                        <select 
                          value={order.estatus} 
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #ddd' }}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="pagado">Pagado</option>
                          <option value="enviado">Enviado</option>
                          <option value="entregado">Entregado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div style={{ flex: 2, minWidth: '300px' }}>
                      <h4 style={{ margin: '0 0 1rem 0' }}>Productos Solicitados</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {Array.isArray(order.detalle_pedido) && order.detalle_pedido.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f5f5f5', paddingBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <img src={item.product?.imagen || ''} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '0.5rem', background: '#eaeaea' }} />
                              <div>
                                <p style={{ margin: '0 0 0.25rem 0', fontWeight: '500' }}>{item.product?.nombre_producto}</p>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Cantidad: {item.quantity}</p>
                              </div>
                            </div>
                            <div style={{ fontWeight: 'bold' }}>
                              ${ (parseFloat(item.product?.precio || 0) * item.quantity).toLocaleString() } {item.product?.moneda}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ textAlign: 'right', marginTop: '1rem', fontSize: '1.2rem' }}>
                        <span style={{ color: '#666', marginRight: '1rem' }}>Total General:</span>
                        <strong>${cartTotal.toLocaleString()} MXN</strong>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
