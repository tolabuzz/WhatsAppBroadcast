const STORAGE_KEY = "broadcast_account_email";

export function getAccountEmail(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export class ApiClientError extends Error {}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const email = getAccountEmail();
  if (!email) throw new ApiClientError("Not signed in.");

  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-account-email": email,
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse errors, use default message
    }
    throw new ApiClientError(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
