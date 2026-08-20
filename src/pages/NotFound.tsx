import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";

export default function NotFound() {
  return (
    <>
      <PageHero title="Page not found" crumb="404" />
      <section className="mx-auto max-w-xl px-6 py-20 text-center">
        <h2 className="font-alt text-3xl text-ink">This cloth is not on the rail.</h2>
        <p className="mt-3">The page may have moved. Return to the house or open the shop.</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/" className="bg-ink px-6 py-3 text-white">
            Home
          </Link>
          <Link to="/shop" className="border border-ink px-6 py-3 text-ink">
            Shop
          </Link>
        </div>
      </section>
    </>
  );
}
