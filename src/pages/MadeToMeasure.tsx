import { type ReactNode, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import PageHero from "@/components/PageHero";
import { PageHeader } from "@/components/os/ui";
import StaffShopGuard from "@/components/StaffShopGuard";
import { useSession } from "@/context/SessionProvider";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { formatNaira } from "@/lib/money";
import { inAccount, mtmHref } from "@/lib/osNav";

export default function MadeToMeasure() {
  const { sku = "" } = useParams();
  const { user } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const embedded = inAccount(location.pathname);
  const { data: product } = useAsync(() => db.products.getBySku(sku), [sku]);
  const { data: fabrics } = useAsync(() => db.products.fabrics(), []);
  const { data: profiles } = useAsync(
    () => (user ? db.measurements.listByCustomer(user.id) : Promise.resolve([])),
    [user?.id],
  );
  const [fabricId, setFabricId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [busy, setBusy] = useState(false);

  if (user && user.role !== "client") {
    return <StaffShopGuard>{null}</StaffShopGuard>;
  }

  async function add() {
    if (!product) return;
    if (!user) {
      navigate(`/account/login?next=${mtmHref(location.pathname, sku)}`);
      return;
    }
    if (!profileId) {
      toast.error("Choose a measurement profile.");
      return;
    }
    setBusy(true);
    try {
      await db.cart.add({
        productId: product.id,
        kind: "mtm",
        qty: 1,
        fabricId: fabricId || undefined,
        measurementProfileId: profileId,
      });
      toast.success("MTM look in your bag — deposit at checkout.");
      navigate("/checkout");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not configure.");
    } finally {
      setBusy(false);
    }
  }

  const frame = (inner: ReactNode) =>
    embedded ? (
      <div className="space-y-6">
        <PageHeader title="Made to measure" subtitle={product?.name} />
        {inner}
      </div>
    ) : (
      <>
        <PageHero title="Made to measure" crumb="MTM" />
        {inner}
      </>
    );

  return frame(
      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-2">
        <img src={product?.image} alt="" className="w-full object-cover" />
        <div>
          <p className="uppercase tracking-wide text-ink">{product?.sku}</p>
          <h1 className="font-alt text-4xl text-ink">{product?.name}</h1>
          <p className="mt-2">{product ? formatNaira(product.priceKobo) : ""} · 60% deposit at checkout</p>
          <p className="mt-6 os-label">Cloth</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(fabrics ?? []).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFabricId(item.id)}
                className={`rounded-full border px-4 py-2 text-sm ${fabricId === item.id ? "border-ink bg-ink text-white" : "border-line"}`}
              >
                {item.name}
                {item.status === "low" ? " · low" : ""}
              </button>
            ))}
          </div>
          <p className="mt-6 os-label">Measurements</p>
          <div className="mt-2 space-y-2">
            {(profiles ?? []).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setProfileId(item.id)}
                className={`block w-full rounded-xl border p-3 text-left ${profileId === item.id ? "border-ink" : "border-line"}`}
              >
                {item.name} · {item.fit} · {Object.keys(item.values).length} fields
              </button>
            ))}
          </div>
          <Link to="/account/measurements" className="mt-3 inline-block text-sm underline">
            Manage profiles
          </Link>
          <button disabled={busy} type="button" onClick={() => void add()} className="os-pill mt-8 bg-gold text-ink">
            Add MTM to bag
          </button>
        </div>
      </section>,
    );
}
