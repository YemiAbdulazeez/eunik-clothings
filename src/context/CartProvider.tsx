import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { db, type Cart } from "@/db/database";
import { subscribe } from "@/db/persist";
import { onCartChange } from "@/lib/cartEvents";

type CartContextValue = {
  cart: Cart | null;
  count: number;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);

  const refresh = async () => {
    const next = await db.cart.get();
    setCart(next);
  };

  useEffect(() => {
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
  }, []);

  const count = cart?.lines.reduce((sum, line) => sum + line.qty, 0) ?? 0;
  const value = useMemo(() => ({ cart, count, refresh }), [cart, count]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
