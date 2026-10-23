import { API_URL } from "./config";

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setToken(token: string | null) {
  authToken = token;
}

// App.tsx registers a function here so we can log out when the token is rejected
export function setOnUnauthorized(handler: (() => void) | null) {
  onUnauthorized = handler;
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

  // Logged in, but the server rejected our token (expired or invalid) -> log out
  if (res.status === 401 && authToken) {
    onUnauthorized?.();
  }

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

// Upload a receipt photo for a loan.
// Uses XMLHttpRequest because Expo's fetch doesn't support
// React Native-style file parts ({ uri, name, type }) in FormData.
export function uploadReceipt(
  loanId: string,
  image: { uri: string; mimeType?: string | null; fileName?: string | null }
): Promise<void> {
  const form = new FormData();
  form.append("receipt", {
    uri: image.uri,
    name: image.fileName ?? "receipt.jpg",
    type: image.mimeType ?? "image/jpeg",
  } as unknown as Blob);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/loans/${loanId}/receipt`);
    if (authToken) xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);

    xhr.onload = () => {
      let data: { error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}

      if (xhr.status === 401 && authToken) onUnauthorized?.();

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(data.error ?? `Upload failed (${xhr.status})`));
      }
    };

    // Phone couldn't reach the server at all
    xhr.onerror = () => reject(new TypeError("Network request failed"));

    xhr.send(form);
  });
}

// "/uploads/abc.jpg" -> "http://192.168.1.13:3000/uploads/abc.jpg"
export function receiptImageUrl(path: string): string {
  return `${API_URL}${path}`;
}

// Turns any error into a message we can show the user
export function errorMessage(e: unknown): string {
  if (e instanceof TypeError) return "Can't reach the server. Check your connection.";
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}