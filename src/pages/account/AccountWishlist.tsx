import { Link } from "react-router-dom";
import { toast } from "sonner";
import ProductImageSlider, { productGallery } from "@/components/ProductImageSlider";
import { PageHeader, PageLoading, PageError, EmptyState, OsButton, SectionCard } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";

export default function AccountWishlist() {
  const { data: items, loading, error, reload } = useAsync(() => db.wishlist.list(), []);
  if (loading && !items) return <PageLoading />;
  if (error && !items) return <PageError message={error} onRetry={() => reload()} />;
  return (
    <div className="space-y-6">
      <PageHeader title="Wishlist" subtitle="Looks you asked the house to keep." onRefresh={() => reload()} />
      {!items?.length ? (
        <EmptyState
          title="Empty"
          text="Heart a Senator or Ara'nbada from Shop."
          action={
            <Link to="/account/shop" className="os-pill bg-ink text-white">
              Open shop
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(items ?? []).map((item) => (
            <SectionCard key={item.id} title={item.name}>
              <div className="mb-3 overflow-hidden rounded-xl">
                <ProductImageSlider
                  images={productGallery(item)}
                  alt={item.name}
                  aspectClassName="aspect-[4/5] w-full"
                />
              </div>
              <p className="text-ink">{formatNaira(item.priceKobo)}</p>
              <div className="mt-3 flex gap-2">
                <Link to={`/account/shop/${item.sku}`} className="os-pill bg-ink text-white">
                  Open
                </Link>
                <OsButton
                  variant="ghost"
                  onClick={() => void db.wishlist.remove(item.id).then(() => toast.message("Removed from the book."))}
                >
                  Remove
                </OsButton>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
