import { useEffect, useMemo, useState } from "react";

/** Cycles product gallery images every 3s when there is more than one. */
export default function ProductImageSlider({
  images,
  alt,
  className = "h-full w-full object-cover",
  aspectClassName = "aspect-[3/4] w-full",
  intervalMs = 3000,
}: {
  images: string[];
  alt: string;
  className?: string;
  aspectClassName?: string;
  intervalMs?: number;
}) {
  const slides = useMemo(() => [...new Set((images ?? []).filter(Boolean))], [images]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [slides.join("|")]);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [slides.length, intervalMs]);

  if (!slides.length) {
    return <div className={`${aspectClassName} bg-paper`} aria-hidden />;
  }

  return (
    <div className={`relative overflow-hidden bg-paper ${aspectClassName}`}>
      {slides.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt={i === index ? alt : ""}
          className={`${className} absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {slides.length > 1 ? (
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full shadow-sm ${i === index ? "bg-white" : "bg-white/45"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function productGallery(product: { image?: string; images?: string[] }): string[] {
  const list = product.images?.length ? product.images : product.image ? [product.image] : [];
  return [...new Set(list.filter(Boolean))];
}
