/**
 * HTTP adapter — one namespace per backend phase.
 *
 * B0: auth.*
 * B1: products.*, categories.*, cart.*, orders.*, payments.*, uploads.*
 * B2: studio.custom, studio.quotes, studio.production, studio.people,
 *     studio.content, studio.appointments, studio.leads, studio.tickets,
 *     studio.notifications, studio.audit, studio.settings, studio.overview
 *
 * Active when VITE_API_URL is set in .env.local.
 * db.client.ts delegates per-namespace when HTTP_ENABLED is true.
 */

const BASE = import.meta.env.VITE_API_URL as string | undefined;

export const HTTP_ENABLED = Boolean(BASE);

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = status === 403 ? "ForbiddenError" : "ApiError";
    this.status = status;
  }
}

async function api<T = unknown>(
  path: string,
  { method = "GET", body }: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((data as { error?: string }).error ?? "Request failed", res.status);
  }
  return data as T;
}

// ─── B0 — Auth ───────────────────────────────────────────────────────────────

export interface HttpUser {
  id: string;
  email: string;
  role: string;
  name: string;
  firstName?: string;
  navSections: string[];
  mustChangePassword: boolean;
}

interface AuthResponse {
  user: HttpUser;
  accessToken?: string;
}

export const httpAuth = {
  async login(email: string, password: string): Promise<HttpUser> {
    const data = await api<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    return data.user;
  },

  async register(input: {
    email: string;
    password: string;
    name: string;
    firstName: string;
    lastName?: string;
    phone: string;
    city?: string;
    gender?: string;
    address?: string;
    birthDay?: number;
    birthMonth?: number;
    preferredFit?: string;
  }): Promise<HttpUser> {
    const data = await api<AuthResponse>("/auth/register", {
      method: "POST",
      body: input,
    });
    return data.user;
  },

  async me(): Promise<HttpUser | null> {
    try {
      const data = await api<{ user: HttpUser }>("/auth/me");
      return data.user;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  },

  async logout(): Promise<void> {
    await api("/auth/logout", { method: "POST" });
  },

  async refresh(): Promise<HttpUser | null> {
    try {
      const data = await api<AuthResponse>("/auth/refresh", { method: "POST" });
      return data.user;
    } catch {
      return null;
    }
  },

  async forgotPassword(email: string): Promise<void> {
    await api("/auth/forgot", { method: "POST", body: { email } });
  },

  async resetPassword(userId: string, token: string, password: string): Promise<void> {
    await api("/auth/reset", { method: "POST", body: { userId, token, password } });
  },

  async changePassword(current: string, next: string): Promise<void> {
    await api("/auth/change-password", { method: "POST", body: { current, next } });
  },
};

// ─── B1 — Products ────────────────────────────────────────────────────────────

export const httpProducts = {
  async list(params: { category?: string; q?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.q) qs.set("q", params.q);
    const data = await api<{ products: unknown[] }>(`/products?${qs}`);
    return data.products;
  },
  async get(sku: string) {
    const data = await api<{ product: unknown }>(`/products/${sku}`);
    return data.product;
  },
};

export const httpCategories = {
  async list() {
    const data = await api<{ categories: unknown[] }>("/categories");
    return data.categories;
  },
};

export const httpSettings = {
  async get() {
    const data = await api<{ settings: unknown }>("/settings");
    return data.settings;
  },
};

// ─── B1 — Cart ────────────────────────────────────────────────────────────────

export const httpCart = {
  async get() {
    const data = await api<{ cart: unknown }>("/cart");
    return data.cart;
  },
  async addLine(line: {
    productId: string;
    variantId?: string;
    kind?: "rtw" | "mtm";
    fabricId?: string;
    measurementProfileId?: string;
    qty?: number;
  }) {
    const data = await api<{ cart: unknown }>("/cart/lines", { method: "POST", body: line });
    return data.cart;
  },
  async removeLine(lineId: string) {
    await api(`/cart/lines/${lineId}`, { method: "DELETE" });
  },
  async clear() {
    await api("/cart", { method: "DELETE" });
  },
};

// ─── B1 — Orders ──────────────────────────────────────────────────────────────

export const httpOrders = {
  async place(payload: {
    lines: { productId: string; variantId?: string; kind?: "rtw" | "mtm"; qty?: number }[];
    customer: { name: string; email: string; phone?: string };
    fulfillment?: "pickup_ibadan" | "delivery";
    address?: string;
    couponCode?: string;
  }) {
    return api<{ orderId: string; orderNumber: string; totalKobo: number; depositKobo: number; needsLogin?: boolean }>(
      "/orders",
      { method: "POST", body: payload },
    );
  },
  async list(params: { status?: string; page?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    const data = await api<{ orders: unknown[] }>(`/orders?${qs}`);
    return data.orders;
  },
  async get(id: string) {
    const data = await api<{ order: unknown }>(`/orders/${id}`);
    return data.order;
  },
  async track(number: string) {
    const data = await api<{ order: unknown }>(`/orders/track/${number}`);
    return data.order;
  },
};

// ─── B1 — Payments ────────────────────────────────────────────────────────────

export const httpPayments = {
  async initializePaystack(orderId: string, type: "deposit" | "balance" | "full" = "full") {
    return api<{ accessCode: string; reference: string; amountKobo: number }>(
      "/payments/paystack/initialize",
      { method: "POST", body: { orderId, type } },
    );
  },
  async verifyPaystack(reference: string) {
    return api<{ status: string }>(`/payments/paystack/verify/${reference}`);
  },
  async submitTransfer(payload: { orderId: string; transactionNumber?: string; receiptUrl?: string; type?: "deposit" | "balance" | "full" }) {
    return api("/payments/transfer", { method: "POST", body: payload });
  },
  async list() {
    const data = await api<{ payments: unknown[] }>("/payments");
    return data.payments;
  },
  async approve(id: string) {
    await api(`/payments/${id}/approve`, { method: "PATCH" });
  },
  async reject(id: string, reason?: string) {
    await api(`/payments/${id}/reject`, { method: "PATCH", body: { reason } });
  },
};

// ─── B2 — Studio: Custom requests ─────────────────────────────────────────────

export const httpCustom = {
  async listRequests() {
    const data = await api<{ requests: unknown[] }>("/studio/custom");
    return data.requests;
  },
  async updateRequestStatus(id: string, status: "new" | "quoted" | "closed") {
    await api(`/studio/custom/${id}`, { method: "PATCH", body: { status } });
  },
};

// ─── B2 — Studio: Quotations ──────────────────────────────────────────────────

export const httpQuotations = {
  async list() {
    const data = await api<{ quotations: unknown[] }>("/studio/quotes");
    return data.quotations;
  },
  async create(payload: { customerId: string; requestId?: string; description: string; totalKobo: number; depositKobo: number }) {
    return api<{ id: string; number: string }>("/studio/quotes", { method: "POST", body: payload });
  },
  async revise(id: string, patch: { description?: string; totalKobo?: number; depositKobo?: number }) {
    await api(`/studio/quotes/${id}`, { method: "PATCH", body: patch });
  },
  async accept(id: string) {
    await api(`/studio/quotes/${id}/accept`, { method: "POST" });
  },
  async reject(id: string) {
    await api(`/studio/quotes/${id}/reject`, { method: "POST" });
  },
};

// ─── B2 — Studio: Production ──────────────────────────────────────────────────

export const httpProduction = {
  async list() {
    const data = await api<{ production: unknown[] }>("/studio/production");
    return data.production;
  },
  async advance(id: string, toStage: string) {
    await api(`/studio/production/${id}/advance`, { method: "POST", body: { toStage } });
  },
};

// ─── B2 — Studio: People ──────────────────────────────────────────────────────

export const httpPeople = {
  async listStaff() {
    const data = await api<{ staff: unknown[] }>("/studio/people");
    return data.staff;
  },
  async hire(payload: { email: string; name: string; firstName: string; phone: string; role: string; department?: string; jobTitle?: string }) {
    return api<{ id: string }>("/studio/people/hire", { method: "POST", body: payload });
  },
  async setNav(userId: string, sections: string[]) {
    await api(`/studio/staff/${userId}/nav`, { method: "PATCH", body: { sections } });
  },
};

// ─── B2 — Studio: Appointments ────────────────────────────────────────────────

export const httpAppointments = {
  async list() {
    const data = await api<{ appointments: unknown[] }>("/studio/appointments");
    return data.appointments;
  },
  async setStatus(id: string, status: string) {
    await api(`/studio/appointments/${id}/status`, { method: "PATCH", body: { status } });
  },
};

// ─── B2 — Studio: Leads ───────────────────────────────────────────────────────

export const httpLeads = {
  async list() {
    const data = await api<{ leads: unknown[] }>("/studio/leads");
    return data.leads;
  },
  async claim(id: string, opts: { openTicket?: boolean } = {}) {
    return api<{ ok: boolean; orderNumber?: string }>(`/studio/leads/${id}/claim`, { method: "POST", body: opts });
  },
};

// ─── B2 — Studio: Notifications ───────────────────────────────────────────────

export const httpNotifications = {
  async listMine() {
    const data = await api<{ notifications: unknown[] }>("/studio/notifications");
    return data.notifications;
  },
  async markRead(id: string) {
    await api(`/studio/notifications/${id}/read`, { method: "PATCH" });
  },
  async markAllRead() {
    await api("/studio/notifications/read-all", { method: "PATCH" });
  },
};

// ─── B2 — Studio: Audit log ───────────────────────────────────────────────────

export const httpAudit = {
  async list() {
    const data = await api<{ logs: unknown[] }>("/studio/audit");
    return data.logs;
  },
};

// ─── B2 — Studio: Settings ────────────────────────────────────────────────────

export const httpStudioSettings = {
  async get() {
    const data = await api<{ settings: unknown }>("/studio/settings");
    return data.settings;
  },
  async update(patch: Record<string, unknown>) {
    await api("/studio/settings", { method: "PATCH", body: patch });
  },
};

// ─── B2 — Studio: Overview ────────────────────────────────────────────────────

import type { StudioOverview } from "@/db/types";

export const httpOverview = {
  async get() {
    return api<StudioOverview>("/studio/overview");
  },
};

// ─── B1/B2 — Uploads ──────────────────────────────────────────────────────────

export const httpUploads = {
  async upload(file: File, folder: "receipts" | "looks" | "events" = "receipts") {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE}/uploads?folder=${folder}`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error((d as { error?: string }).error ?? "Upload failed");
    }
    return res.json() as Promise<{ url: string; publicId: string }>;
  },
};

// ─── Public content (used even without API_URL = off) ─────────────────────────

// ─── B3 — Traffic (super admin) ───────────────────────────────────────────────

export const httpTraffic = {
  async report(range: "today" | "7d" | "30d" | "all" = "30d") {
    const data = await api<{ report: unknown }>(`/studio/traffic?range=${range}`);
    return data.report;
  },
};

// ─── Public content (used even without API_URL = off) ─────────────────────────

export const httpContent = {
  async homepage() {
    const data = await api<{ homepage: unknown }>("/homepage");
    return data.homepage;
  },
  async journal() {
    const data = await api<{ posts: unknown[] }>("/journal");
    return data.posts;
  },
  async events() {
    const data = await api<{ events: unknown[] }>("/events");
    return data.events;
  },
  async event(slug: string) {
    const data = await api<{ event: unknown }>(`/events/${slug}`);
    return data.event;
  },
};
