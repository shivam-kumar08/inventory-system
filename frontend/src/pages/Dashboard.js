import React, { useEffect, useState } from "react";
import { getProducts, getCustomers, getOrders } from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, customers: 0, orders: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getCustomers(), getOrders()])
      .then(([p, c, o]) => {
        const products = p.data;
        const orders = o.data;
        const revenue = orders.reduce((sum, ord) => sum + parseFloat(ord.total_amount || 0), 0);
        setStats({ products: products.length, customers: c.data.length, orders: orders.length, revenue });
        setRecentOrders(orders.slice(0, 5));
        setLowStock(products.filter((p) => p.stock <= 5).slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty"><div className="empty-icon">⏳</div><p>Loading...</p></div>;

  return (
    <div>
      <div className="page-header"><h1>Dashboard</h1></div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div><div className="stat-label">Products</div><div className="stat-value">{stats.products}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div><div className="stat-label">Customers</div><div className="stat-value">{stats.customers}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div><div className="stat-label">Orders</div><div className="stat-value">{stats.orders}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div><div className="stat-label">Revenue</div><div className="stat-value">₹{stats.revenue.toFixed(2)}</div></div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>Recent Orders</h3>
          {recentOrders.length === 0 ? <p className="empty">No orders yet</p> : (
            <table><thead><tr><th>#</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.customer?.name || "—"}</td>
                    <td>₹{parseFloat(o.total_amount).toFixed(2)}</td>
                    <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "1rem" }}>⚠️ Low Stock Alerts</h3>
          {lowStock.length === 0 ? <p className="empty">All products well-stocked!</p> : (
            <table><thead><tr><th>Product</th><th>SKU</th><th>Stock</th></tr></thead>
              <tbody>
                {lowStock.map(p => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td style={{ color: "#888", fontSize: "0.8rem" }}>{p.sku}</td>
                    <td><span className={`badge badge-${p.stock === 0 ? "cancelled" : "low"}`}>{p.stock}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
