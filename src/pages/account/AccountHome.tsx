import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  BookOpen,
  Calendar,
  CreditCard,
  Heart,
  MessageCircleHeart,
  Package,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashNavGrid, NeedAttention, PageHeader, PageLoading, ProgressBar, SectionCard, StatCard, StatusBadge } from "@/components/os/ui";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { statusLabel } from "@/lib/format";

const RING: Record<string, number> = {
  quote_accepted: 8,
  deposit_paid: 16,
  design_confirmed: 24,
  fabric_confirmed: 32,
  measurements_confirmed: 40,
  cutting: 48,
  sewing: 58,
  finishing: 68,
  first_fitting: 76,
  alterations: 82,
  final_fitting: 88,
  quality_check: 94,
  ready: 100,
  completed: 100,
};

export default function AccountHome() {
  const { user } = useSession();
  const ordersQ = useAsync(() => db.orders.listMine(), []);
  const quotesQ = useAsync(() => db.quotations.listMine(), []);
  const appointmentsQ = useAsync(() => db.appointments.listMine(), []);
  const wishlistQ = useAsync(() => db.wishlist.list(), []);
  const notesQ = useAsync(() => db.notifications.listMine(), []);
  const featuredQ = useAsync(() => db.products.featured(), []);
  const journalQ = useAsync(() => db.content.journal(), []);
  const orders = ordersQ.data;
  const quotes = quotesQ.data;
  const appointments = appointmentsQ.data;
  const wishlist = wishlistQ.data;
  const notes = notesQ.data;
  const featured = featuredQ.data;
  const journal = journalQ.data;
  const main =
    orders?.find((item) => item.status === "production") ??
    orders?.find((item) => item.paidKobo < item.totalKobo && item.status !== "cancelled") ??
    orders?.[0];
  const prodQ = useAsync(
    () => (main ? db.production.getByOrder(main.id) : Promise.resolve(null)),
    [main?.id],
  );
  const prod = prodQ.data;

  if (ordersQ.loading && !orders) return <PageLoading />;

  async function refresh() {
    await Promise.all([
      ordersQ.reload(),
      quotesQ.reload(),
      appointmentsQ.reload(),
      wishlistQ.reload(),
      notesQ.reload(),
      featuredQ.reload(),
      journalQ.reload(),
      prodQ.reload(),
    ]);
  }
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const waitingQuote = quotes?.find((item) => item.status === "sent");
  const balance = (orders ?? []).reduce((sum, item) => sum + Math.max(0, item.totalKobo - item.paidKobo), 0);
  const nextFit = appointments?.[0];
  const chart = (orders ?? []).map((item) => ({
    name: `#${item.number}`,
    paid: item.paidKobo / 100,
    due: Math.max(0, item.totalKobo - item.paidKobo) / 100,
  }));

  async function acceptQuote() {
    if (!waitingQuote) return;
    const order = await db.quotations.accept(waitingQuote.id);
    toast.success(`Quote accepted — order #${order.number}. Pay the deposit from Payments.`);
  }

  const attention = [
    ...(user?.mustChangePassword
      ? [
          {
            id: "pwd",
            title: "Still on a temporary password",
            detail: "You can keep using it, or set a private one in Profile when you are ready.",
            href: "/account/profile",
            actionLabel: "Update password",
          },
        ]
      : []),
    ...(waitingQuote
      ? [
          {
            id: waitingQuote.id,
            title: `Quote ${waitingQuote.number} waiting`,
            detail: `${formatNaira(waitingQuote.totalKobo)} · deposit ${formatNaira(waitingQuote.depositKobo)}`,
            actionLabel: "Accept quote",
            onAction: () => void acceptQuote(),
          },
        ]
      : []),
    ...(balance > 0
      ? [
          {
            id: "bal",
            title: `${formatNaira(balance)} still due`,
            detail: "Pay the balance with Paystack or transfer + receipt.",
            href: "/account/payments",
          },
        ]
      : []),
    ...(nextFit
      ? [
          {
            id: nextFit.id,
            title: `${nextFit.service} at Ibadan`,
            detail: `${nextFit.date} · ${nextFit.time} · ${nextFit.status}`,
            href: "/account/appointments",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="My account"
        title={`${greet}, ${user?.firstName}.`}
        subtitle="Orders, quotes, and bookings — all in one place."
        onRefresh={() => refresh()}
        actions={
          <>
            <Link to="/account/custom" className="os-pill bg-gold text-ink">
              Request a custom design
            </Link>
            <Link to="/account/appointments" className="os-pill border border-line bg-white text-ink">
              Book Ibadan
            </Link>
          </>
        }
      />

      <NeedAttention items={attention} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open orders" value={String(orders?.length ?? 0)} hint="Ready to wear, made to measure, custom" />
        <StatCard label="Wishlist" value={String(wishlist?.length ?? 0)} hint="Looks you saved" />
        <StatCard label="Balance" value={formatNaira(balance)} tone={balance > 0 ? "gold" : "plain"} hint="Still to pay on open orders" />
        <StatCard label="Notes" value={String(notes?.length ?? 0)} hint="Quotes, fittings, updates" />
      </div>

      <DashNavGrid
        tiles={[
          { to: "/account/shop", label: "Shop", hint: "Browse the collection", icon: ShoppingBag },
          { to: "/account/orders", label: "Orders", hint: "Track your order", icon: Package },
          { to: "/account/custom", label: "Custom", hint: "Request and quotes", icon: Sparkles },
          { to: "/account/appointments", label: "Bookings", hint: "Tape and fittings", icon: Calendar },
          { to: "/account/payments", label: "Payments", hint: "Paystack or bank transfer", icon: CreditCard },
          { to: "/account/wishlist", label: "Wishlist", hint: "Saved looks", icon: Heart },
          { to: "/account/reviews", label: "Reviews", hint: "After delivery", icon: MessageCircleHeart },
          { to: "/account/journal", label: "Magazine", hint: "House stories", icon: BookOpen },
          { to: "/account/profile", label: "Profile", hint: "Details & password", icon: User },
        ]}
      />

      {main && prod ? (
        <SectionCard
          title={`#${main.number} ${main.name}`}
          action={<StatusBadge label={statusLabel(prod.stage)} tone="gold" />}
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
            <div>
              <p className="mb-3 text-sm">
                Paid {formatNaira(main.paidKobo)} of {formatNaira(main.totalKobo)} · {statusLabel(main.kind)}
              </p>
              <ProgressBar value={RING[prod.stage] ?? 30} gold />
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/account/orders" className="os-pill bg-ink text-white">
                  View orders
                </Link>
                {main.paidKobo < main.totalKobo ? (
                  <Link to="/account/payments" className="os-pill bg-gold text-ink">
                    Pay balance
                  </Link>
                ) : null}
              </div>
            </div>
            {main.image ? <img src={main.image} alt="" className="h-36 w-full rounded-xl object-cover" /> : null}
          </div>
        </SectionCard>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="What you have spent">
          {chart.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <XAxis dataKey="name" stroke="#828282" fontSize={12} />
                  <YAxis stroke="#828282" fontSize={12} />
                  <Tooltip formatter={(value) => formatNaira(Number(value) * 100)} />
                  <Area type="monotone" dataKey="paid" stroke="#232323" fill="#232323" fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="due" stroke="#eeb167" fill="#eeb167" fillOpacity={0.25} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm">No orders yet.</p>
          )}
        </SectionCard>
        <SectionCard
          title="Upcoming in Ibadan"
          action={
            <Link to="/account/appointments" className="text-sm underline">
              Book
            </Link>
          }
        >
          <ul className="space-y-3">
            {(appointments ?? []).length === 0 ? <p className="text-sm">No bookings yet.</p> : null}
            {(appointments ?? []).map((item) => (
              <li key={item.id} className="rounded-xl border border-line px-4 py-3">
                <p className="font-medium text-ink">{item.service}</p>
                <p className="text-sm">
                  {item.date} {item.time} · {item.location}
                </p>
                <StatusBadge label={statusLabel(item.status)} tone="gold" />
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title="Recommended looks"
        action={
          <Link to="/account/shop" className="text-sm underline">
            Shop
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(featured ?? []).slice(0, 4).map((item) => (
            <Link key={item.id} to={`/account/shop/${item.sku}`} className="group">
              <img src={item.image} alt="" className="aspect-[3/4] w-full rounded-xl object-cover" />
              <p className="mt-2 font-medium text-ink group-hover:underline">{item.name}</p>
              <p className="text-sm">{formatNaira(item.priceKobo)}</p>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="From the magazine">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(journal ?? []).map((post) => (
            <Link key={post.id} to={`/account/journal/${post.slug}`}>
              <img src={post.image} alt="" className="h-40 w-full rounded-xl object-cover" />
              <p className="mt-2 text-sm text-ink">{post.title}</p>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
