import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getOrders, createOrder, updateOrder, deleteOrder, getCustomers, getProducts } from "../api";

const STATUS_FLOW = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [form, setForm] = useState({ customer_id: "", items: [{ product_id: "", quantity: 1 }] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () =>
    Promise.all([getOrders(), getCustomers(), getProducts()])
      .then(([o, c, p]) => { setOrders(o.data); setCustomers(c.data); setProducts(p.data); })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product_id: "", quantity: 1 }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, key, val) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [key]: val };
    return { ...f, items };
  });

  const calcTotal = () => form.items.reduce((sum, item) => {
    const p = products.find(p => String(p.id) === String(item.product_id));
    return sum + (p ? parseFloat(p.price) * parseInt(item.quantity || 0) : 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        customer_id: parseInt(form.customer_id),
        items: form.items
          .filter(i => i.product_id && i.quantity)
          .map(i => ({ product_id: parseInt(i.product_id), quantity: parseInt(i.quantity) })),
      };
      await createOrder(payload);
      toast.success("Order created! Stock updated.");
      setModal(false);
      setForm({ customer_id: "", items: [{ product_id: "", quantity: 1 }] });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create order");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (order, status) => {
    try {
      await updateOrder(order.id, { status });
      toast.success(`Status → ${status}`);
      load();
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const handleDelete = async (o) => {
    if (!window.confirm(`Delete order #${o.id}?`)) return;
    try {
      await deleteOrder(o.id);
      toast.success("Order deleted");
      load();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const getStockWarning = (item) => {
    const p = products.find(p => String(p.id) === String(item.product_id));
    if (!p) return null;
    if (parseInt(item.quantity) > p.stock) return `Only ${p.stock} in stock`;
    return null;
  };

  if (loading) return <div className="empty"><div className="empty-icon">⏳</div><p>Loading...</p></div>;

  return (
    <div>
      <div className="page-header">
        <h1>🛒 Orders</h1>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ New Order</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="7" className="empty">No orders yet</td></tr>
              ) : orders.map(o => (
                <tr key={o.id}>
                  <td><strong>#{o.id}</strong></td>
                  <td>{o.customer?.name || "—"}</td>
                  <td>{o.items?.length} item(s)</td>
                  <td>₹{parseFloat(o.total_amount).toFixed(2)}</td>
                  <td>
                    <select
                      value={o.status}
                      onChange={e => handleStatusChange(o, e.target.value)}
                      className={`badge badge-${o.status}`}
                      style={{ border: "none", cursor: "pointer", fontWeight: 600 }}
                    >
                      {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "#888" }}>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td style={{ display: "flex", gap: "0.4rem" }}>
                    <button className="btn btn-edit btn-sm" onClick={() => setDetailModal(o)}>View</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(o)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>New Order</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer *</label>
                <select required value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Order Items</label>
                {form.items.map((item, i) => {
                  const warning = getStockWarning(item);
                  const prod = products.find(p => String(p.id) === String(item.product_id));
                  return (
                    <div key={i}>
                      <div className="order-item-row">
                        <div className="form-group">
                          <select
                            value={item.product_id}
                            onChange={e => updateItem(i, "product_id", e.target.value)}
                            required
                          >
                            <option value="">Select product...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock}) — ₹{parseFloat(p.price).toFixed(2)}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ maxWidth: 90 }}>
                          <input
                            type="number" min="1"
                            value={item.quantity}
                            onChange={e => updateItem(i, "quantity", e.target.value)}
                            required
                          />
                        </div>
                        {form.items.length > 1 && (
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)}>✕</button>
                        )}
                      </div>
                      {warning && <p style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: "-0.5rem", marginBottom: "0.5rem" }}>⚠️ {warning}</p>}
                      {prod && item.quantity && (
                        <p style={{ color: "#6c63ff", fontSize: "0.8rem", marginTop: "-0.5rem", marginBottom: "0.5rem" }}>
                          Subtotal: ₹{(parseFloat(prod.price) * parseInt(item.quantity)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  );
                })}
                <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>+ Add Item</button>
              </div>

              <div className="items-total">Order Total: ₹{calcTotal().toFixed(2)}</div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Placing..." : "Place Order"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {detailModal && (
        <div className="modal-backdrop" onClick={() => setDetailModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Order #{detailModal.id}</h2>
            <p style={{ color: "#888", marginBottom: "1rem" }}>Customer: <strong>{detailModal.customer?.name}</strong></p>
            <table>
              <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
              <tbody>
                {detailModal.items?.map(item => (
                  <tr key={item.id}>
                    <td>{item.product?.name}</td>
                    <td>{item.quantity}</td>
                    <td>₹{parseFloat(item.unit_price).toFixed(2)}</td>
                    <td>₹{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="items-total" style={{ marginTop: "0.75rem" }}>Total: ₹{parseFloat(detailModal.total_amount).toFixed(2)}</div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setDetailModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
