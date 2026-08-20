import {
  DEMO_PASSWORD,
  SEED_VERSION,
  type AnalyticsEvent,
  type Category,
  type CategorySlug,
  type DbState,
  type Product,
} from "./types";
import { nairaToKobo } from "../lib/money";
import { defaultNav } from "../lib/rbac";

const FEATURED = [
  "ara5001",
  "sen3002",
  "ara5004",
  "agb2001",
  "esk4001",
  "sen3005",
  "agb2003",
  "esk4002",
  "ara5006",
  "sen3008",
  "ara5008",
  "esk4000",
  "sen3010",
  "ara5010",
  "sen3012",
] as const;

const RTW_SKUS = new Set(["SEN3002", "SEN3003", "SEN3000", "SUIT6000", ...FEATURED.map((id) => id.toUpperCase())]);

type Raw = [string, string, string, string, CategorySlug];

const RAW: Raw[] = [
  ["ara5000", "ARA5000", "Stripped Vintage Outfit", "/images/ara5000.JPG", "aranbada"],
  ["ara5001", "ARA5001", "Black Vintage Outfit", "/images/ara5001.jpg", "aranbada"],
  ["ara5002", "ARA5002", "Stripped Rainbow Vintage Outfit", "/images/ara5002.jpg", "aranbada"],
  ["ara5003", "ARA5003", "White Canvas Outfit", "/images/ara5003.jpg", "aranbada"],
  ["ara5004", "ARA5004", "Green Canvas Outfit", "/images/ara5004.jpg", "aranbada"],
  ["ara5005", "ARA5005", "Cream Vintage Outfit", "/images/ara5005.jpg", "aranbada"],
  ["ara5006", "ARA5006", "Black Roundneck Vintage", "/images/ara5006.jpg", "aranbada"],
  ["ara5007", "ARA5007", "Patterned Vintage Outfit", "/images/ara5007.jpg", "aranbada"],
  ["ara5008", "ARA5008", "Black-Gold Vintage Outfit", "/images/ara5008.jpg", "aranbada"],
  ["ara5009", "ARA5009", "Ash Vintage Shirt", "/images/ara5009.jpg", "aranbada"],
  ["ara5010", "ARA5010", "Green Shirt Outfit", "/images/ara5010.jpg", "aranbada"],
  ["ara5011", "ARA5011", "TheBoss Vintage Outfit", "/images/ara5011.jpg", "aranbada"],
  ["ara5012", "ARA5012", "Blue Vintage Outfit", "/images/ara5012.jpg", "aranbada"],
  ["ara5013", "ARA5013", "Gray Vintage Outfit", "/images/ara5013.jpg", "aranbada"],
  ["sen3000", "SEN3000", "Chocolate Senator Outfit", "/images/sen3000.jpg", "senator"],
  ["sen3001", "SEN3001", "Mustard Senator Outfit", "/images/sen3001.jpg", "senator"],
  ["sen3002", "SEN3002", "Cream Senator Outfit", "/images/sen3002.jpg", "senator"],
  ["sen3003", "SEN3003", "White Senator Outfit", "/images/sen3003.jpg", "senator"],
  ["sen3006", "SEN3006", "Navy Senator Outfit", "/images/sen3006.JPG", "senator"],
  ["sen3005", "SEN3005", "Green Senator Outfit", "/images/sen3005.JPG", "senator"],
  ["sen3007", "SEN3007", "Wine Senator Outfit", "/images/sen3007.jpg", "senator"],
  ["sen3008", "SEN3008", "Green Senator Outfit", "/images/sen3008.jpg", "senator"],
  ["sen3009", "SEN3009", "Purple Senator Outfit", "/images/sen3009.jpg", "senator"],
  ["sen3010", "SEN3010", "Black Classic Outfit", "/images/sen3010.jpg", "senator"],
  ["sen3011", "SEN3011", "Green Half Sleeve", "/images/sen3011.jpg", "senator"],
  ["sen3012", "SEN3012", "Navy Senator Outfit", "/images/sen3012.jpg", "senator"],
  ["sen3013", "SEN3013", "Ash-gray Senator Outfit", "/images/sen3013.jpg", "senator"],
  ["sen3014", "SEN3014", "Gold Senator Outfit", "/images/sen3014.jpg", "senator"],
  ["sen3015", "SEN3015", "Skyblue Senator Outfit", "/images/sen3015.jpg", "senator"],
  ["sen3016", "SEN3016", "Green Half-sleeve Outfit", "/images/sen3016.jpg", "senator"],
  ["sen3017", "SEN3017", "Powderblue Senator Outfit", "/images/sen3017.jpg", "senator"],
  ["sen3018", "SEN3018", "White Half-sleeve Outfit", "/images/sen3018.jpg", "senator"],
  ["sen3019", "SEN3019", "Sky-Navyblue Senator Outfit", "/images/sen3019.jpg", "senator"],
  ["sen3021", "SEN3021", "Ash Senator Outfit", "/images/sen3021.jpg", "senator"],
  ["agb2000", "AGB2000", "Copper Exclusive Agbada", "/images/agb2000.jpg", "agbada"],
  ["agb2001", "AGB2001", "White Vintage Agbada", "/images/agb2001.jpg", "agbada"],
  ["agb2002", "AGB2002", "Off-White Agbada Outfit", "/images/agb2002.jpg", "agbada"],
  ["agb2003", "AGB2003", "Wine Agbada Outfit", "/images/agb2003.jpg", "agbada"],
  ["agb2004", "AGB2004", "Blue Full Embroidery Agbada", "/images/agb2004.jpg", "agbada"],
  ["agb2005", "AGB2005", "Green Agbada Outfit", "/images/agb2005.jpg", "agbada"],
  ["agb2006", "AGB2006", "White-Gold Agbada Outfit", "/images/agb2006.jpg", "agbada"],
  ["agb2007", "AGB2007", "White-Ash Agbada Outfit", "/images/agb2007.jpg", "agbada"],
  ["agb2008", "AGB2008", "Black Agbada Outfit", "/images/agb2008.jpg", "agbada"],
  ["agb2009", "AGB2009", "Red-wine Agbada Outfit", "/images/agb2009.jpg", "agbada"],
  ["esk4000", "ESK4000", "Off-White Esiki Outfit", "/images/esk4000.jpg", "esiki"],
  ["esk4001", "ESK4001", "Ash Esiki Outfit", "/images/esk4001.jpg", "esiki"],
  ["esk4002", "ESK4002", "Black Rainbow Esiki Outfit", "/images/esk4002.jpg", "esiki"],
  ["esk4003", "ESK4003", "Black-Gold Esiki Outfit", "/images/esk4003.jpg", "esiki"],
  ["suit6000", "SUIT6000", "Men's Exquisite Suit", "/images/suit6000.jpg", "suit"],
];

const BANDS: Record<string, [number, number]> = {
  aranbada: [85000, 140000],
  senator: [65000, 120000],
  agbada: [180000, 450000],
  esiki: [90000, 160000],
  suit: [220000, 220000],
};

function priceKobo(sku: string, category: CategorySlug): number {
  if (sku === "SEN3002") return nairaToKobo(110000);
  if (sku === "SUIT6000") return nairaToKobo(220000);
  if (sku === "AGB2003") return nairaToKobo(380000);
  if (sku === "ARA5001") return nairaToKobo(125000);
  if (sku === "SEN3008") return nairaToKobo(95000);
  const num = Number.parseInt(sku.replace(/\D/g, ""), 10) || 0;
  const [min, max] = BANDS[category] ?? [80000, 150000];
  const t = (num % 17) / 16;
  return nairaToKobo(Math.round((min + t * (max - min)) / 1000) * 1000);
}

function colourFromName(name: string): string {
  const hit = name.match(
    /Black|White|Green|Cream|Wine|Navy|Gold|Ash|Blue|Purple|Red|Copper|Chocolate|Mustard|Gray|Grey|Sky|Powder|Rainbow|Off-White/i,
  );
  return hit?.[0] ?? "House";
}

function buildProducts(): Product[] {
  return RAW.map(([id, sku, name, image, category]) => {
    const rank = FEATURED.indexOf(id as (typeof FEATURED)[number]);
    return {
      id,
      sku,
      slug: sku.toLowerCase(),
      name,
      image,
      images: [image],
      category,
      priceKobo: priceKobo(sku, category),
      shortDescription: `${name} — cut in the EUNIK house, Ibadan.`,
      description: `${name} (${sku}) is merchandised as Ara'nbada, Senator, Agbada, Esiki or Suit from the EUNIK atelier in Ibadan. Colour, cloth and size can be confirmed at order — ready-to-wear or made to measure.`,
      sellsRtw: RTW_SKUS.has(sku),
      sellsMtm: true,
      featuredRank: rank === -1 ? 0 : rank + 1,
      status: "live",
      colour: colourFromName(name),
      fabricLabel: category === "agbada" ? "Brocade / lace" : "Senator cloth",
      priceOnRequest: sku === "AGB2004",
    };
  });
}

const CATEGORIES: Category[] = [
  {
    id: "cat_aranbada",
    slug: "aranbada",
    name: "Ara'nbada",
    tagline: "Vintage elegance",
    path: "/aranbada",
    image: "/images/ara5004.jpg",
    heroImage: "/images/ara-bg.jpg",
    homeTileImage: "/images/ara5002.jpg",
  },
  {
    id: "cat_senator",
    slug: "senator",
    name: "Men's Senator",
    tagline: "Modern classics",
    path: "/men-senator",
    image: "/images/sen3009.jpg",
    heroImage: "/images/senator-bg.jpg",
    homeTileImage: "/images/sen3007.jpg",
  },
  {
    id: "cat_agbada",
    slug: "agbada",
    name: "Agbada",
    tagline: "Traditional regalia",
    path: "/agbada",
    image: "/images/agb2000.jpg",
    heroImage: "/images/agbada-bg.jpg",
    homeTileImage: "/images/agb2000.jpg",
  },
  {
    id: "cat_esiki",
    slug: "esiki",
    name: "Esiki",
    tagline: "Statement pieces",
    path: "/esiki",
    image: "/images/esk4000.jpg",
    homeTileImage: "/images/esk4000.jpg",
  },
  {
    id: "cat_suit",
    slug: "suit",
    name: "Fashion Suits",
    tagline: "For corporates",
    path: "/suit",
    image: "/images/suit6000.jpg",
    homeTileImage: "/images/suit6000.jpg",
  },
];

function user(
  id: string,
  email: string,
  role: DbState["users"][number]["role"],
  name: string,
  firstName: string,
  phone: string,
  city = "Ibadan",
  notes?: string,
) {
  const lastName = name.replace(firstName, "").trim() || undefined;
  const staff = role !== "client";
  const titles: Record<string, string> = {
    super_admin: "House Principal",
    manager: "House Manager",
    desk: "Front Desk",
    designer: "House Designer",
    tailor: "Floor Tailor",
    cutter: "House Cutter",
    qc: "Finishing & QC",
    finance: "House Finance",
    content: "Content Manager",
  };
  return {
    id,
    email,
    password: DEMO_PASSWORD,
    role,
    name,
    firstName,
    lastName,
    phone,
    city,
    notes,
    gender: firstName === "Funmi" ? ("female" as const) : ("male" as const),
    address: staff ? "Eunik HQ, Ibadan" : `${city}, Oyo State`,
    birthDay: staff ? 8 : 14,
    birthMonth: staff ? 3 : 6,
    preferredFit: staff ? undefined : "regular",
    department: staff
      ? role === "tailor" || role === "cutter" || role === "qc"
        ? "Atelier"
        : "House"
      : undefined,
    jobTitle: staff ? titles[role] : undefined,
    emergencyPhone: staff ? "08167073585" : undefined,
    navSections: staff ? defaultNav(role) : undefined,
  };
}

function buildTrafficSeed(demoToday: string): AnalyticsEvent[] {
  const channels = [
    { channel: "instagram", weight: 40 },
    { channel: "direct", weight: 25 },
    { channel: "whatsapp", weight: 15 },
    { channel: "google", weight: 12 },
    { channel: "referral", weight: 8 },
  ];
  const pages = ["/", "/shop", "/men-senator", "/aranbada", "/shop/SEN3002", "/shop/ARA5001", "/bespoke", "/journal"];
  const devices: Array<"mobile" | "desktop" | "tablet"> = ["mobile", "mobile", "mobile", "desktop", "tablet"];
  const events: AnalyticsEvent[] = [];
  const base = new Date(`${demoToday}T12:00:00.000Z`);
  let id = 0;
  for (let dayOffset = 29; dayOffset >= 0; dayOffset -= 1) {
    const date = new Date(base);
    date.setDate(date.getDate() - dayOffset);
    const dailyViews = 80 + Math.floor(Math.random() * 120);
    for (let view = 0; view < dailyViews; view += 1) {
      const roll = Math.random() * 100;
      let channel = channels[0].channel;
      let cumulative = 0;
      for (const item of channels) {
        cumulative += item.weight;
        if (roll <= cumulative) {
          channel = item.channel;
          break;
        }
      }
      const path = pages[Math.floor(Math.random() * pages.length)];
      const sku = path.includes("SEN3002") ? "SEN3002" : path.includes("ARA5001") ? "ARA5001" : undefined;
      const eventAt = new Date(date);
      eventAt.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60));
      events.push({
        id: `evt_${id++}`,
        type: path.startsWith("/shop/") && sku ? "view_item" : "page_view",
        path,
        sku,
        channel,
        device: devices[Math.floor(Math.random() * devices.length)],
        createdAt: eventAt.toISOString(),
      });
    }
  }
  const funnelTypes = ["view_item", "whatsapp_click", "add_to_bag", "purchase"] as const;
  const funnelCounts = [420, 95, 38, 12];
  funnelCounts.forEach((count, index) => {
    for (let i = 0; i < count; i += 1) {
      events.push({
        id: `evt_${id++}`,
        type: funnelTypes[index],
        channel: channels[i % channels.length].channel,
        device: "mobile",
        createdAt: base.toISOString(),
      });
    }
  });
  return events;
}

export function createSeed(): DbState {
  const demoToday = "2026-08-15";
  const products = buildProducts();
  const sen3002 = products.find((p) => p.sku === "SEN3002")!;
  const agb2003 = products.find((p) => p.sku === "AGB2003")!;
  const ara5001 = products.find((p) => p.sku === "ARA5001")!;

  return {
    meta: { version: SEED_VERSION, seededAt: "2026-08-15T09:00:00.000Z", nextOrder: 1004 },
    settings: {
      company: "EUNIK CLOTHINGS",
      rc: "1869194",
      phone: "08167073585",
      email: "info@eunikclothings.com",
      whatsapp: "2348167073585",
      instagram:
        "https://www.instagram.com/eunikclothing?igsh=YWh2bWp0c2p4dGI3&utm_source=qr",
      siteUrl: "https://eunikclothings.com",
      address: "Ibadan, Oyo State, Nigeria",
      currency: "NGN",
      freeShippingKobo: nairaToKobo(100000),
      demoMode: true,
      demoToday,
      depositPercent: 60,
      pickupLocation: "Eunik HQ, Ibadan",
      aboutJoinLine: "Clients across Oyo, Lagos, Abuja & Ekiti",
      bank: {
        bankName: "Access Bank (demo)",
        accountName: "EUNIK MULTIPURPOSE COMPANY NIGERIA LIMITED",
        accountNumber: "0000000000",
        narrationHint: "Use your order number as narration",
      },
    },
    users: [
      user("user_ade", "ade@eunik.demo", "client", "Adewale Banjo", "Ade", "0803 111 2222"),
      user(
        "user_funmi",
        "funmi@eunik.demo",
        "client",
        "Funmilayo Okonkwo",
        "Funmi",
        "0805 444 5555",
        "Ibadan",
        "relaxed Agbada, wine preferred",
      ),
      user("user_olamide", "olamide@eunik.demo", "super_admin", "Olasedidun Olamide A.", "Olamide", "08167073585"),
      user("user_manager", "manager@eunik.demo", "manager", "House Manager", "Manager", "0802 000 1111"),
      user("user_desk", "desk@eunik.demo", "desk", "Front Desk", "Desk", "0802 000 2222"),
      user("user_designer", "designer@eunik.demo", "designer", "House Designer", "Designer", "0802 000 3333"),
      user("user_tailor", "tailor@eunik.demo", "tailor", "Floor Tailor", "Tailor", "0802 000 4444"),
      user("user_cutter", "cutter@eunik.demo", "cutter", "House Cutter", "Cutter", "0802 000 5555"),
      user("user_qc", "qc@eunik.demo", "qc", "Finishing & QC", "QC", "0802 000 6666"),
      user("user_finance", "finance@eunik.demo", "finance", "House Finance", "Finance", "0802 000 7777"),
      user("user_content", "content@eunik.demo", "content", "Content Manager", "Content", "0802 000 8888"),
    ],
    products,
    categories: CATEGORIES,
    variants: [
      { id: "var_sen3002_m", productId: "sen3002", size: "M", stock: 4 },
      { id: "var_sen3002_l", productId: "sen3002", size: "L", stock: 2 },
      { id: "var_sen3002_xl", productId: "sen3002", size: "XL", stock: 1 },
      { id: "var_suit6000_42", productId: "suit6000", size: "42", stock: 3 },
      { id: "var_suit6000_44", productId: "suit6000", size: "44", stock: 2 },
      { id: "var_suit6000_46", productId: "suit6000", size: "46", stock: 1 },
      { id: "var_sen3000_l", productId: "sen3000", size: "L", stock: 3 },
      { id: "var_sen3003_m", productId: "sen3003", size: "M", stock: 5 },
    ],
    fabrics: [
      { id: "fab_navy", name: "Navy senator cloth", colour: "Navy", status: "available", yards: 42, surchargeKobo: 0 },
      { id: "fab_wine", name: "Wine brocade", colour: "Wine", status: "low", yards: 4, surchargeKobo: nairaToKobo(15000) },
      { id: "fab_black", name: "Black guinea", colour: "Black", status: "available", yards: 28, surchargeKobo: 0 },
      { id: "fab_cream", name: "Cream senator cloth", colour: "Cream", status: "available", yards: 35, surchargeKobo: 0 },
      { id: "fab_grey", name: "Grey guinea", colour: "Grey", status: "available", yards: 18, surchargeKobo: nairaToKobo(8000) },
    ],
    coupons: [
      { code: "EUNIK-DEC-2024", percent: 25, expiresAt: "2027-12-31T23:59:59.000Z", active: true },
    ],
    carts: [],
    wishlists: [
      { id: "wish_ade_ara", userId: "user_ade", productId: "ara5001" },
      { id: "wish_ade_sen", userId: "user_ade", productId: "sen3008" },
    ],
    measurementProfiles: [
      {
        id: "mp_ade_current",
        customerId: "user_ade",
        name: "Ade — Current",
        unit: "cm",
        values: {
          neck: 40,
          chest: 102,
          waist: 90,
          hip: 104,
          shoulder: 48,
          sleeve: 64,
          shirtLength: 78,
          trouserWaist: 88,
          inseam: 81,
        },
        fit: "regular",
        measuredAt: "2026-07-20T10:00:00.000Z",
      },
      {
        id: "mp_ade_wedding",
        customerId: "user_ade",
        name: "Ade — Wedding",
        unit: "cm",
        values: { neck: 40, chest: 102 },
        fit: "slim",
        measuredAt: "2026-08-01T10:00:00.000Z",
      },
    ],
    customDesignRequests: [
      {
        id: "cdr_ade_wine",
        customerId: "user_ade",
        outfitType: "Agbada",
        occasion: "Owambe",
        colour: "Wine",
        budget: "₦400,000–₦500,000",
        deliveryDate: "2026-09-20",
        description: "Wine Agbada, relaxed drape, discreet embroidery at the neck.",
        consultation: "Ibadan HQ",
        status: "quoted",
        createdAt: "2026-08-08T09:00:00.000Z",
      },
    ],
    quotations: [
      {
        id: "quote_ade_12",
        number: "Q-2026-00012",
        customerId: "user_ade",
        requestId: "cdr_ade_wine",
        description: "Custom wine Agbada — relaxed drape, Ibadan cloth.",
        totalKobo: nairaToKobo(450000),
        depositKobo: nairaToKobo(250000),
        status: "sent",
        createdAt: "2026-08-10T11:00:00.000Z",
      },
    ],
    orders: [
      {
        id: "order_1001",
        number: "1001",
        customerId: "user_ade",
        customerName: "Adewale Banjo",
        customerEmail: "ade@eunik.demo",
        customerPhone: "0803 111 2222",
        kind: "made_to_measure",
        status: "production",
        productId: sen3002.id,
        sku: sen3002.sku,
        name: sen3002.name,
        image: sen3002.image,
        qty: 1,
        subtotalKobo: nairaToKobo(110000),
        shippingKobo: 0,
        discountKobo: 0,
        totalKobo: nairaToKobo(110000),
        depositKobo: nairaToKobo(70000),
        paidKobo: nairaToKobo(70000),
        fulfillment: "pickup_ibadan",
        address: "Bodija, Ibadan",
        createdAt: "2026-08-01T10:00:00.000Z",
        measurementSnapshot: {
          neck: 40,
          chest: 102,
          waist: 90,
          hip: 104,
          shoulder: 48,
          sleeve: 64,
          shirtLength: 78,
        },
      },
      {
        id: "order_1002",
        number: "1002",
        customerId: "user_funmi",
        customerName: "Funmilayo Okonkwo",
        customerEmail: "funmi@eunik.demo",
        customerPhone: "0805 444 5555",
        kind: "bespoke",
        status: "awaiting_transfer",
        productId: agb2003.id,
        sku: agb2003.sku,
        name: "Wine Agbada — Funmi bespoke",
        image: agb2003.image,
        qty: 1,
        subtotalKobo: nairaToKobo(380000),
        shippingKobo: 0,
        discountKobo: 0,
        totalKobo: nairaToKobo(380000),
        depositKobo: nairaToKobo(228000),
        paidKobo: 0,
        fulfillment: "pickup_ibadan",
        createdAt: "2026-08-05T14:00:00.000Z",
      },
      {
        id: "order_1003",
        number: "1003",
        customerId: "user_ade",
        customerName: "Adewale Banjo",
        customerEmail: "ade@eunik.demo",
        customerPhone: "0803 111 2222",
        kind: "ready_to_wear",
        status: "ready",
        productId: ara5001.id,
        sku: ara5001.sku,
        name: ara5001.name,
        image: ara5001.image,
        qty: 1,
        subtotalKobo: nairaToKobo(125000),
        shippingKobo: 0,
        discountKobo: 0,
        totalKobo: nairaToKobo(125000),
        depositKobo: nairaToKobo(125000),
        paidKobo: nairaToKobo(125000),
        fulfillment: "pickup_ibadan",
        createdAt: "2026-07-28T09:00:00.000Z",
      },
    ],
    orderItems: [
      {
        id: "oi_1001",
        orderId: "order_1001",
        productId: sen3002.id,
        name: sen3002.name,
        qty: 1,
        unitKobo: nairaToKobo(110000),
      },
      {
        id: "oi_1002",
        orderId: "order_1002",
        productId: agb2003.id,
        name: "Wine Agbada — Funmi bespoke",
        qty: 1,
        unitKobo: nairaToKobo(380000),
      },
      {
        id: "oi_1003",
        orderId: "order_1003",
        productId: ara5001.id,
        name: ara5001.name,
        qty: 1,
        unitKobo: nairaToKobo(125000),
      },
    ],
    payments: [
      {
        id: "pay_ade_deposit",
        orderId: "order_1001",
        customerId: "user_ade",
        amountKobo: nairaToKobo(70000),
        type: "deposit",
        method: "paystack",
        status: "successful",
        paystackReference: "PAY_demo_ade_deposit",
        submittedAt: "2026-08-01T10:12:00.000Z",
      },
      {
        id: "pay_funmi_transfer",
        orderId: "order_1002",
        customerId: "user_funmi",
        amountKobo: nairaToKobo(228000),
        type: "deposit",
        method: "bank_transfer",
        status: "awaiting_verification",
        transactionNumber: "ACC20260805114422",
        receiptDataUrl: "/images/agb2003.jpg",
        submittedAt: "2026-08-05T14:20:00.000Z",
      },
      {
        id: "pay_ade_1003",
        orderId: "order_1003",
        customerId: "user_ade",
        amountKobo: nairaToKobo(125000),
        type: "full",
        method: "paystack",
        status: "successful",
        paystackReference: "PAY_demo_ade_1003",
        submittedAt: "2026-07-28T09:08:00.000Z",
      },
    ],
    productionOrders: [
      {
        id: "prod_1001",
        orderId: "order_1001",
        customerId: "user_ade",
        garment: "Cream Senator Outfit",
        sku: "SEN3002",
        stage: "sewing",
        assigneeId: "user_tailor",
        dueDate: "2026-08-22",
      },
      {
        id: "prod_1002",
        orderId: "order_1002",
        customerId: "user_funmi",
        garment: "Wine Agbada — Funmi bespoke",
        sku: "AGB2003",
        stage: "quote_accepted",
        assigneeId: "user_tailor",
        dueDate: "2026-09-01",
      },
      {
        id: "prod_1003",
        orderId: "order_1003",
        customerId: "user_ade",
        garment: "Black Vintage Outfit",
        sku: "ARA5001",
        stage: "ready",
        assigneeId: "user_qc",
        dueDate: "2026-08-12",
      },
    ],
    appointments: [
      {
        id: "apt_ade_measure",
        customerId: "user_ade",
        customerName: "Adewale Banjo",
        service: "Measurement follow-up",
        date: "2026-08-16",
        time: "11:00",
        location: "Eunik HQ, Ibadan",
        notes: "Confirm wedding profile; SEN3002 first fitting window.",
        status: "confirmed",
      },
      {
        id: "apt_walkin",
        customerId: "walkin",
        customerName: "Walk-in consultation",
        service: "Style consultation",
        date: "2026-08-15",
        time: "15:00",
        location: "Eunik HQ, Ibadan",
        notes: "Agbada for September owambe.",
        status: "confirmed",
      },
    ],
    fittings: [
      {
        id: "fit_1001",
        orderId: "order_1001",
        date: "2026-08-20",
        notes: "First fitting after sewing.",
        status: "scheduled",
      },
    ],
    leads: [
      {
        id: "lead_ara5008",
        productId: "ara5008",
        sku: "ARA5008",
        status: "unclaimed",
        createdAt: "2026-08-14T16:40:00.000Z",
      },
    ],
    tickets: [
      {
        id: "tix_seed",
        name: "Ibrahim Sanni",
        email: "ibrahim@example.com",
        phone: "0806 222 3333",
        subject: "Alteration timing",
        message: "How long for a Senator waist amendment after pickup?",
        createdAt: "2026-08-12T08:30:00.000Z",
        status: "open",
        replies: [],
      },
    ],
    reviews: [
      {
        id: "rev_ade_sen",
        productId: "sen3002",
        customerId: "user_ade",
        customerName: "Adewale Banjo",
        rating: 5,
        body: "Cream Senator sits exactly as measured. Floor called for fitting on time.",
        status: "approved",
        createdAt: "2026-08-10T11:00:00.000Z",
      },
      {
        id: "rev_funmi_pending",
        productId: "agb2003",
        customerId: "user_funmi",
        customerName: "Funmilayo Okonkwo",
        rating: 4,
        body: "Wine Agbada drape is generous — waiting on the house to publish this.",
        status: "pending",
        createdAt: "2026-08-14T18:20:00.000Z",
      },
    ],
    attendance: [
      {
        id: "att_tailor_in",
        userId: "user_tailor",
        type: "in",
        at: "2026-08-15T07:55:00.000Z",
        note: "Floor open",
      },
    ],
    notifications: [
      {
        id: "ntf_ade_sew",
        userId: "user_ade",
        title: "SEN3002 at sewing",
        body: "We’ll call for first fitting.",
        createdAt: "2026-08-14T09:00:00.000Z",
        read: false,
      },
    ],
    subscribers: ["house@eunik.demo"],
    journalPosts: [
      {
        id: "j1",
        slug: "elegance-remembered",
        title: "Elegance is not standing out, but being remembered.",
        excerpt: "Heritage cut, contemporary posture.",
        image: "/images/sen3012.jpg",
        author: "Olamide Olasedidun",
        date: "2024-11-26",
        content:
          "At EUNIK the garment should be remembered after the room empties. Ara'nbada, Senator and Agbada share one house language: cloth, cut, and the man who wears them.",
      },
      {
        id: "j2",
        slug: "fashion-armor",
        title: "Fashion is the armor to survive the reality of everyday life.",
        excerpt: "Senator cloth for the working week.",
        image: "/images/agb2008.jpg",
        author: "Olamide Olasedidun",
        date: "2024-11-20",
        content: "A well-cut Senator is not costume. It is how a man enters Monday in Ibadan and Abuja alike.",
      },
      {
        id: "j3",
        slug: "irreplaceable",
        title: "In order to be irreplaceable one must always be different.",
        excerpt: "Made to measure, not made to match.",
        image: "/images/sen3007.jpg",
        author: "Olamide Olasedidun",
        date: "2024-11-10",
        content: "Bespoke at EUNIK starts with measurements that already know the client — then cloth, then the floor.",
      },
      {
        id: "j4",
        slug: "contemporary-lifestyle",
        title: "Eunik has represented design and contemporary lifestyle.",
        excerpt: "From indoor atelier to the runway.",
        image: "/images/ara5005.jpg",
        author: "Olamide Olasedidun",
        date: "2024-11-06",
        content:
          "Founded 2018, rebranded 2021: the house still cuts in Ibadan, still shows Heritage, still writes names on tickets not SKUs alone.",
      },
    ],
    events: [
      {
        id: "ev_trunk",
        slug: "heritage-trunk-show-ibadan",
        name: "Heritage trunk show — Ibadan",
        date: "2026-08-29",
        location: "Eunik HQ, Ibadan",
        image: "/images/agbada-bg.jpg",
        description: "Ara'nbada, Agbada and Senator looks for the season. Measurements taken on the floor.",
      },
    ],
    lookbookItems: [
      {
        id: "lb1",
        title: "Embroidery Agbada",
        image: "/images/agb2004.jpg",
        collection: "agbada",
        productId: "agb2004",
        notes: "Blue full embroidery, ceremonial.",
      },
      {
        id: "lb2",
        title: "White canvas Ara'nbada",
        image: "/images/ara5003.jpg",
        collection: "aranbada",
        productId: "ara5003",
        notes: "Light cloth, Ibadan heat.",
      },
      {
        id: "lb3",
        title: "Green Senator",
        image: "/images/sen3005.JPG",
        collection: "senator",
        productId: "sen3005",
        notes: "House Senator, day wear.",
      },
      {
        id: "lb4",
        title: "Black-gold Esiki",
        image: "/images/esk4003.jpg",
        collection: "esiki",
        productId: "esk4003",
        notes: "Statement evening.",
      },
      {
        id: "lb5",
        title: "Exquisite suit",
        image: "/images/suit6000.jpg",
        collection: "suit",
        productId: "suit6000",
        notes: "Corporate RTW, sizes 42–46.",
      },
    ],
    homepage: {
      promoCode: "EUNIK-DEC-2024",
      showPromo: true,
      showMagazine: true,
      showArrivals: true,
      magazineTitle: "Eunik magazine",
      newArrivalEyebrow: "LATEST 2024",
      newArrivalTitle: "New arrival collection",
      aboutTrustLine: "Clients across Oyo, Lagos, Abuja & Ekiti",
      hero: [
        { title: "Ara'nbada's", subtitle: "collection", image: "/images/ara-bg.jpg", to: "/aranbada" },
        { title: "Senator's", subtitle: "collection", image: "/images/senator-bg.jpg", to: "/men-senator" },
        { title: "Agbada's", subtitle: "collection", image: "/images/agbada-bg.jpg", to: "/agbada" },
      ],
    },
    mailbox: [],
    auditLogs: [
      {
        id: "aud_suit",
        at: "2026-08-02T12:00:00.000Z",
        actorId: "user_olamide",
        action: "product.price",
        detail: "SUIT6000 set to ₦220,000",
      },
      {
        id: "aud_1001",
        at: "2026-08-12T16:40:00.000Z",
        actorId: "user_tailor",
        action: "production.stage",
        detail: "Order #1001 Cutting → Sewing",
      },
    ],
    analyticsEvents: buildTrafficSeed(demoToday),
  };
}
