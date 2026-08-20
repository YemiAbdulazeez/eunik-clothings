export function inAccount(pathname: string): boolean {
  return pathname.startsWith("/account");
}

export function shopHref(pathname: string, sku?: string): string {
  const base = inAccount(pathname) ? "/account/shop" : "/shop";
  return sku ? `${base}/${sku}` : base;
}

export function journalHref(pathname: string, slug?: string): string {
  const base = inAccount(pathname) ? "/account/journal" : "/journal";
  return slug ? `${base}/${slug}` : base;
}

export function mtmHref(pathname: string, sku: string): string {
  return inAccount(pathname) ? `/account/made-to-measure/${sku}` : `/made-to-measure/${sku}`;
}

export function collectionHref(pathname: string, path: string): string {
  if (!inAccount(pathname)) return path;
  const slug = path.replace(/^\//, "").replace("men-senator", "senator");
  return `/account/shop?collection=${slug === "collection" ? "" : slug}`;
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
