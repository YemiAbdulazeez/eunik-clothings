import { type FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import LoadingButton from "@/components/LoadingButton";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { landingPath } from "@/db/session";
import { postLoginPath } from "@/lib/rbac";

const HEROES = ["/images/ara-bg.jpg", "/images/senator-bg.jpg", "/images/agbada-bg.jpg"];

export default function Login() {
  const { login } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const hero = useMemo(() => HEROES[Math.floor(Math.random() * HEROES.length)], []);
  const chips =
    import.meta.env.DEV && !import.meta.env.VITE_API_URL
      ? db.auth.demoAccounts().filter((item) => item.role === "client")
      : [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const session = await login(String(data.get("email")), String(data.get("password")));
      const me = await db.auth.me();
      navigate(me ? postLoginPath(me, params.get("next")) : landingPath(session.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="eunik-os grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden bg-cover bg-center lg:block" style={{ backgroundImage: `url(${hero})` }}>
        <div className="absolute inset-0 bg-linear-to-tr from-ink/90 via-ink/70 to-gold/30" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <img src="/images/eunik.png" alt="" className="h-10 w-fit bg-white px-3 py-2" />
          <div>
            <h1 className="font-alt text-4xl">Made for the man who is remembered.</h1>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
              <Shield className="h-4 w-4 text-gold" /> Measurements stored privately · Ibadan atelier
            </p>
          </div>
          <p className="text-sm text-white/70">© Eunik Clothings</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-lg">
          <Link to="/" className="text-sm text-ink hover:underline">
            ← Back to house
          </Link>
          <h2 className="mt-6 font-alt text-2xl text-ink">My account</h2>
          <p className="text-sm">Orders, quotes, and bookings.</p>
          <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
            <label className="block">
              <span className="os-label">Email</span>
              <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-line px-3 py-3 text-ink" />
            </label>
            <label className="block">
              <span className="os-label">Password</span>
              <input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-xl border border-line px-3 py-3 text-ink" />
            </label>
            <div className="flex justify-between text-xs">
              <span>Presentation accounts — not production.</span>
              <Link to="/account/forgot-password" className="hover:underline">
                Forgot
              </Link>
            </div>
            <LoadingButton type="submit" loading={busy} loadingText="Signing in…" className="w-full">
              Enter my account
            </LoadingButton>
          </form>
          <div className="mt-6 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.email}
                type="button"
                className="rounded-full border border-line px-3 py-1 text-xs text-ink transition-colors hover:border-ink hover:bg-paper"
                onClick={() => {
                  const form = document.querySelector<HTMLFormElement>("form");
                  if (!form) return;
                  (form.elements.namedItem("email") as HTMLInputElement).value = chip.email;
                  (form.elements.namedItem("password") as HTMLInputElement).value = db.demoPassword;
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <p className="mt-8 text-sm">
            <Link to="/account/register" className="text-ink underline">
              Create account
            </Link>
            <span className="mx-2">·</span>
            <Link to="/studio/login" className="text-muted hover:text-ink">
              House sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
