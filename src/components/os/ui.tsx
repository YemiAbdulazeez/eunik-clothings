import { type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, RefreshCw, type LucideIcon } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  onRefresh,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onRefresh?: () => void | Promise<unknown>;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="os-label mb-1">{eyebrow}</p> : null}
        <h1 className="font-alt text-3xl text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {onRefresh ? (
          <OsButton variant="ghost" onClick={() => onRefresh()} loadingText="Refreshing…">
            <RefreshCw className="h-4 w-4" /> Refresh
          </OsButton>
        ) : null}
        {actions}
      </div>
    </div>
  );
}

/** Full-page wait state for dashboard screens while data loads. */
export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[42vh] flex-col items-center justify-center gap-3 text-sm text-muted"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-ink" aria-hidden />
      <p>{label}</p>
    </div>
  );
}

export function OsButton({
  children,
  variant = "ink",
  type = "button",
  disabled,
  loading: loadingProp = false,
  loadingText,
  onClick,
  className = "",
}: {
  children: ReactNode;
  variant?: "ink" | "gold" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  onClick?: () => void | Promise<unknown>;
  className?: string;
}) {
  const [autoBusy, setAutoBusy] = useState(false);
  const loading = loadingProp || autoBusy;
  const look =
    variant === "gold"
      ? "bg-gold text-ink hover:bg-gold/90"
      : variant === "ghost"
        ? "border border-line bg-white text-ink hover:border-ink hover:bg-paper"
        : variant === "danger"
          ? "bg-[var(--destructive)] text-white hover:bg-red-700"
          : "bg-ink text-white hover:bg-ink/90";

  async function handleClick() {
    if (!onClick || loading) return;
    const result = onClick();
    if (result && typeof (result as Promise<unknown>).then === "function") {
      setAutoBusy(true);
      try {
        await result;
      } finally {
        setAutoBusy(false);
      }
    }
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={type === "submit" ? undefined : () => void handleClick()}
      className={`os-pill transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:cursor-not-allowed disabled:opacity-60 ${look} ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          <span>{loadingText ?? "Processing…"}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "plain",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "plain" | "gold" | "alert";
}) {
  const ring = tone === "gold" ? "ring-1 ring-gold" : tone === "alert" ? "ring-1 ring-[var(--destructive)]/40" : "";
  return (
    <article className={`rounded-2xl border border-line bg-white p-5 ${ring}`}>
      <p className="os-label">{label}</p>
      <p className="mt-2 font-alt text-3xl text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs">{hint}</p> : null}
    </article>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 ${className}`}>
      {title || action ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h2 className="font-alt text-xl text-ink">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatusBadge({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: "muted" | "gold" | "ok" | "warn" | "ink";
}) {
  const map = {
    muted: "bg-paper text-muted",
    gold: "bg-gold/30 text-ink",
    ok: "bg-green-100 text-green-800",
    warn: "bg-amber-100 text-amber-800",
    ink: "bg-ink text-white",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${map[tone]}`}>
      {label}
    </span>
  );
}

export function ProgressBar({ value, gold = false }: { value: number; gold?: boolean }) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-paper">
      <div
        className={`h-full rounded-full transition-all ${gold ? "bg-gold" : "bg-ink"}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  href?: string;
  onAction?: () => void;
  actionLabel?: string;
};

export function NeedAttention({ items }: { items: AttentionItem[] }) {
  if (!items.length) {
    return (
      <SectionCard title="Need attention">
        <p className="text-sm">Nothing urgent. The house is clear.</p>
      </SectionCard>
    );
  }
  return (
    <SectionCard title="Need attention">
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
            <div>
              <p className="font-medium text-ink">{item.title}</p>
              <p className="text-sm">{item.detail}</p>
            </div>
            {item.onAction ? (
              <OsButton variant="gold" onClick={item.onAction}>
                {item.actionLabel ?? "Act"}
              </OsButton>
            ) : item.href ? (
              <Link to={item.href} className="os-pill inline-flex bg-ink text-white">
                {item.actionLabel ?? "Open"} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <p className="font-alt text-xl text-ink">{title}</p>
      <p className="mt-2 text-sm">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="os-label">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-ink/20";

export type DashTile = {
  to: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
};

export function DashNavGrid({ tiles }: { tiles: DashTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Link
            key={tile.to}
            to={tile.to}
            className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-4 py-5 text-ink hover:border-gold"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper">
              <Icon className="h-5 w-5" />
            </span>
            <span className="font-alt text-lg leading-tight">{tile.label}</span>
            {tile.hint ? <span className="text-xs text-muted">{tile.hint}</span> : null}
          </Link>
        );
      })}
    </div>
  );
}
