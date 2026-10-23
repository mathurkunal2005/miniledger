import { API_URL } from "./config";

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
}

type Options = { method?: string; body?: unknown };

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

// Turns any error into a message we can show the user
export function errorMessage(e: unknown): string {
  if (e instanceof TypeError) return "Can't reach the server. Check your connection.";
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}
