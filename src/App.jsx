 import { useState } from "react";
import AuthPage from "./components/AuthPage.jsx";
import Tracker from "./Tracker.jsx";
import { clearSession, getSavedUser, saveSession } from "./utils/api.js";

export default function App() {
  const [user, setUser] = useState(getSavedUser());

  function handleAuth(token, u) {
    saveSession(token, u);
    setUser(u);
  }

  function handleLogout() {
    clearSession();
    setUser(null);
  }

  if (!user) return <AuthPage onAuth={handleAuth} />;
  return <Tracker user={user} onLogout={handleLogout} />;
}