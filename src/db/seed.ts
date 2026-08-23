import {
  DEMO_PASSWORD,
  SEED_VERSION,
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

/** Offline / localStorage fallback only. Dashboard ops data lives in Postgres when API is on. */
export function createSeed(): DbState {
  const products = buildProducts();

  return {
    meta: { version: SEED_VERSION, seededAt: new Date().toISOString(), nextOrder: 1001 },
    settings: {
      company: "EUNIK Clothings & Fashion Academy",
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
      demoMode: false,
      depositPercent: 50,
      pickupLocation: "Eunik HQ, Ibadan",
      aboutJoinLine: "Clients across Oyo, Lagos, Abuja & Ekiti",
      bank: {
        bankName: "First Bank",
        accountName: "EUNIK Clothings",
        accountNumber: "0123456789",
        narrationHint: "Order #",
      },
    },
    users: [
      user("user_ade", "ade@eunik.demo", "client", "Adewale Banjo", "Ade", "0803 111 2222"),
      user("user_funmi", "funmi@eunik.demo", "client", "Funmilayo Okonkwo", "Funmi", "0805 444 5555"),
      user("user_olamide", "olamide@eunik.demo", "super_admin", "Olasedidun Olamide A.", "Olamide", "08167073585"),
      user("user_desk", "desk@eunik.demo", "desk", "Front Desk", "Desk", "0802 000 2222"),
      user("user_designer", "designer@eunik.demo", "designer", "House Designer", "Designer", "0802 000 3333"),
      user("user_tailor", "tailor@eunik.demo", "tailor", "Floor Tailor", "Tailor", "0802 000 4444"),
      user("user_finance", "finance@eunik.demo", "finance", "House Finance", "Finance", "0802 000 7777"),
    ],
    products,
    categories: CATEGORIES,
    variants: [
      { id: "var_sen3002_m", productId: "sen3002", size: "M", stock: 4 },
      { id: "var_sen3002_l", productId: "sen3002", size: "L", stock: 2 },
      { id: "var_sen3002_xl", productId: "sen3002", size: "XL", stock: 1 },
    ],
    fabrics: [
      { id: "fab_ash_senator", name: "Ash Senator Cloth", colour: "Ash", status: "available", yards: 6, surchargeKobo: 0 },
      { id: "fab_cream_senator", name: "Cream Senator Cloth", colour: "Cream", status: "available", yards: 8, surchargeKobo: 0 },
      { id: "fab_navy_senator", name: "Navy Senator Cloth", colour: "Navy", status: "low", yards: 3, surchargeKobo: 0 },
      { id: "fab_wine_brocade", name: "Wine Brocade", colour: "Wine", status: "available", yards: 10, surchargeKobo: nairaToKobo(5000) },
      { id: "fab_gold_lace", name: "Gold French Lace", colour: "Gold", status: "available", yards: 5, surchargeKobo: nairaToKobo(15000) },
    ],
    coupons: [],
    carts: [],
    wishlists: [],
    measurementProfiles: [],
    customDesignRequests: [],
    quotations: [],
    orders: [],
    orderItems: [],
    payments: [],
    productionOrders: [],
    appointments: [],
    fittings: [],
    leads: [],
    tickets: [],
    reviews: [],
    attendance: [],
    notifications: [],
    subscribers: [],
    journalPosts: [],
    events: [],
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
      promoCode: "EUNIK10",
      showPromo: false,
      showMagazine: true,
      showArrivals: true,
      magazineTitle: "Eunik magazine",
      newArrivalEyebrow: "LATEST",
      newArrivalTitle: "New arrival collection",
      aboutTrustLine: "Clients across Oyo, Lagos, Abuja & Ekiti",
      hero: [
        { title: "Ara'nbada's", subtitle: "collection", image: "/images/ara-bg.jpg", to: "/aranbada" },
        { title: "Senator's", subtitle: "collection", image: "/images/senator-bg.jpg", to: "/men-senator" },
        { title: "Agbada's", subtitle: "collection", image: "/images/agbada-bg.jpg", to: "/agbada" },
      ],
    },
    mailbox: [],
    auditLogs: [],
    analyticsEvents: [],
  };
}
