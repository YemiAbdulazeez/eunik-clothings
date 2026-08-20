import { NavLink, useLocation } from "react-router-dom";
import { Instagram, MapPin, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartProvider";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { landingPath } from "@/db/session";
import { formatNaira } from "@/lib/money";

const leftLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/collection", label: "Collection" },
  { to: "/lookbook", label: "Lookbook" },
  { to: "/events", label: "Events" },
  { to: "/journal", label: "Magazine" },
];

const rightLinks = [
  { to: "/book", label: "Book" },
  { to: "/bespoke", label: "Bespoke" },
  { to: "/track", label: "Track" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function NavItem({
  to,
  label,
  onClick,
}: {
  to: string;
  label: string;
  onClick?: () => void;
}) {
  const location = useLocation();
  const hash = to.split("#")[1];
  const isHash = Boolean(hash);
  const active =
    !isHash &&
    (to === "/"
      ? location.pathname === "/"
      : location.pathname === to || location.pathname.startsWith(`${to}/`));

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`px-3 py-2 text-[18px] tracking-tight transition-colors xl:px-4 xl:text-[19px] ${
        active ? "text-ink" : "text-ink/80 hover:text-ink"
      }`}
    >
      {label}
    </NavLink>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { count } = useCart();
  const { user } = useSession();
  const { data: settings } = useAsync(() => db.settings.get(), []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  const accountTo = user ? landingPath(user) : "/account/login";
  const staff = Boolean(user && user.role !== "client");
  const freeShip = settings ? formatNaira(settings.freeShippingKobo) : "₦100,000";
  const instagram = settings?.instagram;

  return (
    <header className="relative z-40">
      <div className="flex h-10 items-center justify-center bg-gold px-4 text-center text-[13px] font-medium uppercase tracking-wide text-ink">
        <span>Enjoy FREE standard delivery on orders over {freeShip}.</span>
        <NavLink
          to="/shop"
          className="ml-1.5 font-semibold underline decoration-ink/40 underline-offset-4 hover:decoration-ink"
        >
          Shop now
        </NavLink>
      </div>

      <nav className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-6">
          <div className="hidden items-center gap-2 lg:flex">
            <NavLink to="/contact" className="hidden items-center gap-1.5 text-[15px] text-ink xl:flex">
              <MapPin className="h-4 w-4" />
              <span className="hidden 2xl:inline">Find stores</span>
            </NavLink>
            <div className="ml-auto flex font-alt">
              {leftLinks.map((link) => (
                <NavItem key={link.label} {...link} />
              ))}
            </div>
          </div>

          <NavLink to="/" className="mx-auto shrink-0 lg:mx-0">
            <img src="/images/eunik.png" alt="Eunik Clothings" className="h-[34px] w-auto" />
          </NavLink>

          <div className="hidden items-center lg:flex">
            <div className="flex font-alt">
              {rightLinks.map((link) => (
                <NavItem key={link.label} {...link} />
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3 text-ink">
              <NavLink to="/search" aria-label="Search" className="p-1">
                <Search className="h-5 w-5" />
              </NavLink>
              <NavLink to={accountTo} aria-label="Account" className="p-1">
                <UserRound className="h-5 w-5" />
              </NavLink>
              {staff ? null : (
                <NavLink to="/cart" aria-label="Bag" className="relative p-1">
                  <ShoppingBag className="h-5 w-5" />
                  {count > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">
                      {count}
                    </span>
                  ) : null}
                </NavLink>
              )}
              {instagram ? (
                <a href={instagram} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 text-[15px] 2xl:flex">
                  <Instagram className="h-4 w-4" />
                  <span>Instagram</span>
                </a>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            {staff ? null : (
              <NavLink to="/cart" aria-label="Bag" className="relative">
                <ShoppingBag className="h-6 w-6 text-ink" />
                {count > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">
                    {count}
                  </span>
                ) : null}
              </NavLink>
            )}
            <button type="button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
              {open ? <X className="h-7 w-7 text-ink" /> : <Menu className="h-7 w-7 text-ink" />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="flex flex-col gap-1 border-t border-line bg-white px-6 py-6 font-alt lg:hidden">
            {[...leftLinks, ...rightLinks, { to: accountTo, label: "Account" }, { to: "/search", label: "Search" }].map(
              (link) => (
                <NavItem key={link.label} {...link} onClick={() => setOpen(false)} />
              ),
            )}
          </div>
        ) : null}
      </nav>
    </header>
  );
}
