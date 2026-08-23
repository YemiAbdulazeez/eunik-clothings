import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { db, type Cart } from "@/db/database";
import { useSession } from "@/context/SessionProvider";
import { subscribe } from "@/db/persist";
import { onCartChange } from "@/lib/cartEvents";

type CartContextValue = {
  cart: Cart | null;
  count: number;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: sessionLoading } = useSession();
  const [cart, setCart] = useState<Cart | null>(null);
  const isStaff = Boolean(user && user.role !== "client");

  const refresh = async () => {
    if (isStaff) {
      setCart({ id: "staff-bag", ownerId: user!.id, lines: [] });
      return;
    }
    try {
      const next = await db.cart.get();
      setCart(next);
    } catch {
      setCart(null);
    }
  };

  useEffect(() => {
    if (sessionLoading) return;
    void refresh();
    const unsubLocal = subscribe(() => {
      void refresh();
    });
    const unsubHttp = onCartChange(() => {
      void refresh();
    });
    return () => {
      unsubLocal();
      unsubHttp();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when identity changes
  }, [sessionLoading, user?.id, user?.role]);

  const count = isStaff ? 0 : (cart?.lines.reduce((sum, line) => sum + line.qty, 0) ?? 0);
  const value = useMemo(() => ({ cart: isStaff ? { id: "staff-bag", ownerId: user?.id ?? "staff", lines: [] } : cart, count, refresh }), [cart, count, isStaff, user?.id]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
