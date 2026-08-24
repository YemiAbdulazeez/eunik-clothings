import { Link } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader, PageLoading, EmptyState, OsButton, SectionCard } from "@/components/os/ui";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";

export default function AccountWishlist() {
  const { data: items, loading, reload } = useAsync(() => db.wishlist.list(), []);
  if (loading && !items) return <PageLoading />;
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
              <img src={item.image} alt="" className="mb-3 h-48 w-full rounded-xl object-cover" />
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
