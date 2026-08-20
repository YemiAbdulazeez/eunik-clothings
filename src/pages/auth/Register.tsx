import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { db } from "@/db/database";
import { useSession } from "@/context/SessionProvider";
import { landingPath } from "@/db/session";
import { MONTHS } from "@/lib/osNav";

export default function Register() {
  const navigate = useNavigate();
  const { user, refresh } = useSession();
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const firstName = String(data.get("firstName"));
      const lastName = String(data.get("lastName"));
      await db.auth.register({
        email: String(data.get("email")),
        password: String(data.get("password")),
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        phone: String(data.get("phone")),
        city: String(data.get("city")),
        gender: String(data.get("gender")) as "male" | "female" | "other",
        address: String(data.get("address")),
        birthDay: Number(data.get("birthDay") || 0) || undefined,
        birthMonth: Number(data.get("birthMonth") || 0) || undefined,
        preferredFit: String(data.get("preferredFit")),
      });
      await refresh();
      navigate("/account");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open an account.");
    } finally {
      setBusy(false);
    }
  }

  if (user && user.role !== "client") {
    return <Navigate to={landingPath(user)} replace />;
  }

  return (
    <div className="eunik-os grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden bg-cover bg-center lg:block" style={{ backgroundImage: "url(/images/senator-bg.jpg)" }}>
        <div className="absolute inset-0 bg-linear-to-tr from-ink/90 via-ink/70 to-gold/30" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <img src="/images/eunik.png" alt="EUNIK" className="h-10 w-fit bg-white px-3 py-2" />
          <h1 className="font-alt text-4xl">Open a client book at the Ibadan house.</h1>
          <p className="text-sm text-white/70">© Eunik Clothings</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={(event) => void submit(event)} className="w-full max-w-lg space-y-4">
          <Link to="/account/login" className="text-sm">
            ← Sign in
          </Link>
          <img src="/images/eunik.png" alt="EUNIK" className="h-8 lg:hidden" />
          <h2 className="font-alt text-2xl text-ink">Create a client book</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="firstName" required placeholder="First name" className="border border-line px-3 py-3 text-ink" />
            <input name="lastName" required placeholder="Last name" className="border border-line px-3 py-3 text-ink" />
          </div>
          <input name="email" type="email" required placeholder="Email" className="w-full border border-line px-3 py-3 text-ink" />
          <input name="phone" required placeholder="Phone" className="w-full border border-line px-3 py-3 text-ink" />
          <input name="address" placeholder="Address" className="w-full border border-line px-3 py-3 text-ink" />
          <input name="city" defaultValue="Ibadan" placeholder="City" className="w-full border border-line px-3 py-3 text-ink" />
          <div className="grid gap-3 sm:grid-cols-3">
            <select name="gender" className="border border-line px-3 py-3 text-ink">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <select name="birthDay" className="border border-line px-3 py-3 text-ink">
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <select name="birthMonth" className="border border-line px-3 py-3 text-ink">
              <option value="">Month</option>
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <select name="preferredFit" className="w-full border border-line px-3 py-3 text-ink">
            <option value="slim">Slim fit</option>
            <option value="regular">Regular fit</option>
            <option value="relaxed">Relaxed fit</option>
          </select>
          <input name="password" type="password" required minLength={8} placeholder="Password" className="w-full border border-line px-3 py-3 text-ink" />
          <button disabled={busy} className="os-pill w-full bg-ink text-white">
            Open my book
          </button>
        </form>
      </div>
    </div>
  );
}
