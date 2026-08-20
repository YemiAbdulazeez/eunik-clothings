import type { Product } from "@/db/types";
import ProductCard from "./ProductCard";

export default function ProductGrid({
  products,
  compact = false,
}: {
  products: Product[];
  compact?: boolean;
}) {
  return (
    <div
      className={`grid gap-8 ${
        compact
          ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      }`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
