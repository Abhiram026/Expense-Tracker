const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function getToken() {
  return localStorage.getItem("et_token");
}

export function saveSession(token, user) {
  localStorage.setItem("et_token", token);
  localStorage.setItem("et_user", JSON.stringify(user));
}

export function getSavedUser() {
  try {
    return getToken() ? JSON.parse(localStorage.getItem("et_user")) : null;
  } catch (err) {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("et_token");
  localStorage.removeItem("et_user");
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error("Cannot reach the server. Check your internet or try again in a minute.");
  }

  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }

  if (!res.ok) {
    const error = new Error((data && data.message) || "Something went wrong");
    error.status = res.status;
    throw error;
  }
  return data;
}