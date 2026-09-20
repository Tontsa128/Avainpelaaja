const organizationId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (organizationId) headers.set("x-organization-id", organizationId);

  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "Pyyntö epäonnistui");
  }
  return payload as T;
}

export type ApiList<T> = { ok: true; data: T[] };

export const api = {
  sellers: () => request<ApiList<unknown>>("/api/sellers"),
  locations: () => request<ApiList<unknown>>("/api/locations"),
  bookings: () => request<ApiList<unknown>>("/api/bookings"),
  createSeller: (data: unknown) => request("/api/sellers", { method: "POST", body: JSON.stringify(data) }),
  createLocation: (data: unknown) => request("/api/locations", { method: "POST", body: JSON.stringify(data) }),
  createBooking: (data: unknown) => request("/api/bookings", { method: "POST", body: JSON.stringify(data) }),
};
