export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("presensiku_admin_token");
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("presensiku_admin_token", token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("presensiku_admin_token");
    localStorage.removeItem("presensiku_admin_user");
  }
}

export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("presensiku_admin_user");
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: any): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("presensiku_admin_user", JSON.stringify(user));
  }
}

export async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: string; data?: T; message?: string; error?: string }> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => ({
    status: "error",
    error: `HTTP ${res.status}: Gagal memproses respon server`,
  }));

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      clearAuthToken();
    }
    throw new Error(json.error || `Terjadi kesalahan (Kode: ${res.status})`);
  }

  return json;
}
