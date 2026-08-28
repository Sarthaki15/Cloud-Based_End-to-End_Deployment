import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../aws-config";

export default function Profile() {
  const { user, accessToken } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/orders`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error("Could not load orders");
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (accessToken) load();
  }, [accessToken]);

  return (
    <section className="section container">
      <div className="section-head">
        <div>
          <span className="eyebrow">Signed in as {user?.username}</span>
          <h2>Order history</h2>
        </div>
      </div>

      {loading && <p className="empty-state">Loading your orders…</p>}
      {error && <p className="empty-state">{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p className="empty-state">No orders yet — your history will show up here.</p>
      )}

      {orders.map((o) => (
        <div className="menu-card" key={o.orderId} style={{ marginBottom: 14 }}>
          <div className="menu-card-top">
            <h3>Order #{o.orderId.slice(0, 8)}</h3>
            <span className="badge popular">{o.status}</span>
          </div>
          <p className="desc">{new Date(o.createdAt).toLocaleString()}</p>
          <p className="desc">{o.items.map((i) => `${i.qty}× ${i.id}`).join(", ")}</p>
        </div>
      ))}
    </section>
  );
}
