import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

const variants = {
  ink: "bg-ink text-white hover:bg-ink/90",
  gold: "bg-gold text-ink hover:bg-gold/90",
  ghost: "border border-line bg-white text-ink hover:border-ink hover:bg-paper",
  whatsapp:
    "border-2 border-[#25D366]/40 bg-white text-ink hover:border-[#25D366] hover:bg-[#25D366] hover:text-white",
  danger: "bg-[var(--destructive)] text-white hover:bg-red-700",
  link: "bg-transparent text-ink underline-offset-4 hover:underline",
} as const;

type Variant = keyof typeof variants;

export default function LoadingButton({
  children,
  loading = false,
  loadingText,
  variant = "ink",
  className = "",
  disabled,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  variant?: Variant;
}) {
  const busy = loading || disabled;
  return (
    <button
      type={type}
      disabled={busy}
      aria-busy={loading || undefined}
      className={`os-pill transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...rest}
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
