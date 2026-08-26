import type { Product } from "@/db/types";

/**
 * Newest-first catalogue order, with optional pin slots via featuredRank.
 * featuredRank N (>0) forces that product into the Nth display slot (1-based).
 * Remaining slots fill by createdAt descending.
 */
export function arrangeByNewestWithPins<T extends Pick<Product, "featuredRank" | "name"> & { createdAt?: string }>(
  products: T[],
): T[] {
  const list = Array.isArray(products) ? products : [];
  if (list.length <= 1) return list;

  const byNewest = [...list].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (tb !== ta) return tb - ta;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  const pinned = new Map<number, T>();
  const unpinned: T[] = [];
  for (const product of byNewest) {
    const rank = Number(product.featuredRank) || 0;
    if (rank > 0 && !pinned.has(rank)) pinned.set(rank, product);
    else unpinned.push(product);
  }

  if (pinned.size === 0) return byNewest;

  const n = list.length;
  const slots: (T | null)[] = new Array(n).fill(null);

  for (const [rank, product] of pinned) {
    const preferred = Math.min(Math.max(rank, 1), n) - 1;
    if (slots[preferred] == null) {
      slots[preferred] = product;
      continue;
    }
    let placed = false;
    for (let i = 0; i < n; i++) {
      if (slots[i] == null) {
        slots[i] = product;
        placed = true;
        break;
      }
    }
    if (!placed) unpinned.push(product);
  }

  let u = 0;
  for (let i = 0; i < n; i++) {
    if (slots[i] == null) slots[i] = unpinned[u++];
  }
  while (u < unpinned.length) slots.push(unpinned[u++]);
  return slots.filter((item): item is T => Boolean(item));
}
