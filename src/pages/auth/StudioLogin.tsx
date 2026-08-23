import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import LoadingButton from "@/components/LoadingButton";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { landingPath } from "@/db/session";

export default function StudioLogin() {
  const { login } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const chips =
    import.meta.env.DEV && !import.meta.env.VITE_API_URL
      ? db.auth.demoAccounts().filter((item) => item.role !== "client")
      : [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const session = await login(String(data.get("email")), String(data.get("password")), {
        portal: "staff",
        remember: data.get("remember") === "on",
      });
      const me = await db.auth.me();
      navigate(me ? landingPath(me) : landingPath(session.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Staff sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="eunik-os grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden bg-linear-to-br from-ink via-nero to-ink lg:flex">
        <div className="flex h-full flex-col justify-between p-12 text-white">
          <img src="/images/eunik.png" alt="EUNIK" className="h-10 w-fit bg-white px-3 py-2" />
          <div>
            <p className="os-label text-gold">Restricted</p>
            <h1 className="font-alt text-4xl">House</h1>
            <p className="mt-4 max-w-sm text-white/70">Desk, Finance, Design, and Floor — sign in with your work email.</p>
          </div>
          <p className="text-sm text-white/50">EUNIK MULTIPURPOSE COMPANY NIGERIA LIMITED</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link to="/" className="text-sm">
            ← Back to house
          </Link>
          <img src="/images/eunik.png" alt="EUNIK" className="mt-6 h-8 lg:hidden" />
          <h2 className="mt-6 font-alt text-2xl text-ink">House sign in</h2>
          <form id="studio-login" onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
            <label className="block">
              <span className="os-label">Work email</span>
              <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-line px-3 py-3 text-ink" />
            </label>
            <label className="block">
              <span className="os-label">Password</span>
              <input name="password" type="password" required className="mt-1 w-full rounded-xl border border-line px-3 py-3 text-ink" />
            </label>
            <div className="flex items-center justify-between gap-3 text-xs">
              <label className="inline-flex cursor-pointer items-center gap-2 text-ink">
                <input type="checkbox" name="remember" className="accent-ink" />
                Remember me
              </label>
              <Link to="/account/forgot-password?from=studio" className="hover:underline">
                Forgot password?
              </Link>
            </div>
            <LoadingButton type="submit" loading={busy} loadingText="Signing in…" className="w-full">
              Open House
            </LoadingButton>
          </form>
          <div className="mt-6 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.email}
                type="button"
                className="rounded-full border border-line px-3 py-1 text-xs"
                onClick={() => {
                  const form = document.getElementById("studio-login") as HTMLFormElement;
                  (form.elements.namedItem("email") as HTMLInputElement).value = chip.email;
                  (form.elements.namedItem("password") as HTMLInputElement).value = db.demoPassword;
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <Link to="/account/login" className="mt-8 inline-block text-sm text-ink underline">
            My account sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
