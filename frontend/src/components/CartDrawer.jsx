import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function CartDrawer({ open, onClose }) {
  const { items, updateQty, removeItem, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!open) return null;

  function handleCheckout() {
    onClose();
    navigate(user ? "/checkout" : "/login");
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-head">
          <h3>Your order</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        {items.length === 0 ? (
          <p className="empty-state">Your cart is empty. Add something delicious.</p>
        ) : (
          <div style={{ flex: 1, overflowY: "auto" }}>
            {items.map((i) => (
              <div className="cart-item" key={i.id}>
                <div>
                  <div className="cart-item-name">{i.name}</div>
                  <div style={{ color: "var(--cream-dim)", fontSize: "0.82rem" }}>₹{i.price} each</div>
                </div>
                <div className="qty-controls">
                  <button onClick={() => updateQty(i.id, i.qty - 1)}>−</button>
                  <span>{i.qty}</span>
                  <button onClick={() => updateQty(i.id, i.qty + 1)}>+</button>
                  <button onClick={() => removeItem(i.id)} aria-label={`Remove ${i.name}`}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="cart-total">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
        <button className="btn btn-primary" disabled={items.length === 0} onClick={handleCheckout} style={{ width: "100%" }}>
          {user ? "Checkout" : "Sign in to checkout"}
        </button>
      </aside>
    </>
  );
}
