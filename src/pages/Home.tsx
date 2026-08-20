import { Link } from "react-router-dom";
import { ArrowRight, CreditCard, Headphones, Package, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { padCount } from "@/lib/whatsapp";

export default function Home() {
  const [slide, setSlide] = useState(0);
  const { data: homepage } = useAsync(() => db.content.homepage(), []);
  const { data: featured } = useAsync(() => db.products.featured(), []);
  const { data: categories } = useAsync(() => db.categories.list(), []);
  const { data: counts } = useAsync(() => db.categories.counts(), []);
  const { data: coupon } = useAsync(() => db.content.coupon("EUNIK-DEC-2024"), []);
  const { data: journal } = useAsync(() => db.content.journal(), []);
  const { data: lookbook } = useAsync(() => db.content.lookbook(), []);
  const { data: settings } = useAsync(() => db.settings.get(), []);

  const slides = homepage?.hero ?? [];
  const active = slides[slide] ?? slides[0];
  const homeCategories = (categories ?? []).filter((category) => category.slug !== "suit");
  const promoLive = Boolean(
    homepage?.showPromo && coupon?.active && new Date(coupon.expiresAt).getTime() > Date.now(),
  );
  const freeShip = settings ? formatNaira(settings.freeShippingKobo) : "₦100,000";

  const perks = useMemo(
    () => [
      { icon: Package, title: "Free shipping", text: `Free shipping on orders over ${freeShip}` },
      { icon: RefreshCw, title: "30 days of free amendment", text: "Services time guarantee" },
      { icon: CreditCard, title: "Secure payment", text: "100% protected payment" },
      { icon: Headphones, title: "Online support", text: settings?.pickupLocation ? `${settings.pickupLocation} desk` : "24/7 days a week support" },
    ],
    [freeShip, settings?.pickupLocation],
  );

  const marquee = useMemo(() => {
    const items = [
      promoLive && coupon ? `Get ${coupon.percent}% off — code ${coupon.code}` : null,
      homepage?.aboutTrustLine,
      `Free shipping for orders over ${freeShip}`,
      "Pay with Paystack or bank transfer",
      homepage?.newArrivalTitle ? homepage.newArrivalTitle : null,
    ].filter(Boolean) as string[];
    return items.length ? items : ["The fashion core collection", "100% secure protected payment"];
  }, [promoLive, coupon, homepage, freeShip]);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = window.setInterval(() => {
      setSlide((current) => (current + 1) % slides.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const magazine = useMemo(() => journal ?? [], [journal]);

  return (
    <>
      <section className="relative h-[600px] overflow-hidden sm:h-[70vh] lg:h-screen">
        {slides.map((item, index) => (
          <div
            key={item.title}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
              index === slide ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url('${item.image}')` }}
          />
        ))}
        {active ? (
          <div className="relative z-10 flex h-full max-w-[1600px] flex-col justify-center px-4 lg:px-10">
            <p className="animate-fade-up mb-6 font-alt text-xl text-ink">
              <span className="highlight">Discount on selected collection!</span>
            </p>
            <h1 className="font-alt text-6xl font-semibold leading-none tracking-tight text-ink sm:text-8xl lg:text-[120px]">
              {active.title}
              <span className="block font-light">{active.subtitle}</span>
            </h1>
            <Link
              to={active.to}
              className="mt-10 inline-flex w-fit bg-ink px-8 py-4 text-lg text-white shadow-lg transition hover:bg-ink/90"
            >
              Shop Collection
            </Link>
          </div>
        ) : null}
        {slides.length > 0 ? (
          <div className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-3 text-ink lg:flex">
            <span className="text-sm font-medium">{padCount(slide + 1)}</span>
            <span className="h-24 w-px overflow-hidden bg-ink/20">
              <span
                className="block w-full bg-ink transition-all duration-500"
                style={{ height: `${((slide + 1) / slides.length) * 100}%` }}
              />
            </span>
            <span className="text-sm font-medium">{padCount(slides.length)}</span>
          </div>
        ) : null}
      </section>

      <section className="mx-auto grid max-w-[1600px] gap-8 px-4 py-16 sm:grid-cols-2 lg:px-10 xl:grid-cols-4">
        {perks.map((perk) => (
          <div key={perk.title} className="flex items-center gap-5">
            <perk.icon className="h-10 w-10 text-ink" strokeWidth={1.25} />
            <div>
              <p className="font-alt text-xl font-medium text-ink">{perk.title}</p>
              <p className="text-base leading-6">{perk.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-[1600px] px-4 pb-4 lg:px-10">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {homeCategories.map((category) => (
            <div key={category.slug} className="collection-card relative overflow-hidden">
              <Link to={category.path} className="block overflow-hidden">
                <img
                  src={category.homeTileImage ?? category.image}
                  alt={category.name}
                  className="aspect-[3/4] w-full object-cover transition duration-700"
                />
              </Link>
              <span className="absolute right-5 top-5 rounded-full border border-black/15 px-3 py-0.5 text-[11px] font-medium uppercase text-ink">
                {padCount(counts?.[category.slug] ?? 0)} items
              </span>
              <Link
                to={category.path}
                className="absolute bottom-10 left-1/2 min-w-[150px] -translate-x-1/2 rounded-full bg-white px-8 py-3 text-center text-lg font-alt shadow-lg"
              >
                {category.slug === "senator" ? "Men's Senator" : category.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section id="featured" className="mx-auto max-w-[1600px] px-4 py-20 lg:px-10">
        <div className="mb-12 text-center">
          <h2 className="font-alt text-4xl tracking-tight text-ink md:text-5xl">
            Best seller <span className="highlight font-semibold">Products</span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-7">
            Kindly click on the product image to instantly order - preferences like color, design
            and size can be changed during order process.
          </p>
        </div>
        <ProductGrid products={featured ?? []} />
      </section>

      {promoLive ? (
        <section className="bg-ink py-4 text-center text-[15px] uppercase tracking-wide text-white">
          Take an extra {coupon?.percent}% discount our favorite dress style. Use code:
          <span className="ml-2 inline-block rounded-full bg-gold px-4 py-0.5 text-[14px] font-bold text-ink">
            {coupon?.code}
          </span>
        </section>
      ) : null}

      {homepage?.showArrivals !== false ? (
        <section id="collections" className="relative overflow-hidden bg-paper py-20">
          <div className="mx-auto grid max-w-[1600px] items-center gap-10 px-4 lg:grid-cols-[280px_1fr] lg:px-10">
            <div className="text-center lg:text-left">
              <p className="mb-2 font-medium text-ink">
                <span className="highlight">{homepage?.newArrivalEyebrow ?? "LATEST 2024"}</span>
              </p>
              <h2 className="font-alt text-4xl leading-tight text-ink">
                {(homepage?.newArrivalTitle ?? "New arrival collection").split(" ").slice(0, 2).join(" ")}{" "}
                <span className="font-semibold">
                  {(homepage?.newArrivalTitle ?? "New arrival collection").split(" ").slice(2).join(" ")}
                </span>
              </h2>
              <p className="mt-4">Flash summer sale 30% off on selected collection for him.</p>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4">
              {(lookbook ?? []).map((item) => {
                const category = (categories ?? []).find((entry) => entry.slug === item.collection);
                return (
                  <Link
                    key={item.id}
                    to={category?.path ?? "/shop"}
                    className="group relative min-w-[240px] flex-1 overflow-hidden rounded-md"
                  >
                    <img src={item.image} alt={item.title} className="h-[420px] w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <p className="text-[22px] font-medium">{category?.name ?? item.title}</p>
                      <p className="text-sm uppercase tracking-wider text-white/70">
                        {category?.tagline ?? item.collection}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-2 text-sm uppercase tracking-wider text-white/70 underline underline-offset-4">
                        Explore collection
                      </span>
                    </div>
                    <span className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-gold text-ink opacity-0 transition group-hover:opacity-100">
                      <ArrowRight className="h-6 w-6" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
          <p className="pointer-events-none mt-6 hidden text-center text-[130px] font-bold leading-none text-ink/5 md:block lg:text-[180px]">
            new collection
          </p>
        </section>
      ) : null}

      <section className="overflow-hidden border-y border-line">
        <div className="animate-marquee flex w-max">
          {[...marquee, ...marquee].map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="border-r border-line px-16 py-7 font-alt text-[26px] font-medium whitespace-nowrap text-ink"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {homepage?.showMagazine !== false ? (
        <section id="news" className="mx-auto max-w-[1600px] px-4 py-20 lg:px-10">
          <h2 className="mb-12 text-center font-alt text-4xl text-ink md:text-5xl">
            {(homepage?.magazineTitle ?? "Eunik magazine").split(" ")[0]}{" "}
            <span className="highlight font-semibold">
              {(homepage?.magazineTitle ?? "Eunik magazine").split(" ").slice(1).join(" ") || "magazine"}
            </span>
          </h2>
          <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-4">
            {magazine.map((post) => (
              <article key={post.id}>
                <Link to={`/journal/${post.slug}`}>
                  <img src={post.image} alt="" className="mb-6 aspect-[4/5] w-full object-cover" />
                </Link>
                <p className="mb-2 text-sm">
                  By <span className="font-medium text-ink">{post.author}</span>
                  <span className="ml-2 text-muted">
                    {new Date(post.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </p>
                <Link to={`/journal/${post.slug}`}>
                  <h3 className="font-alt text-xl leading-7 font-medium text-ink">{post.title}</h3>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
