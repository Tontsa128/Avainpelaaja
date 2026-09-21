type ApiEnvelope<T> = { ok: true; data: T };

async function request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const organizationId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID ?? "";
  if (organizationId) headers.set("x-organization-id", organizationId);

  const response = await fetch(path, { ...init, headers, cache: "no-store" });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error ?? "Pyyntö epäonnistui");
  return payload as ApiEnvelope<T>;
}

export type ApiSeller = {
  id: string; name: string; phone?: string | null; email?: string | null;
  area?: string | null; active: boolean; targetPerShift: number;
};

export type ApiLocation = {
  id: string; name: string; city: string; address?: string | null;
  status: string; pricePerDay?: string | number | null; score?: string | number | null;
  contacts?: { id: string; name: string }[];
};

export type ApiBooking = {
  id: string; startsAt: string; endsAt: string; status: string;
  seller?: { id: string; name: string } | null;
  location?: { id: string; name: string } | null;
  standSpot?: string | null; notes?: string | null;
};

export type ApiCrmOpportunity = {
  id: string; name: string; city?: string | null; stage: string; nextAction: string;
  nextActionAt?: string | null; footfall?: number | null;
  dailyRate?: string | number | null; notes?: string | null;
  locationId?: string | null; contactId?: string | null; responsibleUserId?: string | null;
};

export type ApiTimeEntry = {
  id: string; sellerId: string; startedAt: string; endedAt?: string | null;
  breakMin: number; status: "OPEN" | "BREAK" | "CLOSED"; notes?: string | null;
  seller?: { id: string; name: string } | null;
  location?: { id: string; name: string; city: string } | null;
};

export type ApiSale = { id: string; sellerId: string; soldAt: string; quantity: number; locationName?: string | null; campaign?: string | null; notes?: string | null; seller?: { id: string; name: string } | null; };\n\nexport type DashboardSummary = {
  sellers: number; activeSellers: number; locations: number; bookings: number;
  confirmedBookings: number; sales: number; openCrm: number; hours: number;
};

export const api = {
  sellers: () => request<ApiSeller[]>("/api/sellers"),
  locations: () => request<ApiLocation[]>("/api/locations"),
  bookings: () => request<ApiBooking[]>("/api/bookings"),
  contacts: (locationId?: string) => request<unknown[]>(
    locationId ? `/api/contacts?locationId=${encodeURIComponent(locationId)}` : "/api/contacts"
  ),
  crmOpportunities: (stage?: string) => request<ApiCrmOpportunity[]>(
    stage ? `/api/crm/opportunities?stage=${encodeURIComponent(stage)}` : "/api/crm/opportunities"
  ),
  crmActivities: (opportunityId?: string, contactId?: string) => request<unknown[]>(
    `/api/crm/activities${opportunityId ? `?opportunityId=${encodeURIComponent(opportunityId)}` : contactId ? `?contactId=${encodeURIComponent(contactId)}` : ""}`
  ),
  dashboardSummary: () => request<DashboardSummary>("/api/dashboard/summary"),\n  sales: (sellerId?: string) => request<ApiSale[]>(sellerId ? `/api/sales?sellerId=${encodeURIComponent(sellerId)}` : "/api/sales"),\n  createSale: (data: unknown) => request<ApiSale>("/api/sales", { method: "POST", body: JSON.stringify(data) }),
  timeEntries: (sellerId?: string) => request<ApiTimeEntry[]>(
    sellerId ? `/api/time-entries?sellerId=${encodeURIComponent(sellerId)}` : "/api/time-entries"
  ),
  startShift: (sellerId: string, locationId?: string, notes?: string) =>
    request<ApiTimeEntry>("/api/time-entries", { method: "POST", body: JSON.stringify({ sellerId, locationId, action: "START", notes }) }),
  breakShift: (sellerId: string) =>
    request<ApiTimeEntry>("/api/time-entries", { method: "POST", body: JSON.stringify({ sellerId, action: "BREAK" }) }),
  resumeShift: (sellerId: string) =>
    request<ApiTimeEntry>("/api/time-entries", { method: "POST", body: JSON.stringify({ sellerId, action: "RESUME" }) }),
  endShift: (id: string, breakMin = 0, notes?: string) =>
    request<ApiTimeEntry>(`/api/time-entries/${id}`, { method: "PATCH", body: JSON.stringify({ action: "END", breakMin, notes }) }),
  createSeller: (data: unknown) => request<ApiSeller>("/api/sellers", { method: "POST", body: JSON.stringify(data) }),
  createLocation: (data: unknown) => request<ApiLocation>("/api/locations", { method: "POST", body: JSON.stringify(data) }),
  createBooking: (data: unknown) => request<ApiBooking>("/api/bookings", { method: "POST", body: JSON.stringify(data) }),
  createContact: (data: unknown) => request<unknown>("/api/contacts", { method: "POST", body: JSON.stringify(data) }),
  createCrmOpportunity: (data: unknown) => request<ApiCrmOpportunity>("/api/crm/opportunities", { method: "POST", body: JSON.stringify(data) }),
  updateCrmOpportunity: (id: string, data: unknown) => request<ApiCrmOpportunity>(`/api/crm/opportunities/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  createCrmActivity: (data: unknown) => request<unknown>("/api/crm/activities", { method: "POST", body: JSON.stringify(data) }),
};
