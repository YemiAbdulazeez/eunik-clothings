import { Fragment, type FormEvent, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Field, OsButton, PageHeader, SectionCard, inputClass } from "@/components/os/ui";
import { useSession } from "@/context/SessionProvider";
import { db, type NavSection, type PublicUser, type Role } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { assignedNav, defaultNav, HIRE_ROLES, NAV_CATALOG } from "@/lib/rbac";
import { navAreaLabel, previewLandingPath, validateStaffNav } from "@/lib/navAccess";
import { roleLabel } from "@/lib/format";

function NavTickGrid({
  value,
  onChange,
  disabled,
}: {
  value: NavSection[];
  onChange: (next: NavSection[]) => void;
  disabled?: boolean;
}) {
  function toggle(id: NavSection) {
    if (disabled || id === "profile") return;
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  }

  const groups = [
    { label: "House", items: NAV_CATALOG.filter((item) => item.area === "studio" && item.id !== "profile") },
    { label: "Floor", items: NAV_CATALOG.filter((item) => item.area === "atelier") },
  ];

  return (
    <div className="md:col-span-2 space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="os-label mb-2">{group.label} doors</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <label key={item.id} className="flex items-start gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={value.includes(item.id)}
                  disabled={disabled}
                  onChange={() => toggle(item.id)}
                />
                <span>
                  <span className="block text-ink">{item.label}</span>
                  <span className="text-xs text-muted">{item.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted">Profile stays on for every staff book.</p>
    </div>
  );
}

function StaffAccessEditor({ person }: { person: PublicUser }) {
  const [role, setRole] = useState<Role>(person.role);
  const [nav, setNav] = useState<NavSection[]>(assignedNav(person));
  const locked = person.role === "super_admin";

  async function save() {
    const check = validateStaffNav(role, nav);
    if (!check.ok) {
      toast.error(check.message);
      return;
    }
    try {
      if (role !== person.role) {
        await db.people.updateUser(person.id, { role, navSections: nav.includes("profile") ? nav : [...nav, "profile"] });
      } else {
        await db.people.setNav(person.id, nav);
      }
      toast.success("Access saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save access.");
    }
  }

  if (locked) {
    return <p className="text-sm text-muted">Principal — every studio door is open.</p>;
  }

  return (
    <div className="space-y-3 py-3">
      <Field label="Role">
        <select
          className={inputClass}
          value={role}
          onChange={(event) => {
            const next = event.target.value as Role;
            setRole(next);
            setNav(defaultNav(next));
          }}
        >
          {HIRE_ROLES.map((item) => (
            <option key={item} value={item}>
              {roleLabel(item)}
            </option>
          ))}
        </select>
      </Field>
      <NavTickGrid value={nav} onChange={setNav} />
      <p className="text-sm text-muted">
        Lands on <span className="font-mono text-ink">{previewLandingPath(role, nav)}</span> · {navAreaLabel({ role, navSections: nav })}
      </p>
      <OsButton onClick={() => void save()}>Save access</OsButton>
    </div>
  );
}

export default function StudioPeople() {
  const { user } = useSession();
  const { data: staff } = useAsync(() => db.people.staff(), []);
  const principal = user?.role === "super_admin";
  const [open, setOpen] = useState(false);
  const [hireRole, setHireRole] = useState<Role>("desk");
  const [hireNav, setHireNav] = useState<NavSection[]>(() => defaultNav("desk"));
  const [editing, setEditing] = useState<string | null>(null);

  const house = useMemo(() => staff ?? [], [staff]);

  async function hire(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!principal) return;
    const data = new FormData(event.currentTarget);
    const check = validateStaffNav(hireRole, hireNav);
    if (!check.ok) {
      toast.error(check.message);
      return;
    }
    try {
      await db.people.createStaff({
        email: String(data.get("email")),
        name: `${data.get("firstName")} ${data.get("lastName")}`.trim(),
        firstName: String(data.get("firstName")),
        lastName: String(data.get("lastName")),
        phone: String(data.get("phone")),
        role: hireRole,
        department: String(data.get("department")),
        jobTitle: String(data.get("jobTitle")),
        gender: String(data.get("gender")) as "male" | "female" | "other",
        emergencyPhone: String(data.get("emergencyPhone")),
        navSections: hireNav.includes("profile") ? hireNav : [...hireNav, "profile"],
      });
      toast.success("Staff book opened. Temporary password is the house demo password.");
      event.currentTarget.reset();
      setHireRole("desk");
      setHireNav(defaultNav("desk"));
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not hire.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        subtitle="Hire someone, pick Desk / Finance / Design / Floor, and choose what they can open."
        actions={
          principal ? (
            <OsButton variant="gold" onClick={() => setOpen(true)}>
              <UserPlus className="h-4 w-4" /> Add staff
            </OsButton>
          ) : undefined
        }
      />
      {open && principal ? (
        <SectionCard title="New staff file">
          <form onSubmit={(event) => void hire(event)} className="grid gap-3 md:grid-cols-2">
            <Field label="First name">
              <input name="firstName" required className={inputClass} />
            </Field>
            <Field label="Last name">
              <input name="lastName" className={inputClass} />
            </Field>
            <Field label="Work email">
              <input name="email" type="email" required className={inputClass} />
            </Field>
            <Field label="Phone">
              <input name="phone" required className={inputClass} />
            </Field>
            <Field label="Role">
              <select
                name="role"
                className={inputClass}
                value={hireRole}
                onChange={(event) => {
                  const next = event.target.value as Role;
                  setHireRole(next);
                  setHireNav(defaultNav(next));
                }}
              >
                {HIRE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Department">
              <input name="department" defaultValue="House" className={inputClass} />
            </Field>
            <Field label="Job title">
              <input name="jobTitle" className={inputClass} />
            </Field>
            <Field label="Gender">
              <select name="gender" className={inputClass}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Emergency phone">
              <input name="emergencyPhone" className={inputClass} />
            </Field>
            <NavTickGrid value={hireNav} onChange={setHireNav} />
            <p className="md:col-span-2 text-sm text-muted">
              Lands on <span className="font-mono text-ink">{previewLandingPath(hireRole, hireNav)}</span> ·{" "}
              {navAreaLabel({ role: hireRole, navSections: hireNav })}
            </p>
            <div className="flex gap-2 md:col-span-2">
              <OsButton type="submit">Save staff</OsButton>
              <OsButton variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </OsButton>
            </div>
          </form>
        </SectionCard>
      ) : null}
      <SectionCard title={`${house.length} on the house file`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-3">Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Phone</th>
                <th>What they can open</th>
                {principal ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {house.map((person) => (
                <Fragment key={person.id}>
                  <tr className="border-b border-line/70">
                    <td className="py-3 text-ink">{person.name}</td>
                    <td className="capitalize">{roleLabel(person.role)}</td>
                    <td>{person.department ?? "—"}</td>
                    <td>{person.phone}</td>
                    <td>{person.role === "super_admin" ? "All" : assignedNav(person).length}</td>
                    {principal ? (
                      <td>
                        {person.role === "super_admin" ? (
                          "—"
                        ) : (
                          <button
                            type="button"
                            className="underline"
                            onClick={() => setEditing((id) => (id === person.id ? null : person.id))}
                          >
                            {editing === person.id ? "Close" : "Assign"}
                          </button>
                        )}
                      </td>
                    ) : null}
                  </tr>
                  {principal && editing === person.id ? (
                    <tr className="border-b border-line/70 bg-paper/60">
                      <td colSpan={6} className="px-3">
                        <StaffAccessEditor person={person} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
