import { Link } from "react-router-dom";

export type Crumb = { label: string; to?: string };

export default function PageHero({
  title,
  crumb,
  trail,
  image,
}: {
  title: string;
  crumb: string;
  trail?: Crumb[];
  image?: string;
}) {
  const crumbs = trail ?? [{ label: crumb }];

  return (
    <section
      className={`bg-linear-to-b from-paper to-white py-16 text-center ${image ? "relative overflow-hidden bg-cover bg-center" : ""}`}
      style={image ? { backgroundImage: `linear-gradient(rgba(255,255,255,0.88), rgba(255,255,255,0.95)), url('${image}')` } : undefined}
    >
      <h1 className="relative z-10 font-alt text-5xl font-semibold text-ink md:text-7xl">{title}</h1>
      <nav className="relative z-10 mt-4 flex flex-wrap justify-center gap-3 text-sm uppercase tracking-wide">
        <Link to="/" className="text-muted hover:text-ink">
          Home
        </Link>
        {crumbs.map((entry, index) => (
          <span key={`${entry.label}-${index}`} className="flex items-center gap-3">
            <span className="text-gold">/</span>
            {entry.to ? (
              <Link to={entry.to} className="text-muted hover:text-ink">
                {entry.label}
              </Link>
            ) : (
              <span className="text-ink">{entry.label}</span>
            )}
          </span>
        ))}
      </nav>
    </section>
  );
}
