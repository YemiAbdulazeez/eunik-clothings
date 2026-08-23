import { useState, type ImgHTMLAttributes } from "react";

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
  const [loaded, setLoaded] = useState(false);
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
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          {...rest}
        />
      )}
    </div>
  );
}
