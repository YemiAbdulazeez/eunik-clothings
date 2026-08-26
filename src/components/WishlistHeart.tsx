import { Heart } from "lucide-react";
import { type MouseEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { isHouseStaff } from "@/lib/rbac";

const GUEST_WISHLIST_KEY = "eunik-guest-wishlist";

function readGuestIds(): string[] {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeGuestIds(ids: string[]) {
  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify([...new Set(ids)]));
}

/** Heart for clients + guests only (hidden for house staff). Guests store locally until sign-in. */
export default function WishlistHeart({
  productId,
  className = "",
}: {
  productId: string;
  className?: string;
}) {
  const { user } = useSession();
  const navigate = useNavigate();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (isHouseStaff(user)) return;
      if (user?.role === "client") {
        try {
          const list = await db.wishlist.list();
          if (alive) setOn(list.some((item) => item.id === productId));
        } catch {
          if (alive) setOn(false);
        }
        return;
      }
      if (alive) setOn(readGuestIds().includes(productId));
    }
    void load();
    return () => {
      alive = false;
    };
  }, [user, productId]);

  if (isHouseStaff(user)) return null;

  async function toggle(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      if (user?.role === "client") {
        if (on) {
          await db.wishlist.remove(productId);
          setOn(false);
          toast.message("Removed from wishlist.");
        } else {
          await db.wishlist.add(productId);
          setOn(true);
          toast.success("Saved to wishlist.");
        }
        return;
      }
      // Guest — local book; nudge toward account
      const ids = readGuestIds();
      if (ids.includes(productId)) {
        writeGuestIds(ids.filter((id) => id !== productId));
        setOn(false);
        toast.message("Removed from saved looks.");
      } else {
        writeGuestIds([...ids, productId]);
        setOn(true);
        toast.success("Saved. Sign in to keep it on your wishlist.", {
          action: {
            label: "Sign in",
            onClick: () => navigate("/account/login?next=/account/wishlist"),
          },
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update wishlist.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      disabled={busy}
      onClick={(event) => void toggle(event)}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/95 text-ink shadow-sm transition hover:border-ink disabled:opacity-60 ${className}`}
    >
      <Heart className={`h-4 w-4 ${on ? "fill-ink text-ink" : ""}`} />
    </button>
  );
}

/** Call after client login to merge guest hearts into the account wishlist. */
export async function mergeGuestWishlistIntoAccount(): Promise<void> {
  const ids = readGuestIds();
  if (!ids.length) return;
  for (const productId of ids) {
    try {
      await db.wishlist.add(productId);
    } catch {
      /* ignore duplicates / failures */
    }
  }
  writeGuestIds([]);
}
