import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../aws-config";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState(false);

  async function placeOrder() {
    setError("");
    setPlacing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
          notes,
        }),
      });
      if (!res.ok) throw new Error("Order could not be placed");
      setPlaced(true);
      clearCart();
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0 && !placed) {
    return (
      <section className="section container">
        <p className="empty-state">Your cart is empty. Add something from the menu first.</p>
      </section>
    );
  }

  return (
    <section className="section container" style={{ maxWidth: 560 }}>
      <div className="section-head">
        <div>
          <span className="eyebrow">Almost there</span>
          <h2>Review your order</h2>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}
      {placed && <div className="form-success">Order placed! Taking you to your history…</div>}

      {items.map((i) => (
        <div className="cart-item" key={i.id}>
          <span>{i.qty} × {i.name}</span>
          <span>₹{i.price * i.qty}</span>
        </div>
      ))}
      <div className="cart-total">
        <span>Total</span>
        <span>₹{total}</span>
      </div>

      <div className="field">
        <label htmlFor="notes">Notes for the barista (optional)</label>
        <input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Oat milk, less sugar…" />
      </div>

      <button className="btn btn-primary" style={{ width: "100%" }} onClick={placeOrder} disabled={placing || placed}>
        {placing ? "Placing order…" : "Confirm and pay at counter"}
      </button>
    </section>
  );
}
