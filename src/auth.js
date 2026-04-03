const TOKEN_KEY = "admin_dashboard_token";
const USER_KEY = "admin_dashboard_user";

export function saveSession(session) {
  localStorage.setItem(TOKEN_KEY, session.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(session));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getSavedUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
