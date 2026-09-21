const organizationId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (organizationId) headers.set("x-organization-id", organizationId);

  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error ?? "Pyyntö epäonnistui");
  return payload as T;
}

export type ApiSeller = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  area?: string | null;
  active: boolean;
};

export type ApiLocation = {
  id: string;
  name: string;
  city: string;
  address?: string | null;
  status: string;
};

export type ApiCrmOpportunity = {
  id: string;
  name: string;
  city?: string | null;
  stage: string;
  nextAction: string;
  nextActionAt?: string | null;
  footfall?: number | null;
  dailyRate?: string | number | null;
  notes?: string | null;
  locationId?: string | null;
  contactId?: string | null;
  responsibleUserId?: string | null;
};

export const api = {
  sellers: () => request<ApiSeller[]>("/api/sellers"),
  locations: () => request<ApiLocation[]>("/api/locations"),
  bookings: () => request<unknown[]>("/api/bookings"),
  contacts: (locationId?: string) =>
    request<unknown[]>(locationId ? `/api/contacts?locationId=${encodeURIComponent(locationId)}` : "/api/contacts"),
  crmOpportunities: (stage?: string) =>
    request<ApiCrmOpportunity[]>(
      stage ? `/api/crm/opportunities?stage=${encodeURIComponent(stage)}` : "/api/crm/opportunities",
    ),
  crmActivities: (opportunityId?: string) =>
    request<unknown[]>(
      opportunityId
        ? `/api/crm/activities?opportunityId=${encodeURIComponent(opportunityId)}`
        : "/api/crm/activities",
    ),
  createSeller: (data: unknown) => request("/api/sellers", { method: "POST", body: JSON.stringify(data) }),
  createLocation: (data: unknown) => request("/api/locations", { method: "POST", body: JSON.stringify(data) }),
  createBooking: (data: unknown) => request("/api/bookings", { method: "POST", body: JSON.stringify(data) }),
  createContact: (data: unknown) => request("/api/contacts", { method: "POST", body: JSON.stringify(data) }),
  createCrmOpportunity: (data: unknown) =>
    request("/api/crm/opportunities", { method: "POST", body: JSON.stringify(data) }),
  updateCrmOpportunity: (id: string, data: unknown) =>
    request(`/api/crm/opportunities/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  createCrmActivity: (data: unknown) =>
    request("/api/crm/activities", { method: "POST", body: JSON.stringify(data) }),
};
