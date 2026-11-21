import { useState } from "react";
import { api } from "../utils/api.js";

const TITLES = {
  login: "Welcome back! Log in to continue",
  signup: "Create your free account",
  verify: "Check your email for the code",
  forgot: "Forgot your password?",
  reset: "Set a new password",
};

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", code: "", newPassword: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function change(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function go(nextMode, message = "") {
    setMode(nextMode);
    setError("");
    setNotice(message);
  }

  async function call(path, body) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      return await api(path, { method: "POST", body });
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();

    if (mode === "login") {
      const data = await call("/api/auth/login", { email: form.email, password: form.password });
      if (data) onAuth(data.token, data.user);
    }

    if (mode === "signup") {
      const data = await call("/api/auth/signup/request", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      if (data) {
        setForm((prev) => ({ ...prev, code: "" }));
        go("verify", data.message);
      }
    }

    if (mode === "verify") {
      const data = await call("/api/auth/signup/verify", { email: form.email, code: form.code });
      if (data) onAuth(data.token, data.user);
    }

    if (mode === "forgot") {
      const data = await call("/api/auth/forgot", { email: form.email });
      if (data) {
        setForm((prev) => ({ ...prev, code: "", newPassword: "" }));
        go("reset", data.message);
      }
    }

    if (mode === "reset") {
      const data = await call("/api/auth/reset", {
        email: form.email,
        code: form.code,
        newPassword: form.newPassword,
      });
      if (data) {
        setForm((prev) => ({ ...prev, password: "", code: "", newPassword: "" }));
        go("login", data.message);
      }
    }
  }

  async function resendSignupCode() {
    const data = await call("/api/auth/signup/resend", { email: form.email });
    if (data) setNotice(data.message);
  }

  async function resendResetCode() {
    const data = await call("/api/auth/forgot", { email: form.email });
    if (data) setNotice(data.message);
  }

  const buttonText = {
    login: "Log in",
    signup: "Send verification code",
    verify: "Verify and create account",
    forgot: "Send reset code",
    reset: "Change password",
  }[mode];

  return (
    <div className="auth-wrap">
      <form className="panel auth-box" onSubmit={submit}>
        <div className="logo">₹</div>
        <h1>Expense Tracker</h1>
        <p className="hint">{TITLES[mode]}</p>

        {(mode === "login" || mode === "signup") && (
          <div className="perks">
            <span>📊 Smart charts</span>
            <span>🎯 Budgets</span>
            <span>📱 Use anywhere</span>
          </div>
        )}

        {mode === "signup" && (
          <label>
            Name
            <input type="text" value={form.name} onChange={(e) => change("name", e.target.value)} placeholder="Your name" />
          </label>
        )}

        {(mode === "login" || mode === "signup" || mode === "forgot") && (
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => change("email", e.target.value)} placeholder="you@example.com" />
          </label>
        )}

        {(mode === "verify" || mode === "reset") && (
          <p className="sent-to">Code sent to <strong>{form.email}</strong></p>
        )}

        {(mode === "login" || mode === "signup") && (
          <label>
            Password
            <input type="password" value={form.password} onChange={(e) => change("password", e.target.value)} placeholder="At least 6 characters" />
          </label>
        )}

        {(mode === "verify" || mode === "reset") && (
          <label>
            6-digit code
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="code-input"
              value={form.code}
              onChange={(e) => change("code", e.target.value.replace(/\D/g, ""))}
              placeholder="------"
            />
          </label>
        )}

        {mode === "reset" && (
          <label>
            New password
            <input type="password" value={form.newPassword} onChange={(e) => change("newPassword", e.target.value)} placeholder="At least 6 characters" />
          </label>
        )}

        {notice && <p className="notice">{notice}</p>}
        {error && <p className="error">{error}</p>}

        <button type="submit" className="primary" disabled={busy}>
          {busy ? "Please wait..." : buttonText}
        </button>

        {mode === "login" && (
          <>
            <button type="button" className="link" onClick={() => go("forgot")}>Forgot password?</button>
            <button type="button" className="link" onClick={() => go("signup")}>New here? Create an account</button>
          </>
        )}

        {mode === "signup" && (
          <button type="button" className="link" onClick={() => go("login")}>Already have an account? Log in</button>
        )}

        {mode === "verify" && (
          <>
            <button type="button" className="link" onClick={resendSignupCode} disabled={busy}>Send the code again</button>
            <button type="button" className="link" onClick={() => go("signup")}>Wrong email? Go back</button>
          </>
        )}

        {mode === "forgot" && (
          <button type="button" className="link" onClick={() => go("login")}>Back to log in</button>
        )}

        {mode === "reset" && (
          <>
            <button type="button" className="link" onClick={resendResetCode} disabled={busy}>Send the code again</button>
            <button type="button" className="link" onClick={() => go("login")}>Back to log in</button>
          </>
        )}
      </form>
    </div>
  );
}
