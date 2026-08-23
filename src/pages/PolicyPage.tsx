import { Link, useParams } from "react-router-dom";
import PageHero from "@/components/PageHero";
import { isLegalKind, LEGAL_DOCS } from "@/content/legal";

export default function PolicyPage() {
  const { kind } = useParams();
  const docKey = isLegalKind(kind) ? kind : "terms";
  const doc = LEGAL_DOCS[docKey];

  return (
    <>
      <PageHero title={doc.title} crumb={doc.crumb} />
      <section className="mx-auto max-w-3xl px-6 py-10">
        <p className="mb-2 text-sm text-muted">Last updated: {doc.updated}</p>
        <p className="mb-10 text-[17px] leading-8 text-ink">{doc.intro}</p>
        <nav className="mb-10 flex flex-wrap gap-x-4 gap-y-2 border-y border-line py-4 text-sm">
          {(
            [
              ["terms", "Terms"],
              ["privacy", "Privacy"],
              ["ndpr", "NDPR"],
              ["order", "Order Policy"],
              ["jobs", "Job Policy"],
            ] as const
          ).map(([slug, label]) => (
            <Link
              key={slug}
              to={`/policies/${slug}`}
              className={docKey === slug ? "font-medium text-ink" : "text-muted hover:text-ink"}
            >
              {label}
            </Link>
          ))}
        </nav>
        {doc.sections.map((section) => (
          <article key={section.heading} className="mb-10">
            <h2 className="mb-3 font-alt text-2xl text-ink">{section.heading}</h2>
            {section.body}
          </article>
        ))}
      </section>
    </>
  );
}
