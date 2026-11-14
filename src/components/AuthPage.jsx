import { useState } from "react";
import { api } from "../utils/api.js";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function change(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body =
        mode === "login"
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password };
      const data = await api(path, { method: "POST", body });
      onAuth(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="panel auth-box" onSubmit={submit}>
        <div className="logo">₹</div>
        <h1>Expense Tracker</h1>
        <p className="hint">
          {mode === "login" ? "Welcome back! Log in to continue" : "Create your free account"}
        </p>
        <div className="perks">
          <span>📊 Smart charts</span>
          <span>🎯 Budgets</span>
          <span>📱 Use anywhere</span>
        </div>

        {mode === "signup" && (
          <label>
            Name
            <input type="text" value={form.name} onChange={(e) => change("name", e.target.value)} placeholder="Your name" />
          </label>
        )}

        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => change("email", e.target.value)} placeholder="you@example.com" />
        </label>

        <label>
          Password
          <input type="password" value={form.password} onChange={(e) => change("password", e.target.value)} placeholder="At least 6 characters" />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="primary" disabled={busy}>
          {busy ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
        </button>

        <button type="button" className="link" onClick={switchMode}>
          {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
        </button>
      </form>
    </div>
  );
}
