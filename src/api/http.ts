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

import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "./tokenStore";

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

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Requested-With": "XMLHttpRequest",
    ...extra,
  };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (!BASE) return false;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refresh = getRefreshToken();
    try {
      const res = await fetch(`${BASE.replace(/\/$/, "")}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(refresh ? { refreshToken: refresh } : {}),
      });
      if (!res.ok) {
        clearAuthTokens();
        return false;
      }
      const data = (await res.json().catch(() => ({}))) as AuthResponse;
      if (data.accessToken) {
        setAuthTokens(
          { access: data.accessToken, refresh: data.refreshToken ?? refresh ?? undefined },
          { remember: Boolean(localStorage.getItem("eunik_refresh")) },
        );
      }
      return Boolean(data.accessToken || data.user);
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function api<T = unknown>(
  path: string,
  { method = "GET", body, skipRefresh = false }: { method?: string; body?: unknown; skipRefresh?: boolean } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: authHeaders({
      "Content-Type": "application/json",
    }),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !skipRefresh && !path.includes("/auth/login") && !path.includes("/auth/refresh")) {
    const ok = await tryRefreshSession();
    if (ok) {
      return api(path, { method, body, skipRefresh: true });
    }
  }

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
  lastName?: string;
  phone?: string;
  city?: string;
  gender?: string;
  address?: string;
  birthDay?: number;
  birthMonth?: number;
  preferredFit?: string;
  department?: string;
  jobTitle?: string;
  emergencyPhone?: string;
  notes?: string;
  navSections: string[];
  mustChangePassword: boolean;
}

interface AuthResponse {
  user: HttpUser;
  accessToken?: string;
  refreshToken?: string;
}

function captureTokens(data: AuthResponse, remember = false) {
  if (data.accessToken || data.refreshToken) {
    setAuthTokens(
      { access: data.accessToken, refresh: data.refreshToken },
      { remember },
    );
  }
}

export const httpAuth = {
  async login(
    email: string,
    password: string,
    opts: { portal?: "client" | "staff"; remember?: boolean } = {},
  ): Promise<HttpUser> {
    const remember = Boolean(opts.remember);
    const data = await api<AuthResponse>("/auth/login", {
      method: "POST",
      body: {
        email,
        password,
        portal: opts.portal,
        remember,
      },
      skipRefresh: true,
    });
    captureTokens(data, remember);
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
      skipRefresh: true,
    });
    captureTokens(data, false);
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
    const refresh = getRefreshToken();
    try {
      await api("/auth/logout", {
        method: "POST",
        body: refresh ? { refreshToken: refresh } : {},
        skipRefresh: true,
      });
    } finally {
      clearAuthTokens();
    }
  },

  async refresh(): Promise<HttpUser | null> {
    try {
      const refresh = getRefreshToken();
      const data = await api<AuthResponse>("/auth/refresh", {
        method: "POST",
        body: refresh ? { refreshToken: refresh } : {},
        skipRefresh: true,
      });
      captureTokens(data, Boolean(localStorage.getItem("eunik_refresh")));
      return data.user;
    } catch {
      clearAuthTokens();
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
    const data = await api<AuthResponse>("/auth/change-password", {
      method: "POST",
      body: { current, next },
    });
    captureTokens(data, Boolean(localStorage.getItem("eunik_refresh")));
  },

  async updateMe(patch: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    city?: string;
    gender?: string;
    address?: string;
    birthDay?: number;
    birthMonth?: number;
    preferredFit?: string;
    department?: string;
    jobTitle?: string;
    emergencyPhone?: string;
    notes?: string;
  }): Promise<HttpUser> {
    const data = await api<{ user: HttpUser }>("/auth/me", { method: "PATCH", body: patch });
    return data.user;
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
  async listAll() {
    const data = await api<{ products: unknown[] }>("/studio/products");
    return data.products;
  },
  async getById(id: string) {
    const data = await api<{ product: unknown }>(`/studio/products/${id}`);
    return data.product;
  },
  async nextSku(category: string) {
    const qs = new URLSearchParams({ category });
    const data = await api<{ sku: string; prefix: string }>(`/studio/products/next-sku?${qs}`);
    return data;
  },
  async create(payload: Record<string, unknown>) {
    const data = await api<{ product: unknown }>("/studio/products", { method: "POST", body: payload });
    return data.product;
  },
  async update(id: string, patch: Record<string, unknown>) {
    const data = await api<{ product: unknown }>(`/studio/products/${id}`, { method: "PATCH", body: patch });
    return data.product;
  },
  async remove(id: string) {
    await api(`/studio/products/${id}`, { method: "DELETE" });
  },
  async fabrics() {
    const data = await api<{ fabrics: unknown[] }>("/fabrics");
    return data.fabrics;
  },
};

export const httpCategories = {
  async list() {
    const data = await api<{ categories: unknown[] }>("/categories");
    return data.categories;
  },
  async create(payload: Record<string, unknown>) {
    const data = await api<{ category: unknown }>("/studio/categories", { method: "POST", body: payload });
    return data.category;
  },
  async update(id: string, patch: Record<string, unknown>) {
    const data = await api<{ category: unknown }>(`/studio/categories/${id}`, { method: "PATCH", body: patch });
    return data.category;
  },
  async remove(id: string) {
    await api(`/studio/categories/${id}`, { method: "DELETE" });
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
    try {
      const data = await api<{ cart: unknown }>("/cart");
      return data.cart;
    } catch (err) {
      // Staff session on a shared device must not break the public shell
      if (err instanceof ApiError && err.status === 403) {
        return { id: "staff-bag", lines: [] };
      }
      throw err;
    }
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
  async updateQty(lineId: string, qty: number) {
    const data = await api<{ cart: unknown }>(`/cart/lines/${lineId}`, {
      method: "PATCH",
      body: { qty },
    });
    return data.cart;
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
    const data = await api<{
      orderId: string;
      orderNumber: string;
      totalKobo: number;
      depositKobo: number;
      needsLogin?: boolean;
      accountCreated?: boolean;
      email?: string;
      accessToken?: string;
      refreshToken?: string;
    }>("/orders", { method: "POST", body: payload });
    if (data.accessToken) {
      setAuthTokens(
        { access: data.accessToken, refresh: data.refreshToken },
        { remember: false },
      );
    }
    return data;
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
  async updateStatus(id: string, status: string) {
    const data = await api<{ order?: unknown }>(`/orders/${id}/status`, { method: "PATCH", body: { status } });
    return data.order;
  },
  async reorder(id: string) {
    return api<{ added: number }>(`/orders/${encodeURIComponent(id)}/reorder`, { method: "POST" });
  },
  async sendPrice(
    id: string,
    body: {
      totalKobo: number;
      depositKobo?: number;
      description?: string;
      channel?: "email" | "whatsapp" | "both";
    },
  ) {
    return api<{
      quotation: { id: string; number: string; totalKobo: number; depositKobo: number; status: string };
      payUrl: string;
      cancelUrl: string;
      trackUrl: string;
      whatsappUrl: string;
      emailed: boolean;
    }>(`/orders/${encodeURIComponent(id)}/send-price`, { method: "POST", body });
  },
  /** Studio: key in an offline / WhatsApp / walk-in order like a regular checkout */
  async createManual(payload: {
    customer: { name: string; email: string; phone?: string };
    kind?: "ready_to_wear" | "made_to_measure" | "bespoke" | "alteration";
    fulfillment?: "pickup_ibadan" | "delivery";
    address?: string;
    notes?: string;
      source?: "offline" | "manual" | "whatsapp" | "phone" | "walk_in";
    status?: string;
    paidKobo?: number;
    paymentMethod?: "cash" | "pos" | "offline" | "bank_transfer";
    paymentRef?: string;
    shippingKobo?: number;
    notifyClient?: boolean;
    lines: {
      productId?: string;
      variantId?: string;
      name?: string;
      sku?: string;
      qty?: number;
      unitKobo?: number;
      kind?: "rtw" | "mtm";
    }[];
  }) {
    return api<{
      orderId: string;
      orderNumber: string;
      totalKobo: number;
      depositKobo: number;
      paidKobo: number;
      status: string;
      customerCreated: boolean;
    }>("/orders/manual", { method: "POST", body: payload });
  },
  async requestBalance(
    id: string,
    body: { channel?: "email" | "whatsapp" | "both"; message?: string } = {},
  ) {
    return api<{
      orderId: string;
      orderNumber: string;
      balanceKobo: number;
      payUrl: string;
      trackUrl: string;
      whatsappUrl: string;
      emailed: boolean;
      channel: string;
    }>(`/orders/${encodeURIComponent(id)}/request-balance`, { method: "POST", body });
  },
  async recordPayment(
    id: string,
    body: {
      amountKobo?: number;
      payInFull?: boolean;
      method?: "cash" | "pos" | "offline" | "bank_transfer";
      type?: "deposit" | "balance" | "full";
      transactionNumber?: string;
      notifyClient?: boolean;
    },
  ) {
    return api<{
      ok: boolean;
      paymentId: string;
      amountKobo: number;
      order: unknown;
    }>(`/orders/${encodeURIComponent(id)}/record-payment`, { method: "POST", body });
  },
};

/** Public token links for outstanding balance (after deposit) */
export const httpBalancePay = {
  async get(token: string) {
    return api<{
      order: {
        id: string;
        number: string;
        name: string;
        status: string;
        totalKobo: number;
        depositKobo: number;
        paidKobo: number;
        customerEmail: string;
        customerName: string;
      };
      amountDueKobo: number;
      settled: boolean;
      paystackEnabled: boolean;
      bank: { bankName?: string; accountName?: string; accountNumber?: string; narrationHint?: string } | null;
    }>(`/balance/pay/${encodeURIComponent(token)}`, { skipRefresh: true });
  },
  async paystack(token: string) {
    return api<{ accessCode: string; reference: string; amountKobo: number; orderId: string }>(
      `/balance/pay/${encodeURIComponent(token)}/paystack`,
      { method: "POST", body: {}, skipRefresh: true },
    );
  },
  async verify(token: string, reference: string) {
    return api<{ status: string }>(`/balance/pay/${encodeURIComponent(token)}/verify`, {
      method: "POST",
      body: { reference },
      skipRefresh: true,
    });
  },
  async transfer(token: string, payload: { transactionNumber: string; receiptUrl?: string }) {
    return api<{ ok: boolean; orderId: string; orderNumber: string }>(
      `/balance/pay/${encodeURIComponent(token)}/transfer`,
      { method: "POST", body: payload, skipRefresh: true },
    );
  },
};

/** Public token links for request-for-price pay / cancel (no auth) */
export const httpRfpQuote = {
  async getPay(token: string) {
    return api<{
      quote: { number: string; description: string; totalKobo: number; depositKobo: number; status: string };
      order: {
        id: string;
        number: string;
        name: string;
        status: string;
        totalKobo: number;
        depositKobo: number;
        paidKobo: number;
        priceOnRequest: boolean;
        customerEmail: string;
        customerName: string;
      };
      amountDueKobo: number;
      depositDueKobo: number;
      bank: { bankName?: string; accountName?: string; accountNumber?: string; narrationHint?: string } | null;
    }>(`/quote/pay/${encodeURIComponent(token)}`, { skipRefresh: true });
  },
  async paystack(token: string, type: "deposit" | "balance" | "full" = "deposit") {
    return api<{ accessCode: string; reference: string; amountKobo: number; orderId: string }>(
      `/quote/pay/${encodeURIComponent(token)}/paystack`,
      { method: "POST", body: { type }, skipRefresh: true },
    );
  },
  async transfer(
    token: string,
    payload: { transactionNumber: string; receiptUrl?: string; type?: "deposit" | "balance" | "full" },
  ) {
    return api<{ ok: boolean; orderId: string; orderNumber: string }>(
      `/quote/pay/${encodeURIComponent(token)}/transfer`,
      { method: "POST", body: payload, skipRefresh: true },
    );
  },
  async verify(token: string, reference: string) {
    return api<{ status: string }>(`/quote/pay/${encodeURIComponent(token)}/verify`, {
      method: "POST",
      body: { reference },
      skipRefresh: true,
    });
  },
  async getCancel(token: string) {
    return api<{ orderNumber: string; status: string; paidKobo: number; canCancel: boolean }>(
      `/quote/cancel/${encodeURIComponent(token)}`,
      { skipRefresh: true },
    );
  },
  async cancel(token: string) {
    return api<{ orderNumber: string; already: boolean }>(`/quote/cancel/${encodeURIComponent(token)}`, {
      method: "POST",
      skipRefresh: true,
    });
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
  async listByOrder(orderId: string) {
    const rows = (await this.list()) as { orderId?: string }[];
    return rows.filter((item) => item.orderId === orderId);
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
  async create(payload: {
    outfitType?: string;
    occasion?: string;
    colour?: string;
    budget?: string;
    deliveryDate?: string;
    description: string;
    consultation?: string;
    name?: string;
    email?: string;
    phone?: string;
    agreedPolicies?: boolean;
  }) {
    return api<{
      id: string;
      needsLogin?: boolean;
      email?: string;
      accountCreated?: boolean;
      accessToken?: string;
      refreshToken?: string;
      [key: string]: unknown;
    }>("/custom-requests", { method: "POST", body: payload });
  },
  async listMine() {
    const data = await api<{ requests: unknown[] }>("/custom-requests/mine");
    return data.requests;
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
    const data = await api<{ order: unknown }>(`/studio/quotes/${id}/accept`, { method: "POST" });
    return data.order;
  },
  async reject(id: string) {
    await api(`/studio/quotes/${id}/reject`, { method: "POST" });
  },
  async listMine() {
    const data = await api<{ quotations: unknown[] }>("/quotes/mine");
    return data.quotations;
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
  async assign(id: string, assigneeId: string | null) {
    const data = await api<{ production: unknown }>(`/studio/production/${id}`, {
      method: "PATCH",
      body: { assigneeId },
    });
    return data.production;
  },
};

// ─── B2 — Studio: People ──────────────────────────────────────────────────────

export const httpPeople = {
  async listStaff() {
    const data = await api<{ staff: unknown[] }>("/studio/people");
    return data.staff;
  },
  async listCustomers() {
    const data = await api<{ customers: unknown[] }>("/studio/customers");
    return data.customers;
  },
  async getCustomer(id: string) {
    const data = await api<{ customer: unknown }>(`/studio/customers/${id}`);
    return data.customer;
  },
  async updateCustomer(id: string, patch: Record<string, unknown>) {
    const data = await api<{ customer: unknown }>(`/studio/customers/${id}`, {
      method: "PATCH",
      body: patch,
    });
    return data.customer;
  },
  async hire(payload: {
    email: string;
    name: string;
    firstName: string;
    phone: string;
    role: string;
    department?: string;
    jobTitle?: string;
  }) {
    return api<{ id: string; tempPassword: string; emailSent: boolean }>("/studio/people/hire", {
      method: "POST",
      body: payload,
    });
  },
  async updateStaff(id: string, patch: { role?: string; department?: string; jobTitle?: string }) {
    const data = await api<{ staff: unknown }>(`/studio/people/staff/${id}`, {
      method: "PATCH",
      body: patch,
    });
    return data.staff;
  },
  async suspend(id: string) {
    await api(`/studio/people/staff/${id}/suspend`, { method: "POST" });
  },
  async unsuspend(id: string) {
    await api(`/studio/people/staff/${id}/unsuspend`, { method: "POST" });
  },
  async resetPassword(id: string) {
    return api<{ tempPassword: string; emailSent: boolean }>(`/studio/people/staff/${id}/reset-password`, {
      method: "POST",
    });
  },
  async remove(id: string) {
    await api(`/studio/people/staff/${id}`, { method: "DELETE" });
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
  async create(payload: {
    customerName: string;
    email?: string;
    phone?: string;
    service: string;
    date: string;
    time: string;
    location?: string;
    notes?: string;
    agreedPolicies?: boolean;
  }) {
    return api<{
      id: string;
      reference: string;
      needsLogin?: boolean;
      email?: string;
      accountCreated?: boolean;
      accessToken?: string;
      refreshToken?: string;
    }>("/appointments", { method: "POST", body: payload });
  },
  async listMine() {
    const data = await api<{ appointments: unknown[] }>("/appointments/mine");
    return data.appointments;
  },
};

export const httpPublic = {
  async newsletter(email: string) {
    await api("/newsletter", { method: "POST", body: { email } });
  },
  async ticket(payload: { name: string; email: string; phone?: string; subject?: string; message: string }) {
    return api<{ id: string }>("/tickets", { method: "POST", body: payload });
  },
  async lead(payload: { productId?: string; sku?: string }) {
    return api<{ id: string }>("/leads", { method: "POST", body: payload });
  },
};

export const httpWishlist = {
  async list() {
    const data = await api<{ products: unknown[] }>("/wishlist/mine");
    return data.products;
  },
  async add(productId: string) {
    await api("/wishlist", { method: "POST", body: { productId } });
  },
  async remove(productId: string) {
    await api(`/wishlist/${encodeURIComponent(productId)}`, { method: "DELETE" });
  },
};

export const httpMeasurements = {
  async listMine() {
    const data = await api<{ profiles: unknown[] }>("/measurements/mine");
    return data.profiles;
  },
  async listForCustomer(customerId: string) {
    const data = await api<{ profiles: unknown[] }>(`/studio/measurements?customerId=${encodeURIComponent(customerId)}`);
    return data.profiles;
  },
  async create(payload: {
    customerId?: string;
    name: string;
    unit?: "cm" | "in";
    values?: Record<string, number | string>;
    fit?: "slim" | "regular" | "relaxed";
  }) {
    const data = await api<{ profile: unknown }>("/measurements", { method: "POST", body: payload });
    return data.profile;
  },
};

export const httpTickets = {
  async list() {
    const data = await api<{ tickets: unknown[] }>("/studio/tickets");
    return data.tickets;
  },
  async listMine() {
    const data = await api<{ tickets: unknown[] }>("/tickets/mine");
    return data.tickets;
  },
  async reply(id: string, body: string) {
    await api(`/studio/tickets/${id}/reply`, { method: "POST", body: { body } });
  },
  async setStatus(id: string, status: "open" | "closed") {
    await api(`/studio/tickets/${id}`, { method: "PATCH", body: { status } });
  },
};

export const httpReviews = {
  async forProduct(productId: string) {
    const data = await api<{ reviews: unknown[] }>(`/reviews?productId=${encodeURIComponent(productId)}&status=approved`);
    return data.reviews;
  },
  async listMine() {
    const data = await api<{ reviews: unknown[] }>("/reviews/mine");
    return data.reviews;
  },
  async listAll() {
    const data = await api<{ reviews: unknown[] }>("/studio/reviews");
    return data.reviews;
  },
  async create(payload: { productId: string; rating: number; body: string }) {
    const data = await api<{ review: unknown }>("/reviews", { method: "POST", body: payload });
    return data.review;
  },
  async moderate(id: string, status: "approved" | "rejected") {
    await api(`/studio/reviews/${id}`, { method: "PATCH", body: { status } });
  },
};

export const httpAttendance = {
  async list() {
    const data = await api<{ attendance: unknown[] }>("/studio/attendance");
    return data.attendance;
  },
  async clock(type: "in" | "out", note?: string) {
    await api("/studio/attendance", { method: "POST", body: { type, note } });
  },
};

export const httpFittings = {
  async list() {
    const data = await api<{ fittings: unknown[] }>("/studio/fittings");
    return data.fittings;
  },
  async create(payload: { orderId: string; date: string; notes?: string }) {
    const data = await api<{ fitting: unknown }>("/studio/fittings", { method: "POST", body: payload });
    return data.fitting;
  },
  async update(id: string, patch: { notes?: string; status?: "scheduled" | "done"; date?: string }) {
    await api(`/studio/fittings/${id}`, { method: "PATCH", body: patch });
  },
};

export type ProfitReport = {
  revenueKobo: number;
  cogsKobo: number;
  profitKobo: number;
  margin: number;
  byKind: { kind: string; sales: number; cogs: number; profit: number }[];
};

export const httpAnalytics = {
  async profit(): Promise<ProfitReport> {
    const data = await api<{ profit: ProfitReport }>("/studio/analytics/profit");
    return data.profit;
  },
  async salesSeries(): Promise<{ day: string; naira: number }[]> {
    const data = await api<{ series: { day: string; naira: number }[] }>("/studio/analytics/sales-series");
    return data.series;
  },
};

// ─── B2 — Studio: Leads ───────────────────────────────────────────────────────

export const httpLeads = {
  async list() {
    const data = await api<{ leads: Record<string, unknown>[] }>("/studio/leads");
    return data.leads.map((row) => ({
      id: String(row.id),
      productId: String(row.product_id ?? row.productId ?? ""),
      sku: String(row.sku ?? ""),
      productName: row.product_name != null ? String(row.product_name) : row.productName != null ? String(row.productName) : undefined,
      status: (row.status === "claimed" ? "claimed" : "unclaimed") as "unclaimed" | "claimed",
      orderNumber: row.order_number != null ? String(row.order_number) : row.orderNumber != null ? String(row.orderNumber) : undefined,
      createdAt: String(row.created_at ?? row.createdAt ?? ""),
    }));
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
    const data = await api<{ settings: unknown }>("/studio/settings", { method: "PATCH", body: patch });
    return data.settings;
  },
};

// ─── B2 — Studio: Overview ────────────────────────────────────────────────────

import type { StudioOverview } from "@/db/types";

export const httpOverview = {
  async get() {
    const data = await api<Partial<StudioOverview> & Record<string, unknown>>("/studio/overview");
    return {
      revenueKobo: Number(data.revenueKobo ?? 0),
      awaitingReceipts: Number(data.awaitingReceipts ?? 0),
      openOrders: Number(data.openOrders ?? 0),
      outstandingKobo: Number(data.outstandingKobo ?? 0),
      activeBespoke: Number(data.activeBespoke ?? 0),
      lowFabrics: Number(data.lowFabrics ?? 0),
      unclaimedLeads: Number(data.unclaimedLeads ?? 0),
      mix: {
        rtw: Number(data.mix?.rtw ?? 0),
        mtm: Number(data.mix?.mtm ?? 0),
        bespoke: Number(data.mix?.bespoke ?? 0),
      },
      pipeline: (data.pipeline && typeof data.pipeline === "object" ? data.pipeline : {}) as Record<string, number>,
    } satisfies StudioOverview;
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
      headers: authHeaders(),
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
  async lookbook() {
    const data = await api<{ lookbook: unknown[] }>("/lookbook");
    return data.lookbook;
  },
  async journal() {
    const data = await api<{ posts: unknown[] }>("/journal");
    return data.posts;
  },
  async coupon(code: string) {
    const data = await api<{ coupon: unknown }>(`/coupons/${encodeURIComponent(code)}`);
    return data.coupon;
  },
  async events() {
    const data = await api<{ events: unknown[] }>("/events");
    return data.events;
  },
  async event(slug: string) {
    const data = await api<{ event: unknown }>(`/events/${slug}`);
    return data.event;
  },
  async updateHomepage(patch: Record<string, unknown>) {
    const data = await api<{ homepage: unknown }>("/studio/content/homepage", { method: "PATCH", body: patch });
    return data.homepage;
  },
  async saveLookbook(item: Record<string, unknown>) {
    if (item.id) {
      const data = await api<{ lookbook: unknown }>(`/studio/content/lookbook/${item.id}`, {
        method: "PATCH",
        body: item,
      });
      return data.lookbook;
    }
    const data = await api<{ lookbook: unknown }>("/studio/content/lookbook", { method: "POST", body: item });
    return data.lookbook;
  },
  async removeLookbook(id: string) {
    await api(`/studio/content/lookbook/${id}`, { method: "DELETE" });
  },
  async saveJournal(post: Record<string, unknown> & { id?: string }) {
    if (post.id) {
      const data = await api<{ post: unknown }>(`/studio/content/journal/${post.id}`, {
        method: "PATCH",
        body: post,
      });
      return data.post;
    }
    const data = await api<{ post: unknown }>("/studio/content/journal", { method: "POST", body: post });
    return data.post;
  },
  async removeJournal(id: string) {
    await api(`/studio/content/journal/${id}`, { method: "DELETE" });
  },
  async saveEvent(event: Record<string, unknown> & { id?: string }) {
    if (event.id) {
      const data = await api<{ event: unknown }>(`/studio/content/events/${event.id}`, {
        method: "PATCH",
        body: event,
      });
      return data.event;
    }
    const data = await api<{ event: unknown }>("/studio/content/events", { method: "POST", body: event });
    return data.event;
  },
  async removeEvent(id: string) {
    await api(`/studio/content/events/${id}`, { method: "DELETE" });
  },
};
