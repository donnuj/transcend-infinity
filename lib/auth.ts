"use client";

const USER_KEY = "ti_user";
const SESSION_COOKIE = "ti_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 dias

export type StoredUser = {
  id: string;
  username: string;
  email: string;
  level: number;
};

// Access token kept in memory only — not persisted to localStorage or cookies.
// On page reload the token starts as null; the first 401 triggers a refresh via
// the httpOnly refresh_token cookie, which repopulates it transparently.
let _accessToken: string | null = null;

export function saveSession(token: string, user: StoredUser) {
  _accessToken = token;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${SESSION_MAX_AGE}; secure; samesite=strict`;
}

export function setToken(token: string) {
  _accessToken = token;
}

export function clearSession() {
  _accessToken = null;
  localStorage.removeItem(USER_KEY);
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
  // refresh_token é httpOnly — não acessível aqui; o backend limpa via /auth/logout
}

export function getToken(): string | null {
  return _accessToken;
}

export function getUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${SESSION_COOKIE}=1`);
}
