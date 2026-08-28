import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar({ onOpenCart }) {
  const { user, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark">◐</span> The Roasted Leaf
        </NavLink>

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Home</NavLink>
          <NavLink to="/menu" className={({ isActive }) => (isActive ? "active" : "")}>Menu</NavLink>
          {user && <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : "")}>My Orders</NavLink>}
        </nav>

        <div className="nav-actions">
          <button className="icon-btn" onClick={onOpenCart} aria-label="Open cart">
            🛍
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>

          {user ? (
            <button className="btn btn-ghost" onClick={() => { signOut(); navigate("/"); }}>
              Sign out
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate("/login")}>
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
