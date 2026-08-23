import { type FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import LoadingButton from "@/components/LoadingButton";
import { HTTP_ENABLED, httpAuth } from "@/api/http";
import { db } from "@/db/database";

export default function ForgotPassword() {
  const [params] = useSearchParams();
  const fromStudio = params.get("from") === "studio";
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!email) return;
    setBusy(true);
    try {
      if (HTTP_ENABLED) {
        await httpAuth.forgotPassword(email);
      } else {
        await db.auth.requestPasswordReset(email);
      }
      setSent(true);
      toast.success("If that email is on file, a reset link is on its way.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send reset link.");
    } finally {
      setBusy(false);
    }
  }

  const backTo = fromStudio ? "/studio/login" : "/account/login";

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
          <Link to={backTo}>← Sign in</Link>
          <img src="/images/eunik.png" alt="EUNIK" className="h-8 lg:hidden" />
          <h2 className="font-alt text-2xl text-ink">Reset password</h2>
          <p className="text-sm text-muted">
            Enter the email for your client or house account. We’ll send a secure link to set a new password.
          </p>
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full border border-line px-3 py-3 text-ink"
          />
          <LoadingButton type="submit" loading={busy} loadingText="Sending…" className="w-full">
            Send reset link
          </LoadingButton>
          {sent ? (
            <p className="text-sm text-muted">
              Check your inbox (and spam). The link expires in 24 hours. Need help?{" "}
              <a href="mailto:info@eunikclothings.com" className="underline">
                info@eunikclothings.com
              </a>
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
