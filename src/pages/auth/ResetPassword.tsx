import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import LoadingButton from "@/components/LoadingButton";
import { HTTP_ENABLED, httpAuth } from "@/api/http";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const userId = params.get("uid") ?? "";
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !userId) {
      toast.error("This reset link is incomplete. Request a new one.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      if (!HTTP_ENABLED) {
        toast.error("Password reset needs the live API.");
        return;
      }
      await httpAuth.resetPassword(userId, token, password);
      toast.success("Password updated. Sign in with your new password.");
      navigate("/account/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="eunik-os grid min-h-screen place-items-center p-6">
      <form onSubmit={(event) => void submit(event)} className="w-full max-w-md space-y-4 rounded-2xl border border-line bg-white p-6">
        <img src="/images/eunik.png" alt="EUNIK" className="h-8" />
        <h1 className="font-alt text-2xl text-ink">Set a new password</h1>
        <p className="text-sm text-muted">Works for client and house accounts.</p>
        {!token || !userId ? (
          <p className="text-sm text-destructive">
            Missing reset token.{" "}
            <Link to="/account/forgot-password" className="underline">
              Request a new link
            </Link>
            .
          </p>
        ) : (
          <>
            <label className="block">
              <span className="os-label">New password</span>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="mt-1 w-full rounded-xl border border-line px-3 py-3 text-ink"
              />
            </label>
            <label className="block">
              <span className="os-label">Confirm password</span>
              <input
                name="confirm"
                type="password"
                required
                minLength={8}
                className="mt-1 w-full rounded-xl border border-line px-3 py-3 text-ink"
              />
            </label>
            <LoadingButton type="submit" loading={busy} loadingText="Saving…" className="w-full">
              Save password
            </LoadingButton>
          </>
        )}
        <Link to="/account/login" className="inline-block text-sm underline">
          Back to sign in
        </Link>
      </form>
    </div>
  );
}
