import { type FormEvent, useState } from "react";
import { KeyRound, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Field, OsButton, SectionCard, inputClass } from "@/components/os/ui";
import { useSession } from "@/context/SessionProvider";
import { db, type Gender, type PublicUser, type Role } from "@/db/database";
import { MONTHS } from "@/lib/osNav";

export type ProfileKind = "client" | "staff" | "admin";

export function profileKind(role: Role | undefined): ProfileKind {
  if (!role || role === "client") return "client";
  if (role === "super_admin" || role === "manager") return "admin";
  return "staff";
}

export default function ProfileForm({ user }: { user: PublicUser }) {
  const { refresh } = useSession();
  const kind = profileKind(user.role);
  const [busy, setBusy] = useState(false);

  async function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await db.auth.updateMe({
        firstName: String(data.get("firstName") ?? ""),
        lastName: String(data.get("lastName") ?? ""),
        phone: String(data.get("phone") ?? ""),
        city: String(data.get("city") ?? ""),
        gender: (String(data.get("gender") || "male") as Gender) ?? "male",
        address: String(data.get("address") ?? ""),
        birthDay: Number(data.get("birthDay") || 0) || undefined,
        birthMonth: Number(data.get("birthMonth") || 0) || undefined,
        preferredFit: kind === "client" ? String(data.get("preferredFit") ?? "") : undefined,
        department: kind !== "client" ? String(data.get("department") ?? "") : undefined,
        jobTitle: kind !== "client" ? String(data.get("jobTitle") ?? "") : undefined,
        emergencyPhone: kind !== "client" ? String(data.get("emergencyPhone") ?? "") : undefined,
      });
      await refresh();
      toast.success("Profile saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await db.auth.changePassword(String(data.get("current")), String(data.get("next")));
      await refresh();
      toast.success("Password updated.");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change password.");
    } finally {
      setBusy(false);
    }
  }

  const title =
    kind === "client" ? "Client book" : kind === "admin" ? "House principal file" : "Staff file";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard
        title={title}
        action={<UserRound className="h-5 w-5 text-ink" />}
      >
        <form onSubmit={(event) => void saveDetails(event)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name">
              <input name="firstName" required defaultValue={user.firstName} className={inputClass} />
            </Field>
            <Field label="Last name">
              <input name="lastName" defaultValue={user.lastName ?? ""} className={inputClass} />
            </Field>
          </div>
          <Field label="Email">
            <input value={user.email} readOnly className={`${inputClass} bg-paper`} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Phone">
              <input name="phone" required defaultValue={user.phone} className={inputClass} />
            </Field>
            <Field label="Gender">
              <select name="gender" defaultValue={user.gender ?? "male"} className={inputClass}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
          </div>
          <Field label="Address">
            <input name="address" defaultValue={user.address ?? ""} className={inputClass} />
          </Field>
          <Field label="City">
            <input name="city" defaultValue={user.city} className={inputClass} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Birthday · day">
              <select name="birthDay" defaultValue={user.birthDay ?? ""} className={inputClass}>
                <option value="">—</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Birthday · month">
              <select name="birthMonth" defaultValue={user.birthMonth ?? ""} className={inputClass}>
                <option value="">—</option>
                {MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {kind === "client" ? (
            <Field label="Preferred fit">
              <select name="preferredFit" defaultValue={user.preferredFit ?? "regular"} className={inputClass}>
                <option value="slim">Slim</option>
                <option value="regular">Regular</option>
                <option value="relaxed">Relaxed</option>
              </select>
            </Field>
          ) : (
            <>
              <Field label="Department">
                <input name="department" defaultValue={user.department ?? ""} className={inputClass} />
              </Field>
              <Field label="Job title">
                <input name="jobTitle" defaultValue={user.jobTitle ?? ""} className={inputClass} />
              </Field>
              <Field label="Emergency phone">
                <input name="emergencyPhone" defaultValue={user.emergencyPhone ?? ""} className={inputClass} />
              </Field>
              {kind === "admin" ? (
                <p className="text-xs">
                  Role on this book: <strong className="capitalize text-ink">{user.role.replaceAll("_", " ")}</strong>
                </p>
              ) : (
                <p className="text-xs capitalize">Floor role · {user.role.replaceAll("_", " ")}</p>
              )}
            </>
          )}
          <OsButton type="submit" disabled={busy}>
            Save details
          </OsButton>
        </form>
      </SectionCard>
      <SectionCard title="Change password" action={<KeyRound className="h-5 w-5 text-ink" />}>
        {user.mustChangePassword ? (
          <p className="mb-4 rounded-xl border border-gold bg-gold/20 px-3 py-2 text-sm text-ink">
            You are still on a temporary password. Set a private one here.
          </p>
        ) : null}
        <form onSubmit={(event) => void savePassword(event)} className="space-y-4">
          <Field label="Current password">
            <input name="current" type="password" required className={inputClass} />
          </Field>
          <Field label="New password">
            <input name="next" type="password" required minLength={8} className={inputClass} />
          </Field>
          <OsButton type="submit" disabled={busy} variant="gold">
            Update password
          </OsButton>
        </form>
      </SectionCard>
    </div>
  );
}
