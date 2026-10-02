'use client';

import { useEffect, useState } from 'react';

const categories = ['Clothes', 'Perfumes', 'Slippers', 'Sneakers', 'Accessories'];
const statuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const empty = {
  name: '',
  category: 'Clothes',
  price: '',
  stock: '',
  sizes: '',
  description: '',
  image: '',
};

const money = (value) => `₦${Number(value || 0).toLocaleString()}`;

export default function Admin() {
  const [authed, setAuthed] = useState(null);
  const [login, setLogin] = useState({ email: '', password: '' });
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [zones, setZones] = useState([]);
  const [zoneForm, setZoneForm] = useState({ name: '', fee: '' });

  const load = async () => {
    try {
      const [productsRes, ordersRes, zonesRes] = await Promise.all([
        fetch('/api/products', { cache: 'no-store' }),
        fetch('/api/orders/admin', { cache: 'no-store' }),
        fetch('/api/delivery-zones/admin', { cache: 'no-store' }),
      ]);

      if (productsRes.ok) setItems(await productsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (zonesRes.ok) setZones(await zonesRes.json());
    } catch {
      setMsg('Could not load store data.');
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((response) => response.json())
      .then((data) => {
        setAuthed(data.authenticated);

        if (data.authenticated) {
          load();
        }
      })
      .catch(() => setAuthed(false));
  }, []);

  const doLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMsg('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(login),
      });

      const data = await response.json();

      if (!response.ok) {
        setMsg(data.error || 'Login failed');
        return;
      }

      setAuthed(true);
      setLogin({ email: '', password: '' });
      await load();
    } catch {
      setMsg('Unable to connect to the server.');
    } finally {
      setBusy(false);
    }
  };

  const onImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMsg('Choose an image under 2MB.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((current) => ({
        ...current,
        image: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  const add = async (event) => {
    event.preventDefault();

    if (!form.name || !form.image) {
      setMsg('Product name and photo are required.');
      return;
    }

    setBusy(true);
    setMsg('');

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setMsg(data.error || 'Could not add product');
        return;
      }

      setItems((current) => [data, ...current]);
      setForm(empty);
      setMsg('Product added successfully.');
    } catch {
      setMsg('Unable to add product.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;

    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setItems((current) => current.filter((item) => item.id !== id));
      setMsg('Product deleted.');
    }
  };

  const updateStatus = async (id, status) => {
    const response = await fetch('/api/orders/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });

    if (response.ok) {
      setOrders((current) =>
        current.map((order) =>
          order.id === id ? { ...order, status } : order
        )
      );
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthed(false);
  };

  const addZone = async (event) => {
    event.preventDefault();

    const response = await fetch('/api/delivery-zones/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zoneForm),
    });

    if (response.ok) {
      setZoneForm({ name: '', fee: '' });
      await load();
    }
  };

  const deleteZone = async (id) => {
    if (!confirm('Delete this delivery zone?')) return;

    await fetch(`/api/delivery-zones/admin?id=${id}`, {
      method: 'DELETE',
    });

    await load();
  };

  if (authed === null) {
    return (
      <main className="adminPage">
        <div className="loginCard">Loading...</div>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="adminPage">
        <form className="loginCard" onSubmit={doLogin}>
          <img src="/images/logo.png" alt="Della's Closet" />

          <p className="eyebrow">PRIVATE STORE ADMIN</p>

          <h1>Manage your store</h1>

          <label>
            Email
            <input
              type="email"
              value={login.email}
              onChange={(event) =>
                setLogin({
                  ...login,
                  email: event.target.value,
                })
              }
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={login.password}
              onChange={(event) =>
                setLogin({
                  ...login,
                  password: event.target.value,
                })
              }
              required
            />
          </label>

          <button className="adminButton" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign in'}
          </button>

          {msg && <p className="adminMsg">{msg}</p>}

          <a className="back" href="/">
            ← Back to store
          </a>
        </form>
      </main>
    );
  }

  return (
    <main className="adminPage">
      <header className="adminTop">
        <a href="/" className="adminBrand">
          <img src="/images/logo.png" alt="" />
          <span>Della's Closet</span>
        </a>

        <div>
          <button className="reset" onClick={logout}>
            Sign out
          </button>{' '}
          <a href="/" className="back">
            View store →
          </a>
        </div>
      </header>

      <div className="adminWrap">
        <div className="adminIntro">
          <p className="eyebrow">STORE MANAGEMENT</p>
          <h1>Products, prices & orders</h1>
          <p>
            Add products, update inventory and manage customer orders from one
            place.
          </p>
        </div>

        <div className="adminGrid">
          <form className="adminCard" onSubmit={add}>
            <h2>Add product</h2>

            <label>
              Product name
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                placeholder="Luxury gown"
              />
            </label>

            <label>
              Category
              <select
                value={form.category}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category: event.target.value,
                  })
                }
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>

            <div className="two">
              <label>
                Price (₦)
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      price: event.target.value,
                    })
                  }
                  placeholder="12000"
                />
              </label>

              <label>
                Stock
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      stock: event.target.value,
                    })
                  }
                  placeholder="10"
                />
              </label>
            </div>

            <label>
              Sizes / colours
              <input
                value={form.sizes}
                onChange={(event) =>
                  setForm({
                    ...form,
                    sizes: event.target.value,
                  })
                }
                placeholder="S, M, L / Black, White"
              />
            </label>

            <label>
              Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Product photo
              <input
                type="file"
                accept="image/*"
                onChange={onImage}
              />
            </label>

            {form.image && (
              <img
                className="preview"
                src={form.image}
                alt="Preview"
              />
            )}

            <button className="adminButton" disabled={busy}>
              {busy ? 'Saving...' : 'Add product'}
            </button>

            {msg && <p className="adminMsg">{msg}</p>}
          </form>

          <div className="adminCard">
            <div className="listHead">
              <h2>Products ({items.length})</h2>
              <button className="reset" onClick={load}>
                Refresh
              </button>
            </div>

            <div className="adminProducts">
              {items.map((product) => (
                <div className="adminProduct" key={product.id}>
                  <img src={product.image} alt="" />

                  <div>
                    <strong>{product.name}</strong>
                    <span>
                      {product.category} •{' '}
                      {product.price == null
                        ? 'Price not set'
                        : money(product.price)}
                    </span>
                    <small>
                      Stock: {product.stock}
                      {product.sizes ? ` • ${product.sizes}` : ''}
                    </small>
                  </div>

                  <button
                    className="delete"
                    onClick={() => remove(product.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="ordersPanel">
          <div className="listHead">
            <div>
              <p className="eyebrow">DELIVERY</p>
              <h2>Delivery zones</h2>
            </div>
          </div>

          <form className="zoneForm" onSubmit={addZone}>
            <input
              placeholder="Zone e.g. Ado-Ekiti"
              value={zoneForm.name}
              onChange={(event) =>
                setZoneForm({
                  ...zoneForm,
                  name: event.target.value,
                })
              }
              required
            />

            <input
              type="number"
              min="0"
              placeholder="Fee ₦"
              value={zoneForm.fee}
              onChange={(event) =>
                setZoneForm({
                  ...zoneForm,
                  fee: event.target.value,
                })
              }
              required
            />

            <button className="adminButton">Add zone</button>
          </form>

          <div className="zoneList">
            {zones.map((zone) => (
              <div className="zoneRow" key={zone.id}>
                <span>{zone.name}</span>

                <strong>
                  ₦{Number(zone.fee).toLocaleString()}
                </strong>

                <button
                  className="delete"
                  onClick={() => deleteZone(zone.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="ordersPanel">
          <div className="listHead">
            <div>
              <p className="eyebrow">ORDER MANAGEMENT</p>
              <h2>Customer orders ({orders.length})</h2>
            </div>

            <button className="reset" onClick={load}>
              Refresh
            </button>
          </div>

          {orders.length ? (
            <div className="ordersList">
              {orders.map((order) => (
                <article className="orderCard" key={order.id}>
                  <div className="orderHead">
                    <div>
                      <strong>
                        #{order.id.slice(-8).toUpperCase()}
                      </strong>

                      <span>
                        {new Date(order.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <select
                      value={order.status}
                      onChange={(event) =>
                        updateStatus(order.id, event.target.value)
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div className="orderCustomer">
                    <strong>{order.customerName}</strong>

                    <span>
                      {order.phone}
                      {order.email ? ` • ${order.email}` : ''}
                    </span>

                    <span>
                      {order.address}, {order.city} •{' '}
                      {order.deliveryZone}
                    </span>

                    {order.latitude && order.longitude ? (
                      <a
                        className="gpsLink"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                      >
                        📍 Open GPS location
                      </a>
                    ) : (
                      <small className="muted">
                        GPS location not shared
                      </small>
                    )}
                  </div>

                  <div className="orderItems">
                    {order.items.map((item) => (
                      <span key={item.id}>
                        {item.name} × {item.quantity} —{' '}
                        {money(item.price * item.quantity)}
                      </span>
                    ))}
                  </div>

                  <div className="orderTotal">
                    <span>
                      Subtotal {money(order.subtotal)} + delivery{' '}
                      {money(order.deliveryFee)}
                    </span>

                    <strong>
                      Total {money(order.total)}
                    </strong>
                  </div>

                  {order.paymentProof && (
                    <div className="proofBox">
                      <strong>Payment receipt</strong>

                      <a
                        href={order.paymentProof}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={order.paymentProof}
                          alt="Customer payment receipt"
                          className="receiptPreview"
                        />
                      </a>

                      <small>
                        Open image to inspect the transfer receipt.
                      </small>
                    </div>
                  )}

                  {order.note && (
                    <small>Note: {order.note}</small>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">No orders yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}