import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import PageHero from "@/components/PageHero";
import { AsyncGuard } from "@/components/AsyncState";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { useSession } from "@/context/SessionProvider";
import { formatNaira } from "@/lib/money";

export default function ThankYou() {
  const { id = "" } = useParams();
  const { user } = useSession();
  const { data: order, loading, error } = useAsync(() => db.orders.get(id), [id]);
  const welcome = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("eunik-welcome");
      return raw ? (JSON.parse(raw) as { email: string }) : null;
    } catch {
      return null;
    }
  }, []);

  return (
    <>
      <PageHero title="Thank you" crumb="Order" />
      <section className="mx-auto max-w-xl px-6 py-16 text-center">
        <AsyncGuard loading={loading} error={error}>
          <h2 className="font-alt text-3xl text-ink">The house has the ticket.</h2>
          {order ? (
          <>
            <p className="mt-4">
              Order #{order.number} · {formatNaira(order.totalKobo)}
            </p>
            <p className="mt-2 text-sm">
              {order.status === "awaiting_transfer"
                ? "Bank transfer is with finance — awaiting house confirmation."
                : "Demo Paystack recorded — no card was charged."}
            </p>
            {order.paidKobo < order.totalKobo ? (
              <p className="mt-2">
                Deposit {formatNaira(order.paidKobo)} · balance {formatNaira(order.totalKobo - order.paidKobo)}
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-4">We could not find that order in this browser.</p>
        )}
        {welcome || user ? (
          <div className="mt-8 rounded-2xl border border-line bg-paper p-5 text-left text-sm">
            <p className="font-medium text-ink">Your client book</p>
            <p className="mt-2">Email: {welcome?.email ?? user?.email}</p>
            <p className="mt-2">
              Check the mailbox on this demo for your temporary password, or sign in if you already have one.
            </p>
          </div>
        ) : null}
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/shop" className="bg-ink px-6 py-3 text-white">
            Shop
          </Link>
          <Link to="/account" className="border border-ink px-6 py-3 text-ink">
            Account
          </Link>
          <Link to="/account/profile" className="border border-gold px-6 py-3 text-ink">
            Change password
          </Link>
        </div>
        </AsyncGuard>
      </section>
    </>
  );
}
