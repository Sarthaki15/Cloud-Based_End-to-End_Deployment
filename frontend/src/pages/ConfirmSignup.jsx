import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ConfirmSignup() {
  const { confirmSignUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await confirmSignUp(email, code);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Invalid or expired code.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>Verify your email</h2>
        <p className="sub">Enter the 6-digit code Cognito emailed to you.</p>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">Verified! Redirecting to sign in…</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="code">Verification code</label>
            <input id="code" required value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
            {submitting ? "Verifying…" : "Verify account"}
          </button>
        </form>
      </div>
    </div>
  );
}
