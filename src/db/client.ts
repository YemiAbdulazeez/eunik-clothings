import { delay } from "./delay";
import { getState, mutate, replaceState, subscribe } from "./persist";
import { createSeed } from "./seed";
import { ATELIER_ROLES, landingPath, readSession, writeSession } from "./session";
import { canSeeSection, defaultNav, isHouseStaff } from "../lib/rbac";
import { emitCartChange } from "../lib/cartEvents";
import {
  HTTP_ENABLED,
  httpAuth,
  httpProducts,
  httpCategories,
  httpSettings,
  httpCart,
  httpOrders,
  httpPayments,
  httpQuotations,
  httpProduction,
  httpPeople,
  httpLeads,
  httpNotifications,
  httpAudit,
  httpStudioSettings,
  httpOverview,
  httpTraffic,
  httpContent,
  httpCustom,
  httpAppointments,
  httpPublic,
  httpUploads,
} from "../api/http";
import {
  DEMO_PASSWORD,
  ForbiddenError,
  GUEST_KEY,
  type Cart,
  type CartLine,
  type Category,
  type CategorySlug,
  type CustomDesignRequest,
  type DemoChip,
  type EventItem,
  type Gender,
  type HomepageContent,
  type LookbookItem,
  type MeasurementProfile,
  type NavSection,
  type Order,
  type Payment,
  type Product,
  type ProductionStage,
  type Role,
  type Session,
  type Settings,
  type User,
  type PublicUser,
  type BlogPost,
  type Review,
  type AnalyticsEvent,
  type TrafficSnapshot,
  type StudioOverview,
  type Quotation,
  type AuditLog,
  type Notification,
  type ProductionOrder,
  type DbState,
} from "./types";

export { subscribe };

function guestId(): string {
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = `guest_${crypto.randomUUID()}`;
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

function ownerId(): string {
  return readSession()?.userId ?? guestId();
}

function nowIso(): string {
  return new Date().toISOString();
}

function currentUser(): User | null {
  const session = readSession();
  if (!session) return null;
  return getState().users.find((user) => user.id === session.userId) ?? null;
}

function publicUser(user: User): PublicUser {
  const { password: _password, ...rest } = user;
  return rest;
}

function pickFloorTailor(draft: DbState): string {
  return draft.users.find((u) => u.role === "tailor")?.id ?? "user_tailor";
}

function variantStock(draft: DbState, variantId: string): number {
  return draft.variants.find((v) => v.id === variantId)?.stock ?? 0;
}

function applyStockForOrderItems(draft: DbState, orderId: string, delta: -1 | 1): void {
  for (const item of draft.orderItems.filter((row) => row.orderId === orderId)) {
    if (!item.variantId) continue;
    const variant = draft.variants.find((v) => v.id === item.variantId);
    if (!variant) continue;
    variant.stock = Math.max(0, variant.stock + delta * item.qty);
  }
}

function requireUser(): User {
  const user = currentUser();
  if (!user) throw new Error("Sign in required.");
  return user;
}

function assertRoles(roles: Role[], action = "do this", section?: NavSection): User {
  const user = requireUser();
  if (user.role === "client") {
    throw new ForbiddenError(`Your role cannot ${action}.`);
  }
  if (user.role === "super_admin") return user;
  if (section) {
    if (!canSeeSection(user, section)) {
      throw new ForbiddenError(`Your access cannot ${action}.`);
    }
    return user;
  }
  if (!roles.includes(user.role)) {
    throw new ForbiddenError(`Your role cannot ${action}.`);
  }
  return user;
}

function assertCanShop(): User | null {
  const user = currentUser();
  if (user && user.role !== "client") {
    throw new ForbiddenError("House staff cannot order or act as clients.");
  }
  return user;
}

function isStaff(user: User): boolean {
  return user.role !== "client";
}

function ensureCart(id: string): Cart {
  const existing = getState().carts.find((cart) => cart.ownerId === id);
  if (existing) return existing;
  const cart: Cart = { id: `cart_${id}`, ownerId: id, lines: [] };
  mutate((draft) => {
    draft.carts.push(cart);
  });
  return getState().carts.find((entry) => entry.ownerId === id)!;
}

function lineTotal(line: CartLine): number {
  const fabric = getState().fabrics.find((item) => item.id === line.fabricId);
  const surcharge = fabric?.surchargeKobo ?? 0;
  // Live API cart lines include unit price — do not depend on local seed catalogue
  if (typeof line.priceKobo === "number" && Number.isFinite(line.priceKobo)) {
    return (line.priceKobo + surcharge) * line.qty;
  }
  const product = getState().products.find((item) => item.id === line.productId);
  if (!product) return 0;
  return (product.priceKobo + surcharge) * line.qty;
}

function cartTotals(cart: Cart) {
  const subtotal = cart.lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const coupon = cart.couponCode
    ? getState().coupons.find((item) => item.code === cart.couponCode && item.active)
    : undefined;
  const discount = coupon ? Math.round((subtotal * coupon.percent) / 100) : 0;
  return { subtotal, discount, coupon };
}

function audit(actorId: string, action: string, detail: string): void {
  mutate((draft) => {
    draft.auditLogs.unshift({
      id: crypto.randomUUID(),
      at: nowIso(),
      actorId,
      action,
      detail,
    });
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the receipt."));
    reader.readAsDataURL(file);
  });
}

export type ProductFilter = {
  category?: CategorySlug;
  q?: string;
  sort?: "featured" | "newest" | "price_asc" | "price_desc";
};

export type PlaceOrderPayload = {
  fulfillment: "pickup_ibadan" | "delivery";
  address?: string;
  name: string;
  email: string;
  phone: string;
  couponCode?: string;
  payment:
    | { method: "paystack" }
    | { method: "bank_transfer"; transactionNumber: string; receiptDataUrl: string };
};

/** Unique ORD-###### for local/demo checkout (guests and clients). */
function allocateOrderNumber(draft: { meta: { nextOrder: number }; orders: { number: string }[] }): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const n = draft.meta.nextOrder;
    draft.meta.nextOrder += 1;
    const number = `ORD-${String(n).padStart(6, "0")}`;
    if (!draft.orders.some((order) => order.number === number)) return number;
  }
  throw new Error("Could not allocate a unique order number.");
}

function demoChips(): DemoChip[] {
  return [
    { email: "ade@eunik.demo", label: "Ade · client", role: "client" },
    { email: "funmi@eunik.demo", label: "Funmi · client", role: "client" },
    { email: "olamideabolanle1@gmail.com", label: "Olamide · super admin", role: "super_admin" },
    { email: "manager@eunik.demo", label: "Manager", role: "manager" },
    { email: "desk@eunik.demo", label: "Front desk", role: "desk" },
    { email: "designer@eunik.demo", label: "Designer", role: "designer" },
    { email: "tailor@eunik.demo", label: "Tailor", role: "tailor" },
    { email: "cutter@eunik.demo", label: "Cutter", role: "cutter" },
    { email: "qc@eunik.demo", label: "QC", role: "qc" },
    { email: "finance@eunik.demo", label: "Finance", role: "finance" },
    { email: "content@eunik.demo", label: "Content", role: "content" },
  ];
}

function mergeGuestCart(userId: string): void {
  if (HTTP_ENABLED) return;
  const gid = localStorage.getItem(GUEST_KEY);
  if (!gid || gid === userId) return;
  const guest = getState().carts.find((cart) => cart.ownerId === gid);
  if (!guest?.lines.length) return;
  mutate((draft) => {
    let userCart = draft.carts.find((cart) => cart.ownerId === userId);
    if (!userCart) {
      userCart = { id: `cart_${userId}`, ownerId: userId, lines: [] };
      draft.carts.push(userCart);
    }
    for (const line of guest.lines) {
      userCart.lines.push({ ...line, id: crypto.randomUUID() });
    }
    guest.lines = [];
    if (guest.couponCode && userCart && !userCart.couponCode) userCart.couponCode = guest.couponCode;
  });
}

async function createOrderFromCart(payload: PlaceOrderPayload): Promise<Order> {
  const cart = ensureCart(ownerId());
  if (!cart.lines.length) throw new Error("Your bag is empty.");
  const user = currentUser();
  const hasMtm = cart.lines.some((line) => line.kind === "mtm");
  if (hasMtm && !user) throw new Error("Made to measure needs a house account.");

  const { subtotal, discount } = cartTotals({ ...cart, couponCode: payload.couponCode ?? cart.couponCode });
  const afterDiscount = subtotal - discount;
  const shippingKobo =
    payload.fulfillment === "pickup_ibadan" || afterDiscount >= getState().settings.freeShippingKobo
      ? 0
      : 3500_00;
  const totalKobo = afterDiscount + shippingKobo;
  const first = cart.lines[0];
  const firstProduct = getState().products.find((item) => item.id === first.productId);
  const kind = hasMtm ? "made_to_measure" : "ready_to_wear";
  const depositKobo = hasMtm ? Math.round((totalKobo * getState().settings.depositPercent) / 100) : totalKobo;
  const chargeNow = payload.payment.method === "paystack" ? depositKobo : 0;
  const lineCount = cart.lines.length;
  const summaryName =
    lineCount === 1
      ? (firstProduct?.name ?? "EUNIK order")
      : `${lineCount} looks · ${firstProduct?.name ?? "EUNIK order"}`;

  let created!: Order;

  mutate((draft) => {
    for (const line of cart.lines) {
      if (line.kind === "rtw" && line.variantId && variantStock(draft, line.variantId) < line.qty) {
        throw new Error("One of the sizes in your bag is no longer available.");
      }
    }
    const number = allocateOrderNumber(draft);
    const id = `order_${number.replace(/\W/g, "_")}`;
    const profile = first.measurementProfileId
      ? draft.measurementProfiles.find((item) => item.id === first.measurementProfileId)
      : undefined;
    created = {
      id,
      number,
      customerId: ownerId(),
      customerName: payload.name,
      customerEmail: payload.email,
      customerPhone: payload.phone,
      kind,
      status: payload.payment.method === "paystack" ? "confirmed" : "awaiting_transfer",
      productId: firstProduct?.id,
      sku: firstProduct?.sku,
      name: summaryName,
      image: firstProduct?.image,
      qty: cart.lines.reduce((sum, line) => sum + line.qty, 0),
      subtotalKobo: subtotal,
      shippingKobo,
      discountKobo: discount,
      totalKobo,
      depositKobo,
      paidKobo: payload.payment.method === "paystack" ? chargeNow : 0,
      fulfillment: payload.fulfillment,
      address: payload.address,
      createdAt: nowIso(),
      measurementSnapshot: profile?.values,
    };
    draft.orders.unshift(created);
    cart.lines.forEach((line) => {
      const product = draft.products.find((entry) => entry.id === line.productId);
      const variant = line.variantId ? draft.variants.find((entry) => entry.id === line.variantId) : undefined;
      draft.orderItems.push({
        id: crypto.randomUUID(),
        orderId: id,
        productId: line.productId,
        variantId: line.variantId,
        name: product?.name ?? "Garment",
        sku: product?.sku,
        size: variant?.size,
        kind: line.kind,
        fabricId: line.fabricId,
        qty: line.qty,
        unitKobo: product?.priceKobo ?? 0,
      });
    });
    const payment: Payment = {
      id: crypto.randomUUID(),
      orderId: id,
      customerId: ownerId(),
      amountKobo: depositKobo,
      type: hasMtm ? "deposit" : "full",
      method: payload.payment.method,
      status: payload.payment.method === "paystack" ? "successful" : "awaiting_verification",
      paystackReference:
        payload.payment.method === "paystack" ? `PAY_demo_${number}_${Date.now()}` : undefined,
      transactionNumber:
        payload.payment.method === "bank_transfer" ? payload.payment.transactionNumber : undefined,
      receiptDataUrl:
        payload.payment.method === "bank_transfer" ? payload.payment.receiptDataUrl : undefined,
      submittedAt: nowIso(),
    };
    draft.payments.unshift(payment);
    if (payload.payment.method === "paystack" && kind === "ready_to_wear") {
      applyStockForOrderItems(draft, id, -1);
    }
    if (hasMtm) {
      created.status = payload.payment.method === "paystack" ? "production" : "awaiting_transfer";
      const order = draft.orders.find((entry) => entry.id === id);
      if (order) order.status = created.status;
      draft.productionOrders.unshift({
        id: `prod_${number}`,
        orderId: id,
        customerId: ownerId(),
        garment: created.name,
        sku: created.sku,
        stage: payload.payment.method === "paystack" ? "measurements_confirmed" : "quote_accepted",
        assigneeId: pickFloorTailor(draft),
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      });
    }
    const liveCart = draft.carts.find((entry) => entry.ownerId === ownerId());
    if (liveCart) {
      liveCart.lines = [];
      liveCart.couponCode = undefined;
    }
  });

  return created;
}

function demoToday(): string {
  return getState().settings.demoToday ?? new Date().toISOString().slice(0, 10);
}

function trafficForRange(range: "today" | "7d" | "30d" | "all"): TrafficSnapshot {
  const end = new Date(`${demoToday()}T23:59:59.000Z`);
  const start = new Date(end);
  if (range === "today") start.setHours(0, 0, 0, 0);
  else if (range === "7d") start.setDate(start.getDate() - 6);
  else if (range === "30d") start.setDate(start.getDate() - 29);
  else start.setFullYear(2020);

  const events = getState().analyticsEvents.filter((item) => {
    const at = new Date(item.createdAt);
    return at >= start && at <= end;
  });
  const pageViews = events.filter((item) => item.type === "page_view" || item.type === "view_item");
  const views = pageViews.length;
  const visitors = new Set(pageViews.map((item) => `${item.channel}-${item.device}-${item.path}`)).size;
  const sessions = Math.max(1, Math.round(views / 2.4));
  const channels = Object.entries(
    pageViews.reduce<Record<string, number>>((map, item) => {
      const key = item.channel ?? "direct";
      map[key] = (map[key] ?? 0) + 1;
      return map;
    }, {}),
  ).map(([channel, count]) => ({ channel, views: count, visitors: Math.round(count / 2) }));

  const byDay = new Map<string, { views: number; visitors: Set<string> }>();
  pageViews.forEach((item) => {
    const day = item.createdAt.slice(0, 10);
    const row = byDay.get(day) ?? { views: 0, visitors: new Set<string>() };
    row.views += 1;
    row.visitors.add(`${item.channel}-${item.device}`);
    byDay.set(day, row);
  });
  const viewsSeries = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, row]) => ({ day: day.slice(5), views: row.views, visitors: row.visitors.size }));

  const pathCounts = pageViews.reduce<Record<string, number>>((map, item) => {
    const path = item.path ?? "/";
    map[path] = (map[path] ?? 0) + 1;
    return map;
  }, {});
  const topPages = Object.entries(pathCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([path, count]) => ({ path, views: count }));

  const skuCounts = events
    .filter((item) => item.sku)
    .reduce<Record<string, number>>((map, item) => {
      map[item.sku!] = (map[item.sku!] ?? 0) + 1;
      return map;
    }, {});
  const topSkus = Object.entries(skuCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([sku]) => {
      const product = getState().products.find((item) => item.sku === sku);
      return { sku, name: product?.name ?? sku, views: skuCounts[sku] };
    });

  const funnelNames = ["view_item", "whatsapp_click", "add_to_bag", "purchase"] as const;
  const funnels = funnelNames.map((name) => ({
    name: name.replaceAll("_", " "),
    count: events.filter((item) => item.type === name).length,
  }));
  const purchases = funnels.find((item) => item.name === "purchase")?.count ?? 0;
  const whatsapp = funnels.find((item) => item.name === "whatsapp click")?.count ?? 0;
  const bags = funnels.find((item) => item.name === "add to bag")?.count ?? 0;
  const viewItems = funnels.find((item) => item.name === "view item")?.count ?? 1;

  return {
    summary: {
      views,
      visitors,
      sessions,
      bounceRate: views ? Math.min(0.65, 0.35 + views / 10000) : 0,
      pagesPerSession: sessions ? views / sessions : 0,
      activeNow: Math.min(3, Math.round(views / 400)),
    },
    viewsSeries,
    channels,
    referrers: [
      { host: "instagram.com", views: Math.round(views * 0.4) },
      { host: "google.com", views: Math.round(views * 0.12) },
      { host: "wa.me", views: Math.round(views * 0.15) },
    ],
    devices: [
      { device: "mobile", views: Math.round(views * 0.75) },
      { device: "desktop", views: Math.round(views * 0.2) },
      { device: "tablet", views: Math.round(views * 0.05) },
    ],
    geo: [
      { country: "NG", city: "Ibadan", views: Math.round(views * 0.35) },
      { country: "NG", city: "Lagos", views: Math.round(views * 0.4) },
      { country: "NG", city: "Abuja", views: Math.round(views * 0.15) },
      { country: "GH", city: "Accra", views: Math.round(views * 0.1) },
    ],
    topPages,
    topSkus,
    funnels,
    conversion: {
      sessionToPurchase: sessions ? purchases / sessions : 0,
      sessionToWhatsapp: sessions ? whatsapp / sessions : 0,
      viewItemToBag: viewItems ? bags / viewItems : 0,
    },
  };
}

export const db = {
  auth: {
    async login(email: string, password: string): Promise<Session> {
      if (HTTP_ENABLED) {
        const httpUser = await httpAuth.login(email, password);
        const session: Session = { userId: httpUser.id, role: httpUser.role as Role };
        writeSession(session);
        return session;
      }
      await delay();
      const user = getState().users.find(
        (entry) => entry.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (!user || user.password !== password) {
        throw new Error("Those house credentials were not recognised.");
      }
      const session: Session = { userId: user.id, role: user.role };
      writeSession(session);
      mergeGuestCart(user.id);
      audit(user.id, "auth.login", user.email);
      return session;
    },
    async register(input: {
      email: string;
      password: string;
      name: string;
      firstName: string;
      lastName?: string;
      phone: string;
      city?: string;
      gender?: Gender;
      address?: string;
      birthDay?: number;
      birthMonth?: number;
      preferredFit?: string;
    }): Promise<Session> {
      if (HTTP_ENABLED) {
        const httpUser = await httpAuth.register(input);
        const session: Session = { userId: httpUser.id, role: httpUser.role as Role };
        writeSession(session);
        return session;
      }
      await delay();
      if (getState().users.some((entry) => entry.email.toLowerCase() === input.email.toLowerCase())) {
        throw new Error("That email already has a house account.");
      }
      const user: User = {
        id: `user_${crypto.randomUUID()}`,
        email: input.email.trim(),
        password: input.password,
        role: "client",
        name: input.name,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        city: input.city || "Ibadan",
        gender: input.gender,
        address: input.address,
        birthDay: input.birthDay,
        birthMonth: input.birthMonth,
        preferredFit: input.preferredFit,
      };
      mutate((draft) => {
        draft.users.push(user);
      });
      const session: Session = { userId: user.id, role: "client" };
      writeSession(session);
      mergeGuestCart(user.id);
      return session;
    },
    async logout(): Promise<void> {
      if (HTTP_ENABLED) {
        await httpAuth.logout();
        writeSession(null);
        return;
      }
      await delay(120);
      writeSession(null);
    },
    async me(): Promise<PublicUser | null> {
      if (HTTP_ENABLED) {
        const httpUser = await httpAuth.me();
        if (!httpUser) { writeSession(null); return null; }
        const session: Session = { userId: httpUser.id, role: httpUser.role as Role };
        writeSession(session);
        return {
          id: httpUser.id,
          email: httpUser.email,
          role: httpUser.role as Role,
          name: httpUser.name,
          firstName: httpUser.firstName,
          navSections: httpUser.navSections as NavSection[],
          mustChangePassword: httpUser.mustChangePassword,
        } as PublicUser;
      }
      await delay(80);
      const user = currentUser();
      return user ? publicUser(user) : null;
    },
    async requestPasswordReset(email: string): Promise<void> {
      if (HTTP_ENABLED) {
        await httpAuth.forgotPassword(email);
        return;
      }
      await delay();
    },
    demoAccounts(): DemoChip[] {
      return demoChips();
    },
    landingPath,
    async switchDemoUser(userId: string): Promise<Session> {
      if (HTTP_ENABLED) {
        throw new Error("Demo role switching is disabled while the live API is connected.");
      }
      await delay(80);
      const actor = currentUser();
      if (!getState().settings.demoMode) throw new ForbiddenError();
      const target = getState().users.find((entry) => entry.id === userId);
      if (!target) throw new Error("Unknown demo person.");
      if (actor && isHouseStaff(actor) && target.role === "client") {
        throw new ForbiddenError("House staff cannot walk as clients.");
      }
      if (target.role === "client" && actor && actor.role !== "client") {
        throw new ForbiddenError("House staff cannot walk as clients.");
      }
      const from =
        actor && isStaff(actor) ? actor.id : readSession()?.actingFromId ?? actor?.id;
      const session: Session = {
        userId: target.id,
        role: target.role,
        actingFromId: from && from !== target.id ? from : undefined,
      };
      writeSession(session);
      return session;
    },
    async changePassword(current: string, next: string): Promise<void> {
      if (HTTP_ENABLED) {
        await httpAuth.changePassword(current, next);
        return;
      }
      await delay();
      const user = requireUser();
      if (user.password !== current) throw new Error("Current password is not correct.");
      if (next.length < 8) throw new Error("New password must be at least 8 characters.");
      mutate((draft) => {
        const row = draft.users.find((entry) => entry.id === user.id);
        if (row) {
          row.password = next;
          row.mustChangePassword = false;
        }
      });
    },
    async ensureAtCheckout(input: { email: string; name: string; phone: string }): Promise<
      | { user: PublicUser; created: boolean; mailTo?: string }
      | { needsLogin: true; email: string }
    > {
      if (HTTP_ENABLED) {
        const me = await httpAuth.me().catch(() => null);
        if (me) return { user: me as PublicUser, created: false };
        return { needsLogin: true, email: input.email.trim().toLowerCase() };
      }
      await delay();
      const email = input.email.trim().toLowerCase();
      const existing = getState().users.find((entry) => entry.email.toLowerCase() === email);
      const logged = currentUser();
      if (logged && logged.role === "client") {
        return { user: publicUser(logged), created: false };
      }
      if (logged && logged.role !== "client") {
        throw new ForbiddenError("House staff cannot check out as clients.");
      }
      if (existing) {
        if (existing.role !== "client") {
          throw new ForbiddenError("That email belongs to the house, not a client book.");
        }
        return { needsLogin: true, email };
      }
      const password = DEMO_PASSWORD;
      const firstName = input.name.trim().split(" ")[0] || "Client";
      const user: User = {
        id: `user_${crypto.randomUUID()}`,
        email,
        password,
        role: "client",
        name: input.name.trim(),
        firstName,
        phone: input.phone,
        city: "Ibadan",
        mustChangePassword: true,
      };
      const house = getState().settings.email;
      const subject = "Your EUNIK house account";
      const body = [
        `Welcome to EUNIK Clothings.`,
        ``,
        `A client book was opened when you checked out.`,
        `Sign in: https://eunikclothings.com/account/login`,
        `Email: ${email}`,
        `Temporary password: ${password}`,
        ``,
        `Please change this password after you enter the atelier.`,
        ``,
        `— EUNIK HQ, Ibadan`,
      ].join("\n");
      const mailTo = `mailto:${email}?bcc=${encodeURIComponent(house)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      mutate((draft) => {
        draft.users.push(user);
        draft.mailbox.unshift({
          id: crypto.randomUUID(),
          to: email,
          subject,
          body,
          sentAt: nowIso(),
        });
        draft.notifications.unshift({
          id: crypto.randomUUID(),
          userId: user.id,
          title: "Your house account is open",
          body: `Sign in with ${email}. Check your mailbox on this demo for your temporary password.`,
          createdAt: nowIso(),
          read: false,
        });
      });
      writeSession({ userId: user.id, role: "client" });
      mergeGuestCart(user.id);
      return { user: publicUser(user), created: true, mailTo };
    },
    async updateMe(
      patch: Partial<
        Pick<
          User,
          | "name"
          | "firstName"
          | "lastName"
          | "phone"
          | "city"
          | "gender"
          | "address"
          | "birthDay"
          | "birthMonth"
          | "preferredFit"
          | "department"
          | "jobTitle"
          | "emergencyPhone"
          | "notes"
        >
      >,
    ): Promise<PublicUser> {
      await delay();
      const user = requireUser();
      mutate((draft) => {
        const row = draft.users.find((entry) => entry.id === user.id);
        if (!row) return;
        Object.assign(row, patch);
        if (patch.firstName || patch.lastName) {
          row.name = [patch.firstName ?? row.firstName, patch.lastName ?? row.lastName].filter(Boolean).join(" ");
        }
      });
      return publicUser(getState().users.find((entry) => entry.id === user.id)!);
    },
  },
  products: {
    async list(filter?: ProductFilter) {
      if (HTTP_ENABLED) return (await httpProducts.list(filter ?? {})) as Product[];
      await delay();
      let list = getState().products.filter((item) => item.status === "live");
      if (filter?.category) list = list.filter((item) => item.category === filter.category);
      if (filter?.q) {
        const q = filter.q.toLowerCase();
        list = list.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.sku.toLowerCase().includes(q) ||
            item.colour.toLowerCase().includes(q),
        );
      }
      const sort = filter?.sort ?? "featured";
      if (sort === "price_asc") list = [...list].sort((a, b) => a.priceKobo - b.priceKobo);
      else if (sort === "price_desc") list = [...list].sort((a, b) => b.priceKobo - a.priceKobo);
      else if (sort === "newest") list = [...list].reverse();
      else list = [...list].sort((a, b) => {
        if (Boolean(a.featuredRank) !== Boolean(b.featuredRank)) return a.featuredRank ? -1 : 1;
        return (a.featuredRank || 99) - (b.featuredRank || 99);
      });
      return list;
    },
    async getBySlug(slug: string) {
      if (HTTP_ENABLED) return (await httpProducts.get(slug)) as Product | null;
      await delay();
      return (
        getState().products.find(
          (item) => item.slug === slug.toLowerCase() || item.sku.toLowerCase() === slug.toLowerCase(),
        ) ?? null
      );
    },
    async getBySku(sku: string) {
      if (HTTP_ENABLED) return (await httpProducts.get(sku)) as Product | null;
      await delay();
      return getState().products.find((item) => item.sku.toLowerCase() === sku.toLowerCase()) ?? null;
    },
    async featured() {
      if (HTTP_ENABLED) {
        const products = (await httpProducts.list()) as Product[];
        return products
          .filter((item) => item.featuredRank > 0)
          .sort((a, b) => a.featuredRank - b.featuredRank);
      }
      await delay();
      return getState()
        .products.filter((item) => item.featuredRank > 0)
        .sort((a, b) => a.featuredRank - b.featuredRank);
    },
    async listAll() {
      await delay();
      assertRoles(["super_admin", "manager", "content"], "list the catalogue file", "products");
      return getState().products;
    },
    async create(input: {
      sku: string;
      name: string;
      image: string;
      images?: string[];
      category: CategorySlug;
      priceKobo: number;
      priceOnRequest?: boolean;
      shortDescription: string;
      description: string;
      colour: string;
      fabricLabel: string;
      sellsRtw: boolean;
      sellsMtm: boolean;
      featuredRank: number;
      status: "live" | "draft";
    }) {
      await delay();
      const actor = assertRoles(["super_admin", "manager", "content"], "add a look", "products");
      const sku = input.sku.trim().toUpperCase();
      if (getState().products.some((item) => item.sku === sku)) throw new Error("That SKU is already on the rail.");
      const images = input.images?.length ? input.images : [input.image];
      const product: Product = {
        ...input,
        id: sku.toLowerCase(),
        sku,
        slug: sku.toLowerCase(),
        image: images[0] ?? input.image,
        images,
        priceOnRequest: Boolean(input.priceOnRequest),
        priceKobo: input.priceOnRequest ? 0 : input.priceKobo,
      };
      mutate((draft) => {
        draft.products.unshift(product);
      });
      audit(actor.id, "product.create", sku);
      return product;
    },
    async update(
      id: string,
      patch: Partial<
        Pick<
          Product,
          | "name"
          | "priceKobo"
          | "priceOnRequest"
          | "status"
          | "shortDescription"
          | "description"
          | "image"
          | "images"
          | "colour"
          | "fabricLabel"
          | "sellsRtw"
          | "sellsMtm"
          | "featuredRank"
          | "category"
        >
      >,
    ) {
      await delay();
      const actor = assertRoles(["super_admin", "manager", "content"], "edit products", "products");
      let updated = getState().products.find((item) => item.id === id);
      if (!updated) throw new Error("Garment not found.");
      mutate((draft) => {
        const product = draft.products.find((item) => item.id === id);
        if (!product) return;
        Object.assign(product, patch);
        if (patch.images?.length) {
          product.images = patch.images;
          product.image = patch.images[0];
        } else if (patch.image) {
          product.images = [patch.image, ...product.images.filter((item) => item !== patch.image)];
          product.image = patch.image;
        }
        if (patch.priceOnRequest) product.priceKobo = 0;
        updated = product;
      });
      audit(actor.id, "product.update", `${id} updated`);
      return updated!;
    },
    async remove(id: string) {
      await delay();
      const actor = assertRoles(["super_admin", "manager"], "delete a look", "products");
      mutate((draft) => {
        draft.products = draft.products.filter((item) => item.id !== id);
        draft.variants = draft.variants.filter((item) => item.productId !== id);
      });
      audit(actor.id, "product.remove", id);
    },
    async variants(productId: string) {
      await delay(80);
      return getState().variants.filter((item) => item.productId === productId);
    },
    async fabrics() {
      await delay(80);
      return getState().fabrics;
    },
  },
  categories: {
    async list() {
      if (HTTP_ENABLED) return (await httpCategories.list()) as Category[];
      await delay(80);
      return getState().categories;
    },
    async get(slug: string) {
      if (HTTP_ENABLED) {
        const categories = (await httpCategories.list()) as Category[];
        const key = slug === "men-senator" ? "senator" : slug;
        return categories.find((item) => item.slug === key) ?? null;
      }
      await delay(80);
      const key = slug === "men-senator" ? "senator" : slug;
      return getState().categories.find((item) => item.slug === key) ?? null;
    },
    async counts() {
      if (HTTP_ENABLED) {
        const [categories, products] = await Promise.all([
          httpCategories.list(),
          httpProducts.list(),
        ]);
        const map: Record<string, number> = {};
        for (const category of categories as Category[]) {
          map[category.slug] = (products as Product[]).filter(
            (item) => item.category === category.slug && item.status === "live",
          ).length;
        }
        return map;
      }
      await delay(80);
      const map: Record<string, number> = {};
      for (const category of getState().categories) {
        map[category.slug] = getState().products.filter(
          (item) => item.category === category.slug && item.status === "live",
        ).length;
      }
      return map;
    },
    async create(input: { name: string; tagline: string; slug: string; image: string; heroImage?: string }) {
      await delay();
      const actor = assertRoles(["super_admin", "manager", "content"], "add a collection", "collections");
      const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
      if (getState().categories.some((item) => item.slug === slug)) throw new Error("That collection already exists.");
      const row: Category = {
        id: `cat_${crypto.randomUUID()}`,
        slug,
        name: input.name,
        tagline: input.tagline,
        path: `/collection/${slug}`,
        image: input.image,
        heroImage: input.heroImage,
        homeTileImage: input.image,
      };
      mutate((draft) => {
        draft.categories.push(row);
      });
      audit(actor.id, "collection.create", slug);
      return row;
    },
    async update(
      id: string,
      patch: Partial<Pick<Category, "name" | "tagline" | "image" | "heroImage" | "homeTileImage">>,
    ) {
      await delay();
      const actor = assertRoles(["super_admin", "manager", "content"], "edit a collection", "collections");
      mutate((draft) => {
        const row = draft.categories.find((item) => item.id === id);
        if (row) Object.assign(row, patch);
      });
      audit(actor.id, "collection.update", id);
      return getState().categories.find((item) => item.id === id)!;
    },
    async remove(id: string) {
      await delay();
      const actor = assertRoles(["super_admin", "manager"], "delete a collection", "collections");
      const category = getState().categories.find((item) => item.id === id);
      if (!category) throw new Error("Collection not found.");
      const attached = getState().products.some((item) => item.category === category.slug);
      if (attached) throw new Error("Move or delete looks in this collection first.");
      mutate((draft) => {
        draft.categories = draft.categories.filter((item) => item.id !== id);
      });
      audit(actor.id, "collection.remove", category.slug);
    },
  },
  cart: {
    async get() {
      if (HTTP_ENABLED) return (await httpCart.get()) as Cart | null;
      await delay(80);
      const user = currentUser();
      if (user && user.role !== "client") {
        return { id: "staff-bag", ownerId: user.id, lines: [] };
      }
      return ensureCart(ownerId());
    },
    async add(line: Omit<CartLine, "id">) {
      if (HTTP_ENABLED) {
        const cart = (await httpCart.addLine(line)) as Cart;
        emitCartChange();
        return cart;
      }
      await delay();
      assertCanShop();
      let cart!: Cart;
      mutate((draft) => {
        let current = draft.carts.find((entry) => entry.ownerId === ownerId());
        if (!current) {
          current = { id: `cart_${ownerId()}`, ownerId: ownerId(), lines: [] };
          draft.carts.push(current);
        }
        const same = current.lines.find(
          (entry) =>
            entry.productId === line.productId &&
            entry.variantId === line.variantId &&
            entry.kind === line.kind &&
            entry.fabricId === line.fabricId,
        );
        if (same) same.qty += line.qty;
        else current.lines.push({ ...line, id: crypto.randomUUID() });
        cart = current;
      });
      return cart;
    },
    async updateQty(lineId: string, qty: number) {
      if (HTTP_ENABLED) {
        const cart = (await httpCart.updateQty(lineId, qty)) as Cart;
        emitCartChange();
        return cart;
      }
      await delay(80);
      assertCanShop();
      let cart!: Cart;
      mutate((draft) => {
        const current = draft.carts.find((entry) => entry.ownerId === ownerId());
        if (!current) return;
        const line = current.lines.find((entry) => entry.id === lineId);
        if (!line) return;
        if (qty <= 0) current.lines = current.lines.filter((entry) => entry.id !== lineId);
        else line.qty = qty;
        cart = current;
      });
      return cart ?? ensureCart(ownerId());
    },
    async remove(lineId: string) {
      if (HTTP_ENABLED) {
        await httpCart.removeLine(lineId);
        const cart = (await httpCart.get()) as Cart;
        emitCartChange();
        return cart;
      }
      return this.updateQty(lineId, 0);
    },
    async applyCoupon(code: string) {
      if (HTTP_ENABLED) {
        throw new Error("Apply coupons at checkout — bag coupons sync with the live order.");
      }
      await delay();
      assertCanShop();
      const coupon = getState().coupons.find(
        (item) => item.code.toUpperCase() === code.trim().toUpperCase() && item.active,
      );
      if (!coupon) return { error: "That code is not active." as const };
      if (new Date(coupon.expiresAt).getTime() < Date.now()) return { error: "That code has expired." as const };
      mutate((draft) => {
        const cart = draft.carts.find((entry) => entry.ownerId === ownerId());
        if (cart) cart.couponCode = coupon.code;
      });
      return coupon;
    },
    totals(cart: Cart) {
      const { subtotal, discount } = cartTotals(cart);
      return { subtotal, discount, payable: subtotal - discount };
    },
  },
  checkout: {
    async quoteShipping(fulfillment: "pickup_ibadan" | "delivery", subtotalKobo: number) {
      await delay(80);
      if (fulfillment === "pickup_ibadan" || subtotalKobo >= getState().settings.freeShippingKobo) return 0;
      return 3500_00;
    },
    async placeOrder(payload: PlaceOrderPayload) {
      if (HTTP_ENABLED) {
        const cart = (await httpCart.get()) as Cart | null;
        const lines = (cart?.lines ?? []).map((line) => ({
          productId: line.productId,
          ...(line.variantId ? { variantId: line.variantId } : {}),
          kind: line.kind,
          qty: line.qty,
        }));
        const placed = await httpOrders.place({
          lines,
          customer: {
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
          },
          fulfillment: payload.fulfillment,
          address: payload.address,
          couponCode: payload.couponCode,
        });
        const order = (await httpOrders.get(placed.orderId)) as Order | null;
        if (order) return order;
        return {
          id: placed.orderId,
          number: placed.orderNumber,
          totalKobo: placed.totalKobo,
          depositKobo: placed.depositKobo,
          status: "pending_payment",
        } as Order;
      }
      await delay();
      assertCanShop();
      return createOrderFromCart(payload);
    },
  },
  payments: {
    async list() {
      if (HTTP_ENABLED) return (await httpPayments.list()) as Payment[];
      await delay();
      const user = requireUser();
      if (user.role === "client") {
        return getState().payments.filter((item) => item.customerId === user.id);
      }
      assertRoles(["super_admin", "manager", "finance", "desk"], "view payments", "payments");
      return getState().payments;
    },
    async getByOrder(orderId: string) {
      await delay(80);
      return getState().payments.filter((item) => item.orderId === orderId);
    },
    async initializePaystack(orderId: string, amountKobo: number) {
      if (HTTP_ENABLED) {
        const init = await httpPayments.initializePaystack(orderId, "full");
        return { reference: init.reference, demo: false as const, amountKobo: init.amountKobo };
      }
      await delay();
      return { reference: `PAY_demo_${orderId}_${Date.now()}`, demo: true as const, amountKobo };
    },
    async completePaystack(orderId: string, amountKobo: number, type: Payment["type"] = "balance") {
      if (HTTP_ENABLED) {
        throw new Error("Use Paystack checkout — local demo settlement is off while the API is connected.");
      }
      await delay();
      const reference = `PAY_demo_${orderId}_${Date.now()}`;
      let payment!: Payment;
      mutate((draft) => {
        const order = draft.orders.find((item) => item.id === orderId);
        if (!order) throw new Error("Order not found.");
        const hadSuccess = draft.payments.some((p) => p.orderId === orderId && p.status === "successful");
        payment = {
          id: crypto.randomUUID(),
          orderId,
          customerId: order.customerId,
          amountKobo,
          type,
          method: "paystack",
          status: "successful",
          paystackReference: reference,
          submittedAt: nowIso(),
        };
        draft.payments.unshift(payment);
        order.paidKobo += amountKobo;
        if (order.paidKobo >= order.totalKobo) {
          order.status = order.kind === "ready_to_wear" ? "confirmed" : order.status === "awaiting_transfer" ? "production" : order.status;
          if (order.status === "pending_payment") order.status = "confirmed";
        }
        if (order.kind === "ready_to_wear" && !hadSuccess) {
          applyStockForOrderItems(draft, orderId, -1);
        }
      });
      return payment;
    },
    async submitTransfer(
      orderId: string,
      input: { transactionNumber: string; receiptFile?: File; receiptDataUrl?: string; amountKobo: number; type?: Payment["type"] },
    ) {
      if (HTTP_ENABLED) {
        let receiptUrl = input.receiptDataUrl;
        if (input.receiptFile && !receiptUrl) {
          const up = await httpUploads.upload(input.receiptFile, "receipts");
          receiptUrl = up.url;
        }
        await httpPayments.submitTransfer({
          orderId,
          transactionNumber: input.transactionNumber,
          receiptUrl,
          type: input.type ?? "full",
        });
        return {
          id: `xfer_${orderId}`,
          orderId,
          amountKobo: input.amountKobo,
          type: input.type ?? "full",
          method: "bank_transfer",
          status: "awaiting_verification",
          transactionNumber: input.transactionNumber,
          submittedAt: nowIso(),
        } as Payment;
      }
      await delay();
      const receipt =
        input.receiptDataUrl ?? (input.receiptFile ? await fileToDataUrl(input.receiptFile) : "");
      if (!input.transactionNumber.trim() || !receipt) {
        throw new Error("Transaction number and receipt are required.");
      }
      let payment!: Payment;
      mutate((draft) => {
        const order = draft.orders.find((item) => item.id === orderId);
        if (!order) throw new Error("Order not found.");
        payment = {
          id: crypto.randomUUID(),
          orderId,
          customerId: order.customerId,
          amountKobo: input.amountKobo,
          type: input.type ?? "full",
          method: "bank_transfer",
          status: "awaiting_verification",
          transactionNumber: input.transactionNumber.trim(),
          receiptDataUrl: receipt,
          submittedAt: nowIso(),
        };
        draft.payments.unshift(payment);
        order.status = "awaiting_transfer";
      });
      return payment;
    },
    async reviewTransfer(paymentId: string, decision: "approve" | "reject", reason?: string) {
      if (HTTP_ENABLED) {
        if (decision === "approve") await httpPayments.approve(paymentId);
        else await httpPayments.reject(paymentId, reason);
        return { id: paymentId, status: decision === "approve" ? "successful" : "rejected" } as Payment;
      }
      await delay();
      const actor = assertRoles(["super_admin", "manager", "finance"], "review transfers", "payments");
      let payment!: Payment;
      mutate((draft) => {
        const row = draft.payments.find((item) => item.id === paymentId);
        if (!row) throw new Error("Payment not found.");
        row.status = decision === "approve" ? "successful" : "rejected";
        row.verifiedBy = actor.id;
        row.rejectionReason = reason;
        const order = draft.orders.find((item) => item.id === row.orderId);
        if (order && decision === "approve") {
          order.paidKobo += row.amountKobo;
          const hadSuccess = draft.payments.some((p) => p.orderId === order.id && p.status === "successful" && p.id !== row.id);
          if (order.kind === "ready_to_wear") {
            order.status = "confirmed";
            if (!hadSuccess) applyStockForOrderItems(draft, order.id, -1);
          } else if (order.status === "awaiting_transfer" || order.status === "pending_payment") {
            order.status = "production";
            const prod = draft.productionOrders.find((item) => item.orderId === order.id);
            if (prod && prod.stage === "quote_accepted") prod.stage = "deposit_paid";
          }
        }
        payment = row;
      });
      audit(actor.id, "payment.review", `${decision} ${paymentId}`);
      return payment;
    },
  },
  orders: {
    async listMine() {
      if (HTTP_ENABLED) return (await httpOrders.list()) as Order[];
      await delay();
      const user = requireUser();
      return getState().orders.filter((item) => item.customerId === user.id);
    },
    async listAll() {
      if (HTTP_ENABLED) return (await httpOrders.list()) as Order[];
      await delay();
      assertRoles(["super_admin", "manager", "desk", "finance", "designer"], "list all orders", "orders");
      return getState().orders;
    },
    async get(id: string) {
      if (HTTP_ENABLED) return (await httpOrders.get(id)) as Order | null;
      await delay();
      const order = getState().orders.find((item) => item.id === id);
      if (!order) return null;
      const user = currentUser();
      if (user?.role === "client" && order.customerId !== user.id) throw new ForbiddenError();
      return order;
    },
    async updateStatus(id: string, status: Order["status"]) {
      if (HTTP_ENABLED) {
        await httpOrders.updateStatus(id, status);
        return (await httpOrders.get(id)) as Order;
      }
      await delay();
      const actor = assertRoles(["super_admin", "manager", "desk"], "update order status", "orders");
      mutate((draft) => {
        const order = draft.orders.find((item) => item.id === id);
        if (order) {
          if (status === "cancelled" && order.kind === "ready_to_wear") {
            applyStockForOrderItems(draft, id, 1);
          }
          order.status = status;
        }
      });
      audit(actor.id, "order.status", `#${id} → ${status}`);
      return getState().orders.find((item) => item.id === id)!;
    },
    async payBalance(orderId: string, payment: PlaceOrderPayload["payment"]) {
      if (HTTP_ENABLED) {
        if (payment.method === "paystack") {
          const { openPaystackCheckout } = await import("../lib/paystack");
          const order = (await httpOrders.get(orderId)) as Order;
          await openPaystackCheckout({
            orderId,
            email: order.customerEmail,
            amountKobo: Math.max(0, order.totalKobo - order.paidKobo),
            type: "balance",
          });
          return { id: orderId, status: "pending_payment" } as unknown as Payment;
        }
        await httpPayments.submitTransfer({
          orderId,
          transactionNumber: payment.transactionNumber,
          receiptUrl: payment.receiptDataUrl,
          type: "balance",
        });
        return {
          id: `bal_${orderId}`,
          orderId,
          method: "bank_transfer",
          status: "awaiting_verification",
        } as Payment;
      }
      await delay();
      const order = getState().orders.find((item) => item.id === orderId);
      if (!order) throw new Error("Order not found.");
      const due = Math.max(0, order.totalKobo - order.paidKobo);
      if (due <= 0) throw new Error("This order is already settled.");
      if (payment.method === "paystack") {
        return db.payments.completePaystack(orderId, due, "balance");
      }
      return db.payments.submitTransfer(orderId, {
        transactionNumber: payment.transactionNumber,
        receiptDataUrl: payment.receiptDataUrl,
        amountKobo: due,
        type: "balance",
      });
    },
    async items(orderId: string) {
      await delay(40);
      if (HTTP_ENABLED) return [];
      return getState().orderItems.filter((item) => item.orderId === orderId);
    },
    async trackPublic(number: string) {
      if (HTTP_ENABLED) {
        const order = (await httpOrders.track(number)) as Order | null;
        if (!order) return null;
        return {
          number: order.number,
          name: order.name,
          image: order.image,
          kind: order.kind,
          status: order.status,
          createdAt: order.createdAt,
          fulfillment: order.fulfillment,
          stage: null,
          customerName: order.customerName,
        };
      }
      await delay();
      const cleaned = number.replace(/^#/, "").trim();
      const order = getState().orders.find((item) => item.number === cleaned);
      if (!order) return null;
      const production = getState().productionOrders.find((item) => item.orderId === order.id) ?? null;
      return {
        number: order.number,
        name: order.name,
        image: order.image,
        kind: order.kind,
        status: order.status,
        createdAt: order.createdAt,
        fulfillment: order.fulfillment,
        stage: production?.stage ?? null,
        customerName: order.customerName,
      };
    },
    async reorder(orderId: string) {
      if (HTTP_ENABLED) {
        throw new Error("Re-order from the catalogue while the live API is on — bag sync is coming.");
      }
      await delay();
      const user = requireUser();
      if (user.role !== "client") throw new ForbiddenError("House staff cannot re-order as clients.");
      const order = getState().orders.find((item) => item.id === orderId);
      if (!order || order.customerId !== user.id) throw new Error("Order not found.");
      const items = getState().orderItems.filter((item) => item.orderId === orderId);
      const productIds = items.map((item) => item.productId).filter(Boolean) as string[];
      if (order.productId) productIds.push(order.productId);
      const unique = [...new Set(productIds)];
      if (!unique.length) {
        throw new Error("This ticket has no catalogue look to re-order. Request a new custom instead.");
      }
      let added = 0;
      mutate((draft) => {
        let current = draft.carts.find((entry) => entry.ownerId === user.id);
        if (!current) {
          current = { id: `cart_${user.id}`, ownerId: user.id, lines: [] };
          draft.carts.push(current);
        }
        for (const productId of unique) {
          const product = draft.products.find((item) => item.id === productId);
          if (!product || product.priceOnRequest) continue;
          current.lines.push({
            id: crypto.randomUUID(),
            productId,
            kind: product.sellsRtw ? "rtw" : "mtm",
            qty: 1,
          });
          added += 1;
        }
      });
      if (!added) throw new Error("Those looks need a price quote. Open a custom request instead.");
      return added;
    },
  },
  wishlist: {
    async list() {
      await delay(80);
      const user = requireUser();
      if (user.role !== "client") throw new ForbiddenError("House staff cannot keep a client wishlist.");
      const ids = getState().wishlists.filter((item) => item.userId === user.id).map((item) => item.productId);
      return getState().products.filter((item) => ids.includes(item.id));
    },
    async add(productId: string) {
      await delay();
      const user = requireUser();
      if (user.role !== "client") throw new ForbiddenError("House staff cannot keep a client wishlist.");
      mutate((draft) => {
        if (draft.wishlists.some((item) => item.userId === user.id && item.productId === productId)) return;
        draft.wishlists.push({ id: crypto.randomUUID(), userId: user.id, productId });
      });
    },
    async remove(productId: string) {
      await delay();
      const user = requireUser();
      if (user.role !== "client") throw new ForbiddenError("House staff cannot keep a client wishlist.");
      mutate((draft) => {
        draft.wishlists = draft.wishlists.filter(
          (item) => !(item.userId === user.id && item.productId === productId),
        );
      });
    },
  },
  measurements: {
    async listByCustomer(customerId: string) {
      await delay();
      const user = currentUser();
      if (user?.role === "client" && user.id !== customerId) throw new ForbiddenError();
      return getState().measurementProfiles.filter((item) => item.customerId === customerId);
    },
    async get(id: string) {
      await delay(80);
      return getState().measurementProfiles.find((item) => item.id === id) ?? null;
    },
    async create(input: Omit<MeasurementProfile, "id" | "measuredAt">) {
      await delay();
      const user = requireUser();
      if (user.role === "client") input.customerId = user.id;
      if (user.role !== "client" && (!input.customerId || input.customerId === user.id)) {
        throw new ForbiddenError("House staff cannot keep a client tape on their own book.");
      }
      const profile: MeasurementProfile = {
        ...input,
        id: crypto.randomUUID(),
        measuredAt: nowIso(),
      };
      mutate((draft) => {
        draft.measurementProfiles.push(profile);
      });
      return profile;
    },
    snapshotForOrder(profileId: string) {
      return getState().measurementProfiles.find((item) => item.id === profileId)?.values ?? {};
    },
  },
  customDesigns: {
    async create(input: Omit<CustomDesignRequest, "id" | "status" | "createdAt" | "customerId"> & { customerId?: string }) {
      if (HTTP_ENABLED) {
        const user = currentUser();
        if (user && user.role !== "client") {
          throw new ForbiddenError("House staff cannot request garments as clients.");
        }
        return (await httpCustom.create({
          outfitType: input.outfitType,
          occasion: input.occasion,
          colour: input.colour,
          budget: input.budget,
          deliveryDate: input.deliveryDate,
          description: input.description,
          consultation: input.consultation,
        })) as CustomDesignRequest;
      }
      await delay();
      const user = currentUser();
      if (user && user.role !== "client") {
        throw new ForbiddenError("House staff cannot request garments as clients.");
      }
      const customerId = input.customerId ?? user?.id;
      if (!customerId) throw new Error("Sign in to request a garment.");
      const row: CustomDesignRequest = {
        ...input,
        customerId,
        id: crypto.randomUUID(),
        status: "new",
        createdAt: nowIso(),
      };
      mutate((draft) => {
        draft.customDesignRequests.unshift(row);
      });
      return row;
    },
    async listMine() {
      if (HTTP_ENABLED) return (await httpCustom.listMine()) as CustomDesignRequest[];
      await delay();
      const user = requireUser();
      if (user.role !== "client") throw new ForbiddenError("House staff cannot request garments as clients.");
      return getState().customDesignRequests.filter((item) => item.customerId === user.id);
    },
    async listAll() {
      if (HTTP_ENABLED) return (await httpCustom.listRequests()) as CustomDesignRequest[];
      await delay();
      assertRoles(["super_admin", "manager", "desk", "designer"], "list design requests", "custom");
      return getState().customDesignRequests;
    },
    async get(id: string) {
      if (HTTP_ENABLED) {
        const all = (await httpCustom.listRequests()) as CustomDesignRequest[];
        return all.find((item) => item.id === id) ?? null;
      }
      await delay();
      return getState().customDesignRequests.find((item) => item.id === id) ?? null;
    },
  },
  quotations: {
    async createFromRequest(
      requestId: string,
      input: { description: string; totalKobo: number; depositKobo: number; customerId?: string },
    ) {
      if (HTTP_ENABLED) {
        const request = getState().customDesignRequests.find((item) => item.id === requestId);
        const customerId = input.customerId || request?.customerId;
        if (!customerId) throw new Error("Customer missing on request.");
        return (await httpQuotations.create({ customerId, requestId, ...input })) as unknown as Quotation;
      }
      await delay();
      const actor = assertRoles(["super_admin", "manager", "desk", "designer"], "quote", "quotes");
      const request = getState().customDesignRequests.find((item) => item.id === requestId);
      if (!request) throw new Error("Request not found.");
      const year = new Date().getFullYear();
      const seq = String(getState().quotations.length + 12).padStart(5, "0");
      const quote = {
        id: crypto.randomUUID(),
        number: `Q-${year}-${seq}`,
        customerId: request.customerId,
        requestId,
        description: input.description,
        totalKobo: input.totalKobo,
        depositKobo: input.depositKobo,
        status: "sent" as const,
        createdAt: nowIso(),
      };
      mutate((draft) => {
        draft.quotations.unshift(quote);
        const row = draft.customDesignRequests.find((item) => item.id === requestId);
        if (row) row.status = "quoted";
      });
      audit(actor.id, "quote.create", quote.number);
      return quote;
    },
    async accept(id: string): Promise<Order> {
      if (HTTP_ENABLED) {
        await httpQuotations.accept(id);
        const orders = (await httpOrders.list()) as Order[];
        const pending = orders.find((item) => item.status === "pending_payment" && item.kind === "bespoke");
        if (pending) return pending;
        throw new Error("Quote accepted — open Payments to pay your deposit.");
      }
      await delay();
      const user = requireUser();
      const quote = getState().quotations.find((item) => item.id === id);
      if (!quote) throw new Error("Quote not found.");
      if (user.role === "client" && quote.customerId !== user.id) throw new ForbiddenError();
      let order!: Order;
      mutate((draft) => {
        const row = draft.quotations.find((item) => item.id === id)!;
        row.status = "accepted";
        const number = allocateOrderNumber(draft);
        const person = draft.users.find((entry) => entry.id === row.customerId);
        order = {
          id: `order_${number.replace(/\W/g, "_")}`,
          number,
          customerId: row.customerId,
          customerName: person?.name ?? "Client",
          customerEmail: person?.email ?? "",
          customerPhone: person?.phone ?? "",
          kind: "bespoke",
          status: "pending_payment",
          name: row.description,
          image: "/images/agb2003.jpg",
          qty: 1,
          subtotalKobo: row.totalKobo,
          shippingKobo: 0,
          discountKobo: 0,
          totalKobo: row.totalKobo,
          depositKobo: row.depositKobo,
          paidKobo: 0,
          fulfillment: "pickup_ibadan",
          createdAt: nowIso(),
        };
        draft.orders.unshift(order);
        draft.orderItems.push({
          id: crypto.randomUUID(),
          orderId: order.id,
          name: row.description,
          qty: 1,
          unitKobo: row.totalKobo,
        });
        draft.productionOrders.unshift({
          id: `prod_${number}`,
          orderId: order.id,
          customerId: row.customerId,
          garment: row.description,
          stage: "quote_accepted",
          assigneeId: pickFloorTailor(draft),
          dueDate: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
        });
        const client = draft.users.find((entry) => entry.id === row.customerId);
        if (client) {
          draft.notifications.unshift({
            id: crypto.randomUUID(),
            userId: client.id,
            title: "Quote accepted",
            body: `Order #${order.number} is open — pay the deposit from Payments.`,
            createdAt: nowIso(),
            read: false,
          });
        }
      });
      return order;
    },
    async revise(id: string, input: { description?: string; totalKobo?: number; depositKobo?: number }) {
      if (HTTP_ENABLED) {
        await httpQuotations.revise(id, input);
        const list = (await httpQuotations.list()) as Quotation[];
        const row = list.find((item) => item.id === id);
        if (!row) throw new Error("Quote revised.");
        return row;
      }
      await delay();
      assertRoles(["super_admin", "manager", "desk", "designer"], "revise quotes", "quotes");
      const quote = getState().quotations.find((item) => item.id === id);
      if (!quote) throw new Error("Quote not found.");
      if (quote.status !== "sent") throw new Error("Only sent quotes can be revised.");
      mutate((draft) => {
        const row = draft.quotations.find((item) => item.id === id);
        if (!row) return;
        if (input.description) row.description = input.description;
        if (input.totalKobo) row.totalKobo = input.totalKobo;
        if (input.depositKobo) row.depositKobo = input.depositKobo;
      });
      return getState().quotations.find((item) => item.id === id)!;
    },
    async reject(id: string) {
      if (HTTP_ENABLED) { await httpQuotations.reject(id); return; }
      await delay();
      const user = requireUser();
      const quote = getState().quotations.find((item) => item.id === id);
      if (!quote) throw new Error("Quote not found.");
      if (user.role === "client" && quote.customerId !== user.id) {
        throw new ForbiddenError("That quote is not on your book.");
      }
      mutate((draft) => {
        const row = draft.quotations.find((item) => item.id === id);
        if (row) row.status = user.role === "client" ? "declined" : "rejected";
      });
    },
    async listMine() {
      await delay();
      const user = requireUser();
      return getState().quotations.filter((item) => item.customerId === user.id);
    },
    async listAll() {
      await delay();
      assertRoles(["super_admin", "manager", "desk", "designer"], "list quotes", "quotes");
      return getState().quotations;
    },
  },
  production: {
    async listBoard() {
      if (HTTP_ENABLED) return (await httpProduction.list()) as ProductionOrder[];
      await delay();
      const user = requireUser();
      if (user.role === "client") throw new ForbiddenError();
      if (
        user.role !== "super_admin" &&
        !["production", "queue", "bench"].some((section) => canSeeSection(user, section as NavSection))
      ) {
        throw new ForbiddenError("Your access cannot see the floor board.");
      }
      if (user.role === "tailor") {
        return getState().productionOrders.filter((item) => item.assigneeId === user.id);
      }
      if (user.role === "cutter") {
        return getState().productionOrders.filter(
          (item) => item.assigneeId === user.id || item.stage === "cutting",
        );
      }
      if (user.role === "qc") {
        return getState().productionOrders.filter(
          (item) => item.stage === "quality_check" || item.stage === "finishing" || item.assigneeId === user.id,
        );
      }
      return getState().productionOrders;
    },
    async moveStage(productionOrderId: string, stage: ProductionStage): Promise<ProductionOrder> {
      if (HTTP_ENABLED) {
        await httpProduction.advance(productionOrderId, stage);
        const board = (await httpProduction.list()) as ProductionOrder[];
        const job = board.find((item) => item.id === productionOrderId);
        if (!job) throw new Error("Production ticket not found after advance.");
        return job;
      }
      await delay();
      const actor = requireUser();
      if (actor.role === "client") throw new ForbiddenError();
      if (
        actor.role !== "super_admin" &&
        !["production", "queue", "bench"].some((section) => canSeeSection(actor, section as NavSection))
      ) {
        throw new ForbiddenError("Your access cannot move the floor.");
      }
      const job = getState().productionOrders.find((item) => item.id === productionOrderId);
      if (!job) throw new Error("Ticket not found.");
      if (actor.role === "cutter" && job.stage !== "cutting" && stage !== "sewing") {
        throw new ForbiddenError("Cutters move cutting tickets.");
      }
      if (actor.role === "qc" && !["quality_check", "finishing", "ready"].includes(stage) && job.stage !== "quality_check") {
        throw new ForbiddenError("QC own finishing.");
      }
      if (actor.role === "finance") throw new ForbiddenError();
      mutate((draft) => {
        const row = draft.productionOrders.find((item) => item.id === productionOrderId);
        if (!row) return;
        row.stage = stage;
        const order = draft.orders.find((item) => item.id === row.orderId);
        if (order) {
          if (stage === "ready") order.status = "ready";
          else if (stage === "completed") order.status = "delivered";
          else order.status = "production";
        }
      });
      audit(actor.id, "production.stage", `${job.garment} → ${stage}`);
      return getState().productionOrders.find((item) => item.id === productionOrderId)!;
    },
    async assignTask(productionOrderId: string, staffUserId: string) {
      await delay();
      assertRoles(["super_admin", "manager", "desk"], "assign the floor", "production");
      mutate((draft) => {
        const row = draft.productionOrders.find((item) => item.id === productionOrderId);
        if (row) row.assigneeId = staffUserId;
      });
    },
    async getByOrder(orderId: string) {
      await delay(40);
      return getState().productionOrders.find((item) => item.orderId === orderId) ?? null;
    },
  },
  fittings: {
    async list() {
      await delay();
      const user = requireUser();
      if (user.role === "client") throw new ForbiddenError();
      if (!canSeeSection(user, "fittings") && !canSeeSection(user, "production") && !canSeeSection(user, "queue")) {
        throw new ForbiddenError("Your access cannot see fittings.");
      }
      return getState().fittings;
    },
    async create(input: { orderId: string; date: string; notes: string }) {
      await delay();
      assertRoles(["super_admin", "manager", "desk", "tailor", "cutter", "qc"], "book a fitting", "fittings");
      const row = { id: crypto.randomUUID(), status: "scheduled" as const, ...input };
      mutate((draft) => {
        draft.fittings.push(row);
      });
      return row;
    },
    async update(id: string, patch: Partial<{ notes: string; status: "scheduled" | "done"; date: string }>) {
      await delay();
      assertRoles(["super_admin", "manager", "desk", "tailor", "cutter", "qc"], "update a fitting", "fittings");
      mutate((draft) => {
        const row = draft.fittings.find((item) => item.id === id);
        if (row) Object.assign(row, patch);
      });
    },
  },
  appointments: {
    async create(input: {
      service: string;
      date: string;
      time: string;
      location: string;
      notes: string;
      customerName?: string;
    }) {
      if (HTTP_ENABLED) {
        const user = currentUser();
        if (user && user.role !== "client") {
          if (!canSeeSection(user, "appointments")) {
            throw new ForbiddenError("Your access cannot book the house diary.");
          }
          if (!input.customerName?.trim()) {
            throw new Error("Name the client on the book. Staff cannot reserve a slot as themselves.");
          }
        }
        const created = await httpAppointments.create({
          customerName: input.customerName ?? user?.name ?? "Guest",
          service: input.service,
          date: input.date,
          time: input.time,
          location: input.location,
          notes: input.notes,
        });
        return {
          id: created.id,
          customerId: user?.role === "client" ? user.id : "guest",
          customerName: input.customerName ?? user?.name ?? "Guest",
          service: input.service,
          date: input.date,
          time: input.time,
          location: input.location,
          notes: input.notes,
          status: "requested" as const,
          reference: created.reference,
        };
      }
      await delay();
      const user = currentUser();
      if (user && user.role !== "client") {
        if (!canSeeSection(user, "appointments")) {
          throw new ForbiddenError("Your access cannot book the house diary.");
        }
        if (!input.customerName?.trim()) {
          throw new Error("Name the client on the book. Staff cannot reserve a slot as themselves.");
        }
      }
      const row = {
        id: crypto.randomUUID(),
        customerId: user?.role === "client" ? user.id : "guest",
        customerName: input.customerName ?? user?.name ?? "Guest",
        service: input.service,
        date: input.date,
        time: input.time,
        location: input.location || getState().settings.pickupLocation,
        notes: input.notes,
        status: "requested" as const,
      };
      mutate((draft) => {
        draft.appointments.unshift(row);
      });
      return row;
    },
    async listMine() {
      if (HTTP_ENABLED) return (await httpAppointments.listMine()) as ReturnType<typeof getState>["appointments"];
      await delay();
      const user = requireUser();
      if (user.role !== "client") throw new ForbiddenError("House staff cannot hold a client diary.");
      return getState().appointments.filter((item) => item.customerId === user.id);
    },
    async listAll() {
      if (HTTP_ENABLED) return (await httpAppointments.list()) as ReturnType<typeof getState>["appointments"];
      await delay();
      assertRoles(["super_admin", "manager", "desk", "tailor", "cutter", "qc"], "see the book", "appointments");
      return getState().appointments;
    },
    async setStatus(id: string, status: "requested" | "confirmed" | "completed" | "cancelled") {
      if (HTTP_ENABLED) {
        await httpAppointments.setStatus(id, status);
        return;
      }
      await delay();
      assertRoles(["super_admin", "manager", "desk"], "confirm appointments", "appointments");
      mutate((draft) => {
        const row = draft.appointments.find((item) => item.id === id);
        if (row) row.status = status;
      });
    },
  },
  leads: {
    async createFromWhatsApp(productId: string) {
      if (HTTP_ENABLED) {
        await httpPublic.lead({ productId });
        return { id: productId, productId, sku: "", status: "unclaimed" as const, createdAt: nowIso() };
      }
      await delay(80);
      const actor = currentUser();
      if (actor && actor.role !== "client") {
        throw new ForbiddenError("House staff should use the CRM, not WhatsApp leads.");
      }
      const product = getState().products.find((item) => item.id === productId);
      if (!product) return null;
      const lead = {
        id: crypto.randomUUID(),
        productId,
        sku: product.sku,
        status: "unclaimed" as const,
        createdAt: nowIso(),
      };
      mutate((draft) => {
        draft.leads.unshift(lead);
      });
      return lead;
    },
    async listUnclaimed() {
      if (HTTP_ENABLED) {
        const leads = (await httpLeads.list()) as { status: string }[];
        return leads.filter((item) => item.status === "unclaimed");
      }
      await delay();
      assertRoles(["super_admin", "manager", "desk"], "see WhatsApp leads", "customers");
      return getState().leads.filter((item) => item.status === "unclaimed");
    },
    async list() {
      if (HTTP_ENABLED) return (await httpLeads.list()) as ReturnType<typeof getState>["leads"];
      await delay();
      assertRoles(["super_admin", "manager", "desk"], "see WhatsApp leads", "customers");
      return getState().leads;
    },
    async claim(id: string, options?: { openTicket?: boolean }) {
      if (HTTP_ENABLED) return (await httpLeads.claim(id, options ?? {})) as { ok: boolean; orderNumber?: string };
      await delay();
      const actor = assertRoles(["super_admin", "manager", "desk"], "claim a lead", "customers");
      let orderNumber: string | undefined;
      mutate((draft) => {
        const row = draft.leads.find((item) => item.id === id);
        if (!row) return;
        row.status = "claimed";
        if (options?.openTicket) {
          const product = draft.products.find((item) => item.id === row.productId);
          const number = allocateOrderNumber(draft);
          const orderId = `order_${number.replace(/\W/g, "_")}`;
          draft.orders.unshift({
            id: orderId,
            number,
            customerId: "walkin",
            customerName: `WhatsApp lead · ${row.sku}`,
            customerEmail: "",
            customerPhone: "",
            kind: "bespoke",
            status: "pending_payment",
            productId: product?.id,
            sku: row.sku,
            name: product?.name ?? row.sku,
            image: product?.image,
            qty: 1,
            subtotalKobo: product?.priceKobo ?? 0,
            shippingKobo: 0,
            discountKobo: 0,
            totalKobo: product?.priceKobo ?? 0,
            depositKobo: product?.priceKobo ?? 0,
            paidKobo: 0,
            fulfillment: "pickup_ibadan",
            createdAt: nowIso(),
          });
          row.orderNumber = number;
          orderNumber = number;
        }
      });
      audit(actor.id, "lead.claim", orderNumber ? `#${orderNumber}` : id);
      return { orderNumber };
    },
  },
  tickets: {
    async create(input: { name: string; email: string; phone: string; subject: string; message: string }) {
      await delay();
      const row = {
        id: crypto.randomUUID(),
        createdAt: nowIso(),
        status: "open" as const,
        replies: [],
        ...input,
      };
      mutate((draft) => {
        draft.tickets.unshift(row);
      });
      return row;
    },
    async list() {
      await delay();
      assertRoles(["super_admin", "manager", "desk"], "read the desk", "support");
      return getState().tickets;
    },
    async listMine() {
      await delay();
      const user = requireUser();
      return getState().tickets.filter(
        (item) => item.customerId === user.id || item.email.toLowerCase() === user.email.toLowerCase(),
      );
    },
    async reply(id: string, body: string) {
      await delay();
      const actor = assertRoles(["super_admin", "manager", "desk"], "reply on a ticket", "support");
      mutate((draft) => {
        const row = draft.tickets.find((item) => item.id === id);
        if (row) row.replies.push({ at: nowIso(), staffId: actor.id, body });
      });
      audit(actor.id, "ticket.reply", id);
    },
    async setStatus(id: string, status: "open" | "closed") {
      await delay();
      assertRoles(["super_admin", "manager", "desk"], "close a ticket", "support");
      mutate((draft) => {
        const row = draft.tickets.find((item) => item.id === id);
        if (row) row.status = status;
      });
    },
  },
  newsletter: {
    async subscribe(email: string) {
      if (HTTP_ENABLED) {
        await httpPublic.newsletter(email.trim().toLowerCase());
        return;
      }
      await delay();
      const cleaned = email.trim().toLowerCase();
      mutate((draft) => {
        if (!draft.subscribers.includes(cleaned)) draft.subscribers.push(cleaned);
      });
    },
  },
  content: {
    async homepage() {
      if (HTTP_ENABLED) return (await httpContent.homepage()) as HomepageContent;
      await delay(80);
      return getState().homepage;
    },
    async journal() {
      if (HTTP_ENABLED) return (await httpContent.journal()) as BlogPost[];
      await delay(80);
      return getState().journalPosts;
    },
    async journalBySlug(slug: string) {
      if (HTTP_ENABLED) {
        const posts = (await httpContent.journal()) as BlogPost[];
        return posts.find((item) => item.slug === slug) ?? null;
      }
      await delay();
      return getState().journalPosts.find((item) => item.slug === slug) ?? null;
    },
    async events() {
      if (HTTP_ENABLED) return (await httpContent.events()) as EventItem[];
      await delay(80);
      return getState().events;
    },
    async eventBySlug(slug: string) {
      if (HTTP_ENABLED) return ((await httpContent.event(slug)) as EventItem | null) ?? null;
      await delay();
      return getState().events.find((item) => item.slug === slug) ?? null;
    },
    async lookbook() {
      if (HTTP_ENABLED) return (await httpContent.lookbook()) as LookbookItem[];
      await delay(80);
      return getState().lookbookItems;
    },
    async coupons() {
      await delay(40);
      return getState().coupons;
    },
    async coupon(code: string) {
      await delay(40);
      return getState().coupons.find((item) => item.code === code) ?? null;
    },
    async updateHomepage(patch: Partial<HomepageContent>) {
      if (HTTP_ENABLED) return (await httpContent.updateHomepage(patch as Record<string, unknown>)) as HomepageContent;
      await delay();
      const actor = assertRoles(["super_admin", "content", "manager"], "edit the house front", "content");
      mutate((draft) => {
        draft.homepage = { ...draft.homepage, ...patch };
      });
      audit(actor.id, "content.homepage", "homepage patched");
      return getState().homepage;
    },
    async saveJournal(post: Omit<BlogPost, "id"> & { id?: string }) {
      if (HTTP_ENABLED) {
        return (await httpContent.saveJournal(post as Record<string, unknown> & { id?: string })) as BlogPost;
      }
      await delay();
      const actor = assertRoles(["super_admin", "content", "manager"], "edit the magazine", "content");
      let id = post.id;
      mutate((draft) => {
        if (id) {
          const row = draft.journalPosts.find((item) => item.id === id);
          if (row) Object.assign(row, post);
        } else {
          id = crypto.randomUUID();
          draft.journalPosts.unshift({ ...post, id });
        }
      });
      audit(actor.id, "content.journal", post.slug);
      return getState().journalPosts.find((item) => item.id === id)!;
    },
    async removeJournal(id: string) {
      if (HTTP_ENABLED) {
        await httpContent.removeJournal(id);
        return;
      }
      await delay();
      assertRoles(["super_admin", "content", "manager"], "edit the magazine", "content");
      mutate((draft) => {
        draft.journalPosts = draft.journalPosts.filter((item) => item.id !== id);
      });
    },
    async saveEvent(event: Omit<EventItem, "id"> & { id?: string }) {
      if (HTTP_ENABLED) {
        return (await httpContent.saveEvent(event as Record<string, unknown> & { id?: string })) as EventItem;
      }
      await delay();
      const actor = assertRoles(["super_admin", "content", "manager"], "edit events", "events");
      let id = event.id;
      mutate((draft) => {
        if (id) {
          const row = draft.events.find((item) => item.id === id);
          if (row) Object.assign(row, event);
        } else {
          id = crypto.randomUUID();
          draft.events.unshift({ ...event, id });
        }
      });
      audit(actor.id, "content.event", event.slug);
      return getState().events.find((item) => item.id === id)!;
    },
    async removeEvent(id: string) {
      if (HTTP_ENABLED) {
        await httpContent.removeEvent(id);
        return;
      }
      await delay();
      assertRoles(["super_admin", "content", "manager"], "edit events", "events");
      mutate((draft) => {
        draft.events = draft.events.filter((item) => item.id !== id);
      });
    },
    async saveLookbook(item: Omit<LookbookItem, "id"> & { id?: string }) {
      if (HTTP_ENABLED) {
        return (await httpContent.saveLookbook(item as Record<string, unknown>)) as LookbookItem;
      }
      await delay();
      const actor = assertRoles(["super_admin", "content", "manager", "designer"], "edit lookbook", "content");
      let id = item.id;
      mutate((draft) => {
        if (id) {
          const row = draft.lookbookItems.find((entry) => entry.id === id);
          if (row) Object.assign(row, item);
        } else {
          id = crypto.randomUUID();
          draft.lookbookItems.unshift({ ...item, id });
        }
      });
      audit(actor.id, "content.lookbook", item.title);
      return getState().lookbookItems.find((entry) => entry.id === id)!;
    },
    async removeLookbook(id: string) {
      if (HTTP_ENABLED) {
        await httpContent.removeLookbook(id);
        return;
      }
      await delay();
      assertRoles(["super_admin", "content", "manager", "designer"], "edit lookbook", "content");
      mutate((draft) => {
        draft.lookbookItems = draft.lookbookItems.filter((item) => item.id !== id);
      });
    },
    async mailbox() {
      await delay();
      assertRoles(["super_admin", "content", "manager"], "read house mail", "content");
      return getState().mailbox;
    },
  },
  analytics: {
    async studioOverview(): Promise<StudioOverview> {
      if (HTTP_ENABLED) return httpOverview.get();
      await delay();
      assertRoles(["super_admin", "manager", "finance"], "see analytics", "analytics");
      const paid = getState().payments.filter((item) => item.status === "successful");
      const revenueKobo = paid.reduce((sum, item) => sum + item.amountKobo, 0);
      const awaiting = getState().payments.filter((item) => item.status === "awaiting_verification").length;
      const openOrders = getState().orders.filter((item) =>
        ["confirmed", "processing", "production", "awaiting_transfer", "pending_payment"].includes(item.status),
      ).length;
      const rtw = paid
        .filter((item) => getState().orders.find((order) => order.id === item.orderId)?.kind === "ready_to_wear")
        .reduce((sum, item) => sum + item.amountKobo, 0);
      const mtm = paid
        .filter((item) => getState().orders.find((order) => order.id === item.orderId)?.kind === "made_to_measure")
        .reduce((sum, item) => sum + item.amountKobo, 0);
      const bespoke = paid
        .filter((item) => getState().orders.find((order) => order.id === item.orderId)?.kind === "bespoke")
        .reduce((sum, item) => sum + item.amountKobo, 0);
      return {
        revenueKobo,
        awaitingReceipts: awaiting,
        openOrders,
        lowFabrics: getState().fabrics.filter((item) => item.status === "low").length,
        unclaimedLeads: getState().leads.filter((item) => item.status === "unclaimed").length,
        mix: { rtw, mtm, bespoke },
        outstandingKobo: getState().orders.reduce(
          (sum, item) => sum + Math.max(0, item.totalKobo - item.paidKobo),
          0,
        ),
        activeBespoke: getState().orders.filter((item) => item.kind === "bespoke" && item.status === "production")
          .length,
        pipeline: getState().productionOrders.reduce<Record<string, number>>((map, item) => {
          map[item.stage] = (map[item.stage] ?? 0) + 1;
          return map;
        }, {}),
      };
    },
    async profit() {
      await delay();
      assertRoles(["super_admin", "manager", "finance"], "see profit", "analytics");
      const revenueKobo = getState()
        .payments.filter((item) => item.status === "successful")
        .reduce((sum, item) => sum + item.amountKobo, 0);
      const cogsKobo = Math.round(revenueKobo * 0.4);
      const profitKobo = revenueKobo - cogsKobo;
      const byKind = (["ready_to_wear", "made_to_measure", "bespoke"] as const).map((kind) => {
        const sales = getState()
          .orders.filter((item) => item.kind === kind)
          .reduce((sum, item) => sum + item.paidKobo, 0);
        return { kind, sales, cogs: Math.round(sales * 0.4), profit: sales - Math.round(sales * 0.4) };
      });
      return { revenueKobo, cogsKobo, profitKobo, margin: revenueKobo ? profitKobo / revenueKobo : 0, byKind };
    },
    async salesSeries() {
      await delay();
      assertRoles(["super_admin", "manager", "finance"], "see sales", "analytics");
      const anchor = demoToday();
      const days = Array.from({ length: 8 }, (_, index) => {
        const date = new Date(`${anchor}T12:00:00.000Z`);
        date.setDate(date.getDate() - (7 - index));
        const key = date.toISOString().slice(0, 10);
        const naira =
          getState()
            .payments.filter(
              (item) => item.status === "successful" && item.submittedAt.slice(0, 10) === key,
            )
            .reduce((sum, item) => sum + item.amountKobo, 0) / 100;
        return { day: key.slice(5), naira };
      });
      return days;
    },
    async track(
      type: string,
      payload?: Pick<AnalyticsEvent, "path" | "sku" | "channel" | "device" | "referrer">,
    ): Promise<void> {
      mutate((draft) => {
        draft.analyticsEvents.push({
          id: crypto.randomUUID(),
          type,
          path: payload?.path,
          sku: payload?.sku,
          channel: payload?.channel ?? "direct",
          device: payload?.device ?? "mobile",
          referrer: payload?.referrer,
          createdAt: nowIso(),
        });
      });
    },
    async traffic(range: "today" | "7d" | "30d" | "all" = "30d"): Promise<TrafficSnapshot> {
      if (HTTP_ENABLED) return (await httpTraffic.report(range)) as TrafficSnapshot;
      await delay();
      const actor = requireUser();
      if (actor.role !== "super_admin") {
        throw new ForbiddenError("Site traffic is for the house principal only.");
      }
      return trafficForRange(range);
    },
  },
  people: {
    async customers() {
      await delay();
      assertRoles(["super_admin", "manager", "desk", "finance"], "see clients", "customers");
      return getState().users.filter((item) => item.role === "client").map(publicUser);
    },
    async staff() {
      if (HTTP_ENABLED) return (await httpPeople.listStaff()) as PublicUser[];
      await delay();
      assertRoles(["super_admin", "manager"], "see staff", "people");
      return getState().users.filter((item) => item.role !== "client").map(publicUser);
    },
    async get(id: string) {
      await delay();
      const user = getState().users.find((item) => item.id === id);
      return user ? publicUser(user) : null;
    },
    async updateUser(
      id: string,
      patch: Partial<
        Pick<
          User,
          | "notes"
          | "phone"
          | "city"
          | "name"
          | "firstName"
          | "lastName"
          | "gender"
          | "address"
          | "birthDay"
          | "birthMonth"
          | "preferredFit"
          | "department"
          | "jobTitle"
          | "emergencyPhone"
          | "role"
          | "navSections"
        >
      >,
    ) {
      await delay();
      const actor = requireUser();
      if (patch.role || patch.navSections) {
        if (actor.role !== "super_admin") {
          throw new ForbiddenError("Only the house principal can change a role or nav access.");
        }
      } else {
        assertRoles(["super_admin", "manager", "desk"], "edit a client file", "customers");
      }
      if (patch.role === "client") throw new ForbiddenError("Staff cannot be converted to a client book.");
      if (patch.role && !patch.navSections) {
        patch = { ...patch, navSections: defaultNav(patch.role) };
      }
      mutate((draft) => {
        const row = draft.users.find((item) => item.id === id);
        if (row) Object.assign(row, patch);
      });
      audit(actor.id, "people.update", id);
      return publicUser(getState().users.find((item) => item.id === id)!);
    },
    async createStaff(input: {
      email: string;
      name: string;
      firstName: string;
      lastName?: string;
      phone: string;
      role: Role;
      department?: string;
      jobTitle?: string;
      gender?: Gender;
      address?: string;
      birthDay?: number;
      birthMonth?: number;
      emergencyPhone?: string;
      navSections?: NavSection[];
    }) {
      if (HTTP_ENABLED) {
        const hired = await httpPeople.hire({
          email: input.email,
          name: input.name,
          firstName: input.firstName,
          phone: input.phone,
          role: input.role,
          department: input.department,
          jobTitle: input.jobTitle,
        });
        if (input.navSections?.length) {
          await httpPeople.setNav(hired.id, input.navSections);
        }
        return {
          id: hired.id,
          email: input.email,
          name: input.name,
          firstName: input.firstName,
          role: input.role,
          navSections: input.navSections ?? [],
          mustChangePassword: true,
        } as PublicUser;
      }
      await delay();
      const actor = requireUser();
      if (actor.role !== "super_admin") {
        throw new ForbiddenError("Only the house principal can hire staff and assign access.");
      }
      if (input.role === "client") throw new Error("Staff cannot be opened as a client book.");
      if (getState().users.some((item) => item.email.toLowerCase() === input.email.toLowerCase())) {
        throw new Error("That email is already on the house file.");
      }
      const user: User = {
        id: `user_${crypto.randomUUID()}`,
        email: input.email.trim().toLowerCase(),
        password: DEMO_PASSWORD,
        role: input.role,
        name: input.name,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        city: "Ibadan",
        gender: input.gender,
        address: input.address ?? "Eunik HQ, Ibadan",
        birthDay: input.birthDay,
        birthMonth: input.birthMonth,
        department: input.department,
        jobTitle: input.jobTitle,
        emergencyPhone: input.emergencyPhone,
        mustChangePassword: true,
        navSections: input.navSections?.length ? input.navSections : defaultNav(input.role),
      };
      mutate((draft) => {
        draft.users.push(user);
      });
      audit(actor.id, "people.hire", user.email);
      return publicUser(user);
    },
    async setNav(userId: string, navSections: NavSection[]) {
      if (HTTP_ENABLED) { await httpPeople.setNav(userId, navSections); return null as unknown as PublicUser; }
      await delay();
      const actor = requireUser();
      if (actor.role !== "super_admin") {
        throw new ForbiddenError("Only the house principal can assign nav sections.");
      }
      const target = getState().users.find((item) => item.id === userId);
      if (!target) throw new Error("Staff file not found.");
      if (target.role === "client") throw new ForbiddenError("Client books do not carry house nav.");
      if (target.role === "super_admin") return publicUser(target);
      const next = navSections.includes("profile") ? navSections : ([...navSections, "profile"] as NavSection[]);
      mutate((draft) => {
        const row = draft.users.find((item) => item.id === userId);
        if (row) row.navSections = next;
      });
      audit(actor.id, "people.nav", `${target.email} · ${next.join(",")}`);
      return publicUser(getState().users.find((item) => item.id === userId)!);
    },
  },
  reviews: {
    async forProduct(productId: string) {
      await delay(80);
      return getState().reviews.filter((item) => item.productId === productId && item.status === "approved");
    },
    async listMine() {
      await delay();
      const user = requireUser();
      return getState().reviews.filter((item) => item.customerId === user.id);
    },
    async listAll() {
      await delay();
      assertRoles(["super_admin", "manager", "content", "desk"], "moderate reviews", "support");
      return getState().reviews;
    },
    async create(input: { productId: string; rating: number; body: string }) {
      await delay();
      const user = requireUser();
      if (user.role !== "client") throw new ForbiddenError("Reviews are written from a client book.");
      const product = getState().products.find((item) => item.id === input.productId);
      if (!product) throw new Error("Look not found.");
      const row: Review = {
        id: crypto.randomUUID(),
        productId: input.productId,
        customerId: user.id,
        customerName: user.name,
        rating: Math.min(5, Math.max(1, input.rating)),
        body: input.body.trim(),
        status: "pending",
        createdAt: nowIso(),
      };
      mutate((draft) => {
        draft.reviews.unshift(row);
      });
      return row;
    },
    async moderate(id: string, status: "approved" | "rejected") {
      await delay();
      const actor = assertRoles(["super_admin", "manager", "content"], "moderate reviews", "support");
      mutate((draft) => {
        const row = draft.reviews.find((item) => item.id === id);
        if (row) row.status = status;
      });
      audit(actor.id, "review.moderate", `${id} ${status}`);
    },
  },
  attendance: {
    async list() {
      await delay();
      const user = requireUser();
      if (user.role === "client") throw new ForbiddenError();
      if (!canSeeSection(user, "attendance")) {
        throw new ForbiddenError("Your access cannot see attendance.");
      }
      const rows = getState().attendance;
      if (["super_admin", "manager"].includes(user.role)) return rows;
      return rows.filter((item) => item.userId === user.id);
    },
    async clock(type: "in" | "out", note?: string) {
      await delay();
      const user = requireUser();
      if (user.role === "client") throw new ForbiddenError();
      const row = {
        id: crypto.randomUUID(),
        userId: user.id,
        type,
        at: nowIso(),
        note,
      };
      mutate((draft) => {
        draft.attendance.unshift(row);
      });
      return row;
    },
  },
  settings: {
    async get() {
      if (HTTP_ENABLED) return (await httpSettings.get()) as Settings;
      await delay(40);
      return getState().settings;
    },
    async update(patch: Partial<Settings>) {
      if (HTTP_ENABLED) {
        return (await httpStudioSettings.update(patch as Record<string, unknown>)) as Settings;
      }
      await delay();
      assertRoles(["super_admin"], "change house settings", "settings");
      mutate((draft) => {
        draft.settings = {
          ...draft.settings,
          ...patch,
          bank: { ...draft.settings.bank, ...(patch.bank ?? {}) },
        };
      });
      return getState().settings;
    },
  },
  notifications: {
    async listMine() {
      if (HTTP_ENABLED) return (await httpNotifications.listMine()) as Notification[];
      await delay(80);
      const user = currentUser();
      if (!user) return [];
      return getState().notifications.filter((item) => item.userId === user.id);
    },
    async markRead(id: string) {
      if (HTTP_ENABLED) { await httpNotifications.markRead(id); return; }
      await delay(40);
      mutate((draft) => {
        const row = draft.notifications.find((item) => item.id === id);
        if (row) row.read = true;
      });
    },
    async markAllRead() {
      if (HTTP_ENABLED) { await httpNotifications.markAllRead(); return; }
      await delay(40);
      const user = currentUser();
      if (!user) return;
      mutate((draft) => {
        draft.notifications.forEach((item) => {
          if (item.userId === user.id) item.read = true;
        });
      });
    },
  },
  audit: {
    async list() {
      if (HTTP_ENABLED) return (await httpAudit.list()) as AuditLog[];
      await delay();
      assertRoles(["super_admin", "manager"], "read the book", "people");
      return getState().auditLogs;
    },
  },
  search: {
    async all(q: string) {
      await delay();
      const query = q.trim().toLowerCase();
      if (!query) return { products: [], posts: [] };
      const products = getState().products.filter(
        (item) =>
          item.status === "live" &&
          (item.name.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query)),
      );
      const posts = getState().journalPosts.filter(
        (item) => item.title.toLowerCase().includes(query) || item.excerpt.toLowerCase().includes(query),
      );
      return { products, posts };
    },
  },
  async reset() {
    await delay();
    const actor = currentUser();
    if (actor && !["super_admin", "manager"].includes(actor.role)) {
      throw new ForbiddenError("Only the house can reset the demo.");
    }
    localStorage.removeItem(GUEST_KEY);
    writeSession(null);
    replaceState(createSeed());
  },
  demoPassword: DEMO_PASSWORD,
  atelierRoles: ATELIER_ROLES,
};

export type Db = typeof db;
