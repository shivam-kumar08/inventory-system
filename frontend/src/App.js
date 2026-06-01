import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Dashboard from "./pages/Dashboard";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="app">
        <nav className="sidebar">
          <div className="logo">
            <span className="logo-icon">📦</span>
            <span className="logo-text">InvenTrack</span>
          </div>
          <ul className="nav-links">
            <li><NavLink to="/" end>🏠 Dashboard</NavLink></li>
            <li><NavLink to="/products">🏷️ Products</NavLink></li>
            <li><NavLink to="/customers">👥 Customers</NavLink></li>
            <li><NavLink to="/orders">🛒 Orders</NavLink></li>
          </ul>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/orders" element={<Orders />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
