
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Package, ShoppingCart, Plus, Search,
  RefreshCw, TrendingUp, AlertTriangle, X, Pencil,
  Trash2, ArrowUpRight, CheckCircle2, XCircle, Boxes,
  ChevronRight, Menu
} from "lucide-react";
import "./index.css";
import "./auth.css";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api`;

async function request(path, options = {}) {
  const token = localStorage.getItem("stockguard_token");

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("stockguard_token");
    window.dispatchEvent(new Event("stockguard:unauthorized"));
    throw new Error("Your session expired. Please log in again.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body.detail || body.error || body.message ||
      `Request failed (${response.status})`
    );
  }

  if (response.status === 204) return null;
  return response.json();
}

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("stockguard_token") || ""
  );
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [page, setPage] = useState("Dashboard");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    stock: "",
  });
  const [orderForm, setOrderForm] = useState({
    productId: "",
    quantity: "1",
  });

  async function handleAuth(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const response = await fetch(
        `${API}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: authEmail.trim(),
            password: authPassword,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || data.message || data.error ||
          `Authentication failed (${response.status}).`
        );
      }

      if (!data.token) {
        throw new Error("The server did not return an authentication token.");
      }

      localStorage.setItem("stockguard_token", data.token);
      setToken(data.token);
      setAuthPassword("");
      setAuthError("");
    } catch (err) {
      setAuthError(err.message || "Could not connect to StockGuard.");
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("stockguard_token");
    setToken("");
    setProducts([]);
    setOrders([]);
    setPage("Dashboard");
    setNotice("");
    setError("");
    setAuthPassword("");
    setAuthError("");
  }

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken("");
      setAuthError("Your session expired. Please log in again.");
    };
    window.addEventListener("stockguard:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("stockguard:unauthorized", handleUnauthorized);
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [productData, orderData] = await Promise.all([
        request("/products"),
        request("/orders"),
      ]);
      setProducts(productData);
      setOrders(orderData);
    } catch (err) {
      setError(err.message || "Could not connect to StockGuard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadData();
    } else {
      setLoading(false);
      setProducts([]);
      setOrders([]);
    }
  }, [token]);

  const totalUnits = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const inventoryValue = products.reduce(
    (sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0),
    0
  );
  const activeOrders = orders.filter((o) => o.status === "PLACED");
  const lowStock = products.filter((p) => Number(p.stock) <= 5);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) =>
      `${p.name} ${p.id}`.toLowerCase().includes(q)
    );
  }, [products, search]);

  function openAddProduct() {
    setEditing(null);
    setProductForm({ name: "", price: "", stock: "" });
    setModal("product");
  }

  function openEditProduct(product) {
    setEditing(product);
    setProductForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
    });
    setModal("product");
  }

  async function saveProduct(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        name: productForm.name.trim(),
        price: Number(productForm.price),
        stock: Number(productForm.stock),
      };

      await request(
        editing ? `/products/${editing.id}` : "/products",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setModal("");
      setNotice(editing ? "Product updated successfully." : "Product added successfully.");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    setError("");
    setNotice("");

    try {
      await request(`/products/${product.id}`, { method: "DELETE" });
      setNotice("Product deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function placeOrder(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { productId, quantity } = orderForm;
      await request(
        `/orders?productId=${encodeURIComponent(productId)}&quantity=${encodeURIComponent(quantity)}`,
        { method: "POST" }
      );

      setModal("");
      setNotice("Order placed successfully. Stock has been updated.");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function cancelOrder(order) {
    if (order.status !== "PLACED") return;
    if (!window.confirm(`Cancel order #${order.id}? Stock will be restored.`)) return;

    setError("");
    setNotice("");

    try {
      await request(`/orders/${order.id}/cancel`, { method: "PUT" });
      setNotice(`Order #${order.id} cancelled. Stock has been restored.`);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function goTo(name) {
    setPage(name);
    setSearch("");
    setMobileNav(false);
    setError("");
    setNotice("");
  }

  const navigation = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Inventory", icon: Package },
    { name: "Orders", icon: ShoppingCart },
  ];

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand-mark"><Boxes size={25} /></div>
            <div>
              <div className="brand-name">stockguard<span>.</span></div>
              <div className="brand-caption">INVENTORY CONTROL</div>
            </div>
          </div>

          <div className="auth-heading">
            <span className="eyebrow">SECURE WORKSPACE</span>
            <h1>Welcome back.</h1>
            <p>Log in to manage your inventory and orders.</p>
          </div>

          {authError && (
            <div className="alert alert-error auth-error">
              <XCircle size={18} />
              <span>{authError}</span>
              <button type="button" onClick={() => setAuthError("")}><X size={16} /></button>
            </div>
          )}

          <form className="auth-form" onSubmit={handleAuth}>
            <label>
              Email address
              <input
                type="email"
                required
                autoComplete="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </label>

            <button
              className="button button-primary auth-submit"
              type="submit"
              disabled={authLoading}
            >
              {authLoading ? "Please wait..." : "Log in"}
            </button>
          </form>

          <p className="auth-security">
            <CheckCircle2 size={15} />
            Passwords are securely hashed by the backend.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Boxes size={23} /></div>
          <div>
            <div className="brand-name">stockguard<span>.</span></div>
            <div className="brand-caption">INVENTORY CONTROL</div>
          </div>
          <button className="mobile-close icon-button" onClick={() => setMobileNav(false)}>
            <X size={19} />
          </button>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="navigation">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${page === name ? "nav-active" : ""}`}
              onClick={() => goTo(name)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{name}</span>
              {name === "Orders" && activeOrders.length > 0 && (
                <span className="nav-count">{activeOrders.length}</span>
              )}
              {page === name && <ChevronRight className="nav-chevron" size={16} />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="security-card">
            <div className="security-icon"><CheckCircle2 size={18} /></div>
            <div>
              <strong>Stock protected</strong>
              <p>Atomic stock updates enabled</p>
            </div>
          </div>
          <div className="sidebar-footer">
            <div className="status-dot" />
            API connection
            <span>LOCAL</span>
          </div>
        </div>
      </aside>

      {mobileNav && <div className="mobile-overlay" onClick={() => setMobileNav(false)} />}

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <button className="mobile-menu icon-button" onClick={() => setMobileNav(true)}>
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={15} />
            <strong>{page}</strong>
          </div>
          <div className="topbar-right">
            <span className="live-pill"><span /> SYSTEM LIVE</span>
            <button className="icon-button refresh-button" onClick={loadData} title="Refresh data">
              <RefreshCw size={17} />
            </button>
            <button className="button button-secondary logout-button" onClick={logout}>
              Log out
            </button>
            <div className="avatar">SG</div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">OPERATIONS OVERVIEW</div>
              <h1>{page === "Dashboard" ? "Good to see you." : page}</h1>
              <p>
                {page === "Dashboard"
                  ? "Here's what's happening with your inventory today."
                  : page === "Inventory"
                  ? "Manage products, quantities and inventory value."
                  : "Track orders and manage cancellations."}
              </p>
            </div>
            <div className="heading-actions">
              <button className="button button-secondary" onClick={loadData}>
                <RefreshCw size={16} /> Refresh
              </button>
              {page !== "Orders" && (
                <button className="button button-primary" onClick={openAddProduct}>
                  <Plus size={17} /> Add product
                </button>
              )}
              {page === "Orders" && (
                <button
                  className="button button-primary"
                  onClick={() => {
                    setOrderForm({ productId: products.find((p) => p.stock > 0)?.id?.toString() || "", quantity: "1" });
                    setModal("order");
                  }}
                >
                  <Plus size={17} /> New order
                </button>
              )}
            </div>
          </section>

          {error && (
            <div className="alert alert-error">
              <XCircle size={18} />
              <span>{error}</span>
              <button onClick={() => setError("")}><X size={16} /></button>
            </div>
          )}
          {notice && (
            <div className="alert alert-success">
              <CheckCircle2 size={18} />
              <span>{notice}</span>
              <button onClick={() => setNotice("")}><X size={16} /></button>
            </div>
          )}

          {page === "Dashboard" && (
            <>
              <section className="stats-grid">
                <StatCard title="Total products" value={products.length} note="Products in catalogue" icon={Package} />
                <StatCard title="Units in stock" value={totalUnits.toLocaleString("en-IN")} note="Across all products" icon={Boxes} />
                <StatCard title="Inventory value" value={money(inventoryValue)} note="Current stock × price" icon={TrendingUp} />
                <StatCard title="Active orders" value={activeOrders.length} note="Awaiting completion" icon={ShoppingCart} />
              </section>

              <section className="dashboard-grid">
                <div className="panel inventory-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent inventory</h2>
                      <p>Your latest products and stock levels</p>
                    </div>
                    <button className="text-button" onClick={() => goTo("Inventory")}>
                      View all <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <ProductTable
                    products={products.slice(0, 5)}
                    onEdit={openEditProduct}
                    onDelete={deleteProduct}
                    compact
                  />
                  {!loading && products.length === 0 && <EmptyState text="No products yet. Add your first product." />}
                  {loading && <div className="loading-state">Loading inventory...</div>}
                </div>

                <div className="right-column">
                  <div className="panel stock-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Stock watch</h2>
                        <p>Products needing attention</p>
                      </div>
                      <div className="heading-icon warning-icon"><AlertTriangle size={18} /></div>
                    </div>
                    {lowStock.length === 0 ? (
                      <div className="all-good">
                        <CheckCircle2 size={24} />
                        <strong>All looking good</strong>
                        <span>No products at or below 5 units.</span>
                      </div>
                    ) : (
                      <div className="low-stock-list">
                        {lowStock.slice(0, 4).map((p) => (
                          <div className="low-stock-item" key={p.id}>
                            <div className="product-initial">{p.name?.charAt(0)?.toUpperCase() || "P"}</div>
                            <div className="low-stock-info">
                              <strong>{p.name}</strong>
                              <span>SKU #{p.id}</span>
                            </div>
                            <span className={`stock-quantity ${p.stock === 0 ? "stock-zero" : ""}`}>
                              {p.stock} left
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button className="stock-link" onClick={() => goTo("Inventory")}>
                      Review inventory <ArrowUpRight size={15} />
                    </button>
                  </div>

                  <div className="insight-card">
                    <div className="insight-top">
                      <span className="insight-tag">BUILT-IN PROTECTION</span>
                      <CheckCircle2 size={19} />
                    </div>
                    <h3>No overselling.<br />No stock surprises.</h3>
                    <p>Orders only succeed when sufficient inventory is available, even during simultaneous requests.</p>
                    <div className="insight-bottom">
                      <span>Atomic stock deduction</span>
                      <span className="insight-status">ENABLED</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="panel orders-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Latest orders</h2>
                    <p>Recent activity across your orders</p>
                  </div>
                  <button className="text-button" onClick={() => goTo("Orders")}>
                    All orders <ArrowUpRight size={15} />
                  </button>
                </div>
                <OrderTable orders={orders.slice(0, 5)} onCancel={cancelOrder} />
                {!loading && orders.length === 0 && <EmptyState text="Orders will appear here when you place one." />}
              </section>
            </>
          )}

          {page === "Inventory" && (
            <section className="panel full-panel">
              <div className="inventory-summary">
                <div>
                  <span className="summary-label">PRODUCT CATALOGUE</span>
                  <strong>{products.length} <small>products</small></strong>
                </div>
                <div className="search-box">
                  <Search size={17} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." />
                  {search && <button onClick={() => setSearch("")}><X size={15} /></button>}
                </div>
              </div>
              {loading ? <div className="loading-state">Loading inventory...</div> : (
                <ProductTable products={filteredProducts} onEdit={openEditProduct} onDelete={deleteProduct} />
              )}
              {!loading && filteredProducts.length === 0 && (
                <EmptyState text={search ? "No products match your search." : "No products yet. Add your first product."} />
              )}
            </section>
          )}

          {page === "Orders" && (
            <section className="panel full-panel">
              <div className="inventory-summary">
                <div>
                  <span className="summary-label">ORDER MANAGEMENT</span>
                  <strong>{orders.length} <small>total orders</small></strong>
                </div>
                <div className="order-filters">
                  <span className="filter-chip"><span className="filter-dot green" /> {activeOrders.length} placed</span>
                  <span className="filter-chip"><span className="filter-dot grey" /> {orders.length - activeOrders.length} cancelled</span>
                </div>
              </div>
              {loading ? <div className="loading-state">Loading orders...</div> : (
                <OrderTable orders={orders} onCancel={cancelOrder} />
              )}
              {!loading && orders.length === 0 && <EmptyState text="No orders yet. Create your first order." />}
            </section>
          )}

          <footer className="page-footer">
            <span>STOCKGUARD <span className="footer-dot">•</span> INVENTORY INTELLIGENCE</span>
            <span>Spring Boot · PostgreSQL · React</span>
          </footer>
        </div>
      </main>

      {modal === "product" && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal("")}>
          <form className="modal-card" onSubmit={saveProduct}>
            <div className="modal-heading">
              <div>
                <span className="eyebrow">{editing ? "EDIT CATALOGUE" : "NEW CATALOGUE ENTRY"}</span>
                <h2>{editing ? "Update product" : "Add a product"}</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setModal("")}><X size={19} /></button>
            </div>
            <label>Product name
              <input required minLength="1" maxLength="150" value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="e.g. Face Serum" />
            </label>
            <div className="form-row">
              <label>Price (₹)
                <input required type="number" min="1" step="0.01" value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="499.00" />
              </label>
              <label>Stock quantity
                <input required type="number" min="0" step="1" value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} placeholder="20" />
              </label>
            </div>
            <div className="modal-note"><CheckCircle2 size={17} /> Stock quantities cannot be negative.</div>
            <div className="modal-actions">
              <button type="button" className="button button-secondary" onClick={() => setModal("")}>Cancel</button>
              <button className="button button-primary" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save changes" : "Add product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === "order" && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal("")}>
          <form className="modal-card" onSubmit={placeOrder}>
            <div className="modal-heading">
              <div>
                <span className="eyebrow">ORDER MANAGEMENT</span>
                <h2>Create an order</h2>
              </div>
              <button type="button" className="icon-button" onClick={() => setModal("")}><X size={19} /></button>
            </div>
            <label>Select product
              <select required value={orderForm.productId}
                onChange={(e) => setOrderForm({ ...orderForm, productId: e.target.value })}>
                <option value="">Choose a product</option>
                {products.filter((p) => p.stock > 0).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {money(p.price)} · {p.stock} in stock</option>
                ))}
              </select>
            </label>
            <label>Quantity
              <input required type="number" min="1" step="1" value={orderForm.quantity}
                onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })} />
            </label>
            {(() => {
              const selected = products.find((p) => String(p.id) === orderForm.productId);
              return selected && (
                <div className="order-preview">
                  <span>Estimated total</span>
                  <strong>{money(Number(selected.price) * Number(orderForm.quantity || 0))}</strong>
                </div>
              );
            })()}
            <p className="form-hint">The backend verifies stock availability before accepting this order.</p>
            <div className="modal-actions">
              <button type="button" className="button button-secondary" onClick={() => setModal("")}>Cancel</button>
              <button className="button button-primary" disabled={saving || products.every((p) => p.stock <= 0)}>
                {saving ? "Placing order..." : "Place order"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, note, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>
        <div className="stat-icon"><Icon size={19} strokeWidth={1.8} /></div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-note"><span className="note-dot" />{note}</div>
    </div>
  );
}

function StockBadge({ stock }) {
  if (stock === 0) return <span className="badge badge-out">Out of stock</span>;
  if (stock <= 5) return <span className="badge badge-low">Low stock</span>;
  return <span className="badge badge-in">In stock</span>;
}

function ProductTable({ products, onEdit, onDelete, compact = false }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>PRODUCT</th>
            {!compact && <th>ID</th>}
            <th>PRICE</th>
            <th>STOCK</th>
            <th>STATUS</th>
            <th className="actions-column">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="table-product">
                  <div className={`product-initial initial-${Number(p.id) % 4}`}>
                    {p.name?.charAt(0)?.toUpperCase() || "P"}
                  </div>
                  <div><strong>{p.name}</strong><span>Product catalogue</span></div>
                </div>
              </td>
              {!compact && <td className="muted-cell">#{p.id}</td>}
              <td className="price-cell">{money(p.price)}</td>
              <td><strong className="stock-number">{p.stock}</strong></td>
              <td><StockBadge stock={Number(p.stock)} /></td>
              <td>
                <div className="row-actions">
                  <button className="row-action" title="Edit product" onClick={() => onEdit(p)}><Pencil size={15} /></button>
                  <button className="row-action row-delete" title="Delete product" onClick={() => onDelete(p)}><Trash2 size={15} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderTable({ orders, onCancel }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>ORDER</th>
            <th>PRODUCT</th>
            <th>QUANTITY</th>
            <th>TOTAL</th>
            <th>STATUS</th>
            <th className="actions-column">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td><strong className="order-number">#{o.id}</strong><span className="cell-subtext">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "—"}</span></td>
              <td>
                <div className="table-product">
                  <div className="product-initial initial-2">{o.product?.name?.charAt(0)?.toUpperCase() || "P"}</div>
                  <div><strong>{o.product?.name || `Product #${o.product?.id || "—"}`}</strong><span>Catalogue item</span></div>
                </div>
              </td>
              <td>{o.quantity}</td>
              <td className="price-cell">{money(o.totalPrice)}</td>
              <td>
                <span className={`badge ${o.status === "PLACED" ? "badge-in" : "badge-cancelled"}`}>
                  <span className="badge-dot" />{o.status === "PLACED" ? "Placed" : "Cancelled"}
                </span>
              </td>
              <td>
                {o.status === "PLACED" ? (
                  <button className="cancel-button" onClick={() => onCancel(o)}>Cancel order</button>
                ) : <span className="muted-cell">No action</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="empty-state"><div className="empty-icon"><Package size={23} /></div><p>{text}</p></div>;
}

export default App;

