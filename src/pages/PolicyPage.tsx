import { useParams } from "react-router-dom";
import PageHero from "@/components/PageHero";

export default function PolicyPage() {
  const { kind = "order" } = useParams();
  const src = kind === "jobs" ? "/images/job-taking-policy.jpg" : "/images/order-policy.jpg";
  const title = kind === "jobs" ? "Job Taking Policy" : "Order Policy";

  return (
    <>
      <PageHero title={title} crumb="Policy" />
      <section className="mx-auto max-w-4xl px-6 py-10">
        <img src={src} alt={title} className="w-full border border-line" />
      </section>
    </>
  );
}
