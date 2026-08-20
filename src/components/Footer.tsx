import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, Phone } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { CONTACT_EMAIL } from "@/data/catalog";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/context/SessionProvider";
import { landingPath } from "@/db/session";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/collection", label: "Collection" },
  { to: "/lookbook", label: "Lookbook" },
  { to: "/events", label: "Events" },
  { to: "/book", label: "Book" },
  { to: "/journal", label: "Magazine" },
  { to: "/track", label: "Track order" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Footer() {
  const [status, setStatus] = useState("");
  const { user } = useSession();
  const { data: settings } = useAsync(() => db.settings.get(), []);
  const { data: categories } = useAsync(() => db.categories.list(), []);
  const email = settings?.email ?? CONTACT_EMAIL;
  const instagram = settings?.instagram;
  const facebook = settings?.facebook;
  const twitter = settings?.twitter;
  const phone = settings?.phone ?? "08167073585";
  const accountTo = user ? landingPath(user) : "/account/login";
  const staff = Boolean(user && user.role !== "client");
  const accountLabel = staff ? "House" : "My account";

  async function handleNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const subscriber = String(new FormData(form).get("email") ?? "");
    if (!subscriber) return;
    await db.newsletter.subscribe(subscriber);
    setStatus("Thanks for joining Eunik.");
    toast.success("You’re on the house list.");
    form.reset();
  }

  return (
    <footer className="bg-ink text-[15px] leading-7 text-muted">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 border-b border-white/10 py-8 md:flex-row">
          <Link to="/" className="bg-white px-4 py-3">
            <img src="/images/eunik.png" alt="Eunik Clothings" className="h-[34px] w-auto" />
          </Link>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-white">
            {nav.map((item) => (
              <Link key={item.label} to={item.to} className="hover:text-gold">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-3 text-[17px] font-medium text-white">Categories</p>
            <ul className="space-y-1">
              {(categories ?? []).map((category) => (
                <li key={category.slug}>
                  <Link to={category.path} className="hover:text-white">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[17px] font-medium text-white">Information</p>
            <ul className="space-y-1">
              <li>
                <Link to="/about" className="hover:text-white">
                  About us
                </Link>
              </li>
              <li>
                <Link to={accountTo} className="hover:text-white">
                  {accountLabel}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white">
                  Contact us
                </Link>
              </li>
              <li>
                <Link to="/policies/order" className="hover:text-white">
                  Order Policy
                </Link>
              </li>
              <li>
                <Link to="/policies/jobs" className="hover:text-white">
                  Job Taking Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[17px] font-medium text-white">Quick contact</p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-white" />
              <a href={`tel:${phone}`} className="hover:text-white">
                {phone}
              </a>
            </p>
            <p className="mb-4 mt-1 flex items-center gap-2">
              <Mail className="h-4 w-4 text-white" />
              <a href={`mailto:${email}`} className="underline decoration-white/30 underline-offset-4 hover:text-white">
                {email}
              </a>
            </p>
            {(facebook || twitter || instagram) ? (
              <>
                <p className="mb-2 text-[17px] font-medium text-white">Connect with us</p>
                <div className="flex gap-4 text-white">
                  {facebook ? (
                    <a href={facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
                      <Facebook className="h-4 w-4" />
                    </a>
                  ) : null}
                  {twitter ? (
                    <a href={twitter} target="_blank" rel="noreferrer" aria-label="Twitter">
                      <span className="text-sm font-semibold">X</span>
                    </a>
                  ) : null}
                  {instagram ? (
                    <a href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                      <Instagram className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          <div>
            <p className="mb-2 text-[17px] font-medium text-white">Become a customer</p>
            <p className="mb-4">Join now and get 20% extra discount!</p>
            <form onSubmit={(event) => void handleNewsletter(event)} className="relative">
              <input
                type="email"
                name="email"
                required
                placeholder="Enter your email"
                className="w-full rounded bg-nero px-4 py-2.5 pr-12 text-sm text-white outline-none placeholder:text-white/40"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white" aria-label="Subscribe">
                <Mail className="h-4 w-4" />
              </button>
            </form>
            {status ? <p className="mt-2 text-gold">{status}</p> : null}
          </div>
        </div>
      </div>

      <div className="bg-nero py-7 text-[15px] text-muted">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-center lg:flex-row lg:text-left">
          <p className="text-white/80">Paystack · Bank transfer · Ibadan pickup</p>
          <p>
            © {new Date().getFullYear()} Eunik is Proudly developed by{" "}
            <a
              href="https://azeezadeleye.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="text-white underline decoration-white/30 underline-offset-4"
            >
              Abdul-Azeez Adeleye
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
