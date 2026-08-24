import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { Field, OsButton, inputClass } from "@/components/os/ui";

export default function MustChangePasswordGate({ children }: { children: ReactNode }) {
  const { user, refresh } = useSession();
  const [busy, setBusy] = useState(false);

  if (!user?.mustChangePassword) return <>{children}</>;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await db.auth.changePassword(String(data.get("current")), String(data.get("next")));
      await refresh();
      toast.success("Password updated — welcome in.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl">
        <h2 className="font-alt text-2xl text-ink">Set a private password</h2>
        <p className="mt-2 text-sm text-muted">
          The house issued a temporary password. Change it before you continue.
        </p>
        <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-3">
          <Field label="Current password">
            <input name="current" type="password" required className={inputClass} />
          </Field>
          <Field label="New password">
            <input name="next" type="password" required minLength={8} className={inputClass} />
          </Field>
          <OsButton type="submit" disabled={busy} loading={busy} className="w-full">
            Save and continue
          </OsButton>
        </form>
      </div>
    </div>
  );
}
