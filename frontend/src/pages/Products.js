import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../api";

const empty = { name: "", sku: "", description: "", price: "", stock: "" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => getProducts().then(r => { setProducts(r.data); setFiltered(r.data); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)));
  }, [search, products]);

  const openCreate = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, sku: p.sku, description: p.description, price: p.price, stock: p.stock }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateProduct(editing.id, form);
        toast.success("Product updated!");
      } else {
        await createProduct(form);
        toast.success("Product created!");
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await deleteProduct(p.id);
      toast.success("Product deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Delete failed");
    }
  };

  if (loading) return <div className="empty"><div className="empty-icon">⏳</div><p>Loading...</p></div>;

  return (
    <div>
      <div className="page-header">
        <h1>🏷️ Products</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
      </div>

      <div className="card">
        <div className="search-bar">
          <input placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
          <span style={{ color: "#888", fontSize: "0.85rem" }}>{filtered.length} results</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="empty">No products found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong><br /><span style={{ color: "#888", fontSize: "0.8rem" }}>{p.description}</span></td>
                  <td><code style={{ background: "#f0f2f5", padding: "2px 6px", borderRadius: 4 }}>{p.sku}</code></td>
                  <td>₹{parseFloat(p.price).toFixed(2)}</td>
                  <td><span className={`badge badge-${p.stock <= 5 ? "low" : "ok"}`}>{p.stock}</span></td>
                  <td style={{ display: "flex", gap: "0.4rem" }}>
                    <button className="btn btn-edit btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? "Edit Product" : "New Product"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
                </div>
                <div className="form-group">
                  <label>SKU *</label>
                  <input required value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="PROD-001" />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Optional description" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
