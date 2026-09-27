const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gacha-infinite-backend.onrender.com/api/v1";

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

// Evita múltiplas chamadas de refresh simultâneas
let _refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem("ti_refresh_token");
      if (!refreshToken) return null;

      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      localStorage.setItem("ti_token", data.accessToken);
      if (data.refreshToken) localStorage.setItem("ti_refresh_token", data.refreshToken);
      return data.accessToken as string;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("ti_token") : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // Token expirado: tenta refresh e repete uma vez
  if (res.status === 401 && !isRetry && typeof window !== "undefined") {
    const newToken = await refreshAccessToken();
    if (newToken) return request<T>(path, options, true);

    // Refresh falhou: encerra sessão
    localStorage.removeItem("ti_token");
    localStorage.removeItem("ti_refresh_token");
    localStorage.removeItem("ti_user");
    window.location.replace("/login");
    throw new Error("Sessão expirada");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Erro desconhecido");
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { method: "GET", ...opts }),

  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { method: "POST", body, ...opts }),

  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { method: "PATCH", body, ...opts }),

  del: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { method: "DELETE", ...opts }),
};
