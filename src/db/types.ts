export type CategorySlug = string;

export type Gender = "male" | "female" | "other";

export type Role =
  | "client"
  | "super_admin"
  | "manager"
  | "desk"
  | "designer"
  | "tailor"
  | "cutter"
  | "qc"
  | "finance"
  | "content";

export type NavSection =
  | "overview"
  | "orders"
  | "products"
  | "collections"
  | "customers"
  | "custom"
  | "quotes"
  | "production"
  | "payments"
  | "analytics"
  | "support"
  | "content"
  | "events"
  | "people"
  | "settings"
  | "bench"
  | "queue"
  | "fittings"
  | "appointments"
  | "attendance"
  | "profile";

export type ProductionStage =
  | "quote_accepted"
  | "deposit_paid"
  | "design_confirmed"
  | "fabric_confirmed"
  | "measurements_confirmed"
  | "cutting"
  | "sewing"
  | "finishing"
  | "first_fitting"
  | "alterations"
  | "final_fitting"
  | "quality_check"
  | "ready"
  | "completed";

export type PaymentMethod = "paystack" | "bank_transfer";
export type PaymentStatus =
  | "pending"
  | "awaiting_verification"
  | "successful"
  | "failed"
  | "rejected"
  | "refunded"
  | "partial";

export type OrderKind = "ready_to_wear" | "made_to_measure" | "bespoke" | "alteration";
export type OrderStatus =
  | "pending_payment"
  | "awaiting_transfer"
  | "confirmed"
  | "processing"
  | "production"
  | "ready"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type User = {
  id: string;
  email: string;
  password: string;
  role: Role;
  name: string;
  firstName: string;
  lastName?: string;
  phone: string;
  city: string;
  gender?: Gender;
  address?: string;
  birthDay?: number;
  birthMonth?: number;
  department?: string;
  jobTitle?: string;
  emergencyPhone?: string;
  preferredFit?: string;
  notes?: string;
  mustChangePassword?: boolean;
  suspendedAt?: string | null;
  navSections?: NavSection[];
};

export type PublicUser = Omit<User, "password">;

export type Category = {
  id: string;
  slug: CategorySlug;
  name: string;
  tagline: string;
  path: string;
  image: string;
  heroImage?: string;
  homeTileImage?: string;
};

export type Product = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  image: string;
  images: string[];
  category: CategorySlug;
  priceKobo: number;
  shortDescription: string;
  description: string;
  sellsRtw: boolean;
  sellsMtm: boolean;
  featuredRank: number;
  status: "live" | "draft";
  colour: string;
  fabricLabel: string;
  priceOnRequest?: boolean;
};

export type ProductVariant = {
  id: string;
  productId: string;
  size: string;
  stock: number;
};

export type Fabric = {
  id: string;
  name: string;
  colour: string;
  status: "available" | "low" | "out";
  yards: number;
  surchargeKobo: number;
};

export type Coupon = {
  code: string;
  percent: number;
  expiresAt: string;
  active: boolean;
};

export type CartLine = {
  id: string;
  productId: string;
  variantId?: string;
  kind: "rtw" | "mtm";
  fabricId?: string;
  measurementProfileId?: string;
  qty: number;
  /** Present when cart comes from the live API */
  priceKobo?: number;
  name?: string;
  image?: string;
  sku?: string;
  size?: string;
};

export type Cart = {
  id: string;
  ownerId: string;
  lines: CartLine[];
  couponCode?: string;
};

export type MeasurementProfile = {
  id: string;
  customerId: string;
  name: string;
  unit: "cm" | "in";
  values: Record<string, number>;
  fit: "slim" | "regular" | "relaxed";
  measuredAt: string;
};

export type CustomDesignRequest = {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  outfitType: string;
  occasion: string;
  colour: string;
  budget: string;
  deliveryDate: string;
  description: string;
  consultation: string;
  status: "new" | "quoted" | "closed";
  createdAt: string;
};

export type Quotation = {
  id: string;
  number: string;
  customerId: string;
  requestId?: string;
  description: string;
  totalKobo: number;
  depositKobo: number;
  status: "sent" | "accepted" | "rejected" | "declined" | "expired";
  createdAt: string;
};

export type Order = {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  kind: OrderKind;
  status: OrderStatus;
  productId?: string;
  sku?: string;
  name: string;
  image?: string;
  qty: number;
  subtotalKobo: number;
  shippingKobo: number;
  discountKobo: number;
  totalKobo: number;
  depositKobo: number;
  paidKobo: number;
  fulfillment: "pickup_ibadan" | "delivery";
  address?: string;
  createdAt: string;
  measurementSnapshot?: Record<string, number>;
  items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId?: string;
  variantId?: string;
  name: string;
  sku?: string;
  size?: string;
  kind?: "rtw" | "mtm" | "bespoke";
  fabricId?: string;
  qty: number;
  unitKobo: number;
};

export type Payment = {
  id: string;
  orderId: string;
  customerId: string;
  amountKobo: number;
  type: "deposit" | "balance" | "full";
  method: PaymentMethod;
  status: PaymentStatus;
  paystackReference?: string;
  transactionNumber?: string;
  receiptDataUrl?: string;
  submittedAt: string;
  verifiedBy?: string;
  rejectionReason?: string;
};

export type ProductionOrder = {
  id: string;
  orderId: string;
  customerId: string;
  garment: string;
  sku?: string;
  stage: ProductionStage;
  assigneeId: string;
  dueDate: string;
};

export type Appointment = {
  id: string;
  customerId: string;
  customerName: string;
  service: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  status: "requested" | "confirmed" | "completed" | "cancelled";
};

export type Fitting = {
  id: string;
  orderId: string;
  date: string;
  notes: string;
  status: "scheduled" | "done";
};

export type ChannelLead = {
  id: string;
  productId: string;
  sku: string;
  status: "unclaimed" | "claimed";
  orderNumber?: string;
  createdAt: string;
};

export type Review = {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  body: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type AttendanceEvent = {
  id: string;
  userId: string;
  type: "in" | "out";
  at: string;
  note?: string;
};

export type TicketReply = {
  at: string;
  staffId: string;
  body: string;
};

export type SupportTicket = {
  id: string;
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
  status: "open" | "closed";
  replies: TicketReply[];
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  date: string;
  content: string;
};

export type EventItem = {
  id: string;
  slug: string;
  name: string;
  date: string;
  location: string;
  image: string;
  description: string;
};

export type LookbookItem = {
  id: string;
  title: string;
  image: string;
  collection: string;
  productId?: string;
  notes: string;
};

export type HomepageContent = {
  promoCode: string;
  showPromo: boolean;
  showMagazine: boolean;
  showArrivals: boolean;
  magazineTitle: string;
  newArrivalEyebrow: string;
  newArrivalTitle: string;
  aboutTrustLine: string;
  hero: { title: string; subtitle: string; image: string; to: string }[];
};

export type Settings = {
  company: string;
  rc: string;
  phone: string;
  email: string;
  whatsapp: string;
  instagram: string;
  facebook?: string;
  twitter?: string;
  siteUrl: string;
  address: string;
  currency: "NGN";
  freeShippingKobo: number;
  demoMode: boolean;
  demoToday?: string;
  depositPercent: number;
  pickupLocation: string;
  aboutJoinLine: string;
  bank: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    narrationHint: string;
  };
};

export type AnalyticsEvent = {
  id: string;
  type: string;
  path?: string;
  sku?: string;
  channel?: string;
  device?: "mobile" | "desktop" | "tablet";
  referrer?: string;
  createdAt: string;
};

export type TrafficSnapshot = {
  summary: {
    views: number;
    visitors: number;
    sessions: number;
    bounceRate: number;
    pagesPerSession: number;
    activeNow?: number;
  };
  previous?: { views: number; visitors: number; sessions: number };
  viewsSeries: { day: string; views: number; visitors: number }[];
  channels: { channel: string; views: number; visitors: number }[];
  referrers: { host: string; views: number }[];
  devices: { device: "mobile" | "desktop" | "tablet"; views: number }[];
  geo: { country: string; city?: string; views: number }[];
  topPages: { path: string; title?: string; views: number }[];
  topSkus: { sku: string; name: string; views: number }[];
  funnels: { name: string; count: number }[];
  conversion: {
    sessionToPurchase: number;
    sessionToWhatsapp: number;
    viewItemToBag: number;
  };
};

export type OutboundEmail = {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
};

export type StudioOverview = {
  revenueKobo: number;
  awaitingReceipts: number;
  openOrders: number;
  lowFabrics?: number;
  unclaimedLeads?: number;
  mix: { rtw: number; mtm: number; bespoke: number };
  outstandingKobo: number;
  activeBespoke: number;
  pipeline: Record<string, number>;
};

export type AuditLog = {
  id: string;
  at: string;
  actorId: string;
  action: string;
  detail: string;
};

export type WishlistItem = {
  id: string;
  userId: string;
  productId: string;
};

export type DbState = {
  meta: { version: number; seededAt: string; nextOrder: number };
  settings: Settings;
  users: User[];
  products: Product[];
  categories: Category[];
  variants: ProductVariant[];
  fabrics: Fabric[];
  coupons: Coupon[];
  carts: Cart[];
  wishlists: WishlistItem[];
  measurementProfiles: MeasurementProfile[];
  customDesignRequests: CustomDesignRequest[];
  quotations: Quotation[];
  orders: Order[];
  orderItems: OrderItem[];
  payments: Payment[];
  productionOrders: ProductionOrder[];
  appointments: Appointment[];
  fittings: Fitting[];
  leads: ChannelLead[];
  tickets: SupportTicket[];
  reviews: Review[];
  attendance: AttendanceEvent[];
  notifications: Notification[];
  subscribers: string[];
  journalPosts: BlogPost[];
  events: EventItem[];
  lookbookItems: LookbookItem[];
  homepage: HomepageContent;
  mailbox: OutboundEmail[];
  auditLogs: AuditLog[];
  analyticsEvents: AnalyticsEvent[];
};

export type Session = {
  userId: string;
  role: Role;
  actingFromId?: string;
};

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export type DemoChip = {
  email: string;
  label: string;
  role: Role;
};

export const DEMO_PASSWORD = "EunikHouse2026!";
export const SEED_VERSION = 6;
export const STORAGE_KEY = "eunik-demo-db";
export const SESSION_KEY = "eunik-demo-session";
export const GUEST_KEY = "eunik-guest-id";
