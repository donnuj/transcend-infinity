"use client";

const TOKEN_KEY = "ti_token";
const USER_KEY  = "ti_user";

export type StoredUser = {
  id: string;
  username: string;
  email: string;
  level: number;
};

const SESSION_COOKIE = "ti_session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 dias

export function saveSession(token: string, user: StoredUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${SESSION_MAX_AGE}; secure; samesite=strict`;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
  // refresh_token é httpOnly — não acessível aqui; o backend limpa via /auth/logout
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
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
  return !!getToken();
}
