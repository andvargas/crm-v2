const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string; error?: { message?: string } } | null;
    if (response.status === 401 && typeof window !== "undefined" && token) {
      localStorage.removeItem("crm_token");
      localStorage.removeItem("crm_user");
      window.dispatchEvent(new Event("crm-auth-changed"));
    }
    throw new ApiError(response.status, payload?.error?.message ?? payload?.message ?? "Something went wrong");
  }
  return response.json() as Promise<T>;
}
