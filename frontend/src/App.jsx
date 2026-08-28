import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ConfirmSignup from "./pages/ConfirmSignup";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <Navbar onOpenCart={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/confirm" element={<ConfirmSignup />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <Footer />
    </>
  );
}
