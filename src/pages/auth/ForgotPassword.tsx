import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { db } from "@/db/database";

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    await db.auth.requestPasswordReset(email);
    setSent(true);
    toast.message("Demo has no mailer — use your house password or ask desk.");
  }

  return (
    <div className="eunik-os grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden bg-cover bg-center lg:block" style={{ backgroundImage: "url(/images/ara-bg.jpg)" }}>
        <div className="absolute inset-0 bg-linear-to-tr from-ink/90 via-ink/70 to-gold/30" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <img src="/images/eunik.png" alt="EUNIK" className="h-10 w-fit bg-white px-3 py-2" />
          <h1 className="font-alt text-4xl">We’ll return you to your book.</h1>
          <p className="text-sm text-white/70">© Eunik Clothings</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={(event) => void submit(event)} className="w-full max-w-md space-y-4">
          <Link to="/account/login">← Sign in</Link>
          <img src="/images/eunik.png" alt="EUNIK" className="h-8 lg:hidden" />
          <h2 className="font-alt text-2xl text-ink">Reset password</h2>
          <p className="text-sm text-muted">This presentation has no outbound mailer. Use the house demo password or ask desk to reset your file when the API is live.</p>
          <input name="email" type="email" required placeholder="Email" className="w-full border border-line px-3 py-3 text-ink" />
          <button className="os-pill w-full bg-ink text-white">Send link</button>
          {sent ? (
            <p className="text-sm">
              Demo has no mailer. Sign in with your house password or contact{" "}
              <a href="mailto:info@eunikclothings.com" className="underline">
                info@eunikclothings.com
              </a>
              .
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
