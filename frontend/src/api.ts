export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const TIMEOUT_MS = 45000; // 45s så den inte hänger för evigt

export function setToken(token: string | null) {
  if (token) localStorage.setItem("tm_token", token);
  else localStorage.removeItem("tm_token");
}

export function getToken(): string | null {
  return localStorage.getItem("tm_token");
}

function buildHeaders(opts: RequestInit) {
  const headers = new Headers(opts.headers);

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return headers;
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers = buildHeaders(opts);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...opts,
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status} ${res.statusText}: ${text}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return {} as T;
    }

    return (await res.json()) as T;
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error(
        `Request timeout. Om du använder Render Free kan servern ha spunnit ner. Öppna ${API_BASE_URL}/health i browsern och testa igen.`
      );
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export const apiGet = <T,>(path: string) => request<T>(path);

export const apiPostJson = <T,>(path: string, body?: unknown) =>
  request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

// Alias så att sidor kan importera apiPost (som vi använde i TripDetail.tsx)
export const apiPost = apiPostJson;

// FastAPI OAuth2PasswordRequestForm kräver x-www-form-urlencoded
export const apiPostForm = <T,>(path: string, form: Record<string, string>) => {
  const params = new URLSearchParams();
  Object.entries(form).forEach(([k, v]) => params.append(k, v));

  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
};

export async function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

// --- Typer vi återanvänder i pages ---
export type UserRole = "DRIVER" | "COMPANY";
export type Me = { id: number; name: string; email: string; role: UserRole };

export type TripStatus = "OPEN" | "RESERVED" | "COMPLETED" | "CANCELLED";

export type Trip = {
  id: number;
  origin: string;
  destination: string;
  date: string | null;
  time_window: string | null;
  compensation_sek: number;
  vehicle_info: string | null;
  status: TripStatus;
};

export type UserPublic = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type TripDetail = {
  trip: Trip;
  reserved_driver: UserPublic | null;
};