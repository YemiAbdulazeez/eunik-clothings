import { useState, type ImgHTMLAttributes } from "react";

/** Session memory so remounts skip skeleton/opacity flash for recently shown images. */
const seen = new Set<string>();

export default function LazyImage({
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  aspectClassName,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & {
  wrapperClassName?: string;
  aspectClassName?: string;
}) {
  const known = Boolean(src && seen.has(src));
  const [loaded, setLoaded] = useState(known);
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-paper ${aspectClassName ?? ""} ${wrapperClassName}`}>
      {!loaded && !failed ? (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-paper via-line/60 to-paper" aria-hidden />
      ) : null}
      {failed || !src ? (
        <div className={`flex items-center justify-center bg-paper text-xs text-muted ${className}`}>Image unavailable</div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={known ? "eager" : "lazy"}
          decoding="async"
          // Hint the browser to keep/reuse HTTP cache aggressively for product imagery
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => {
            seen.add(src);
            setLoaded(true);
          }}
          onError={() => setFailed(true)}
          className={`${className} transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
          {...rest}
        />
      )}
    </div>
  );
}
