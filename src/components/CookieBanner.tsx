import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("eunik-cookies");
    if (!accepted) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 w-[min(340px,calc(100%-2.5rem))] rounded-lg bg-ink p-6 text-white shadow-2xl">
      <p className="mb-5 text-sm leading-6">
        We use cookies to remember preferences and measure site traffic after you consent. See our cookie policy for details.
      </p>
      <Link
        to="/policies/privacy"
        className="mb-3 block w-full rounded-full border border-white/20 py-2 text-center text-sm"
        onClick={() => setVisible(false)}
      >
        Privacy &amp; cookies
      </Link>
      <button
        type="button"
        className="w-full rounded-full bg-white py-2 text-sm text-ink"
        onClick={() => {
          localStorage.setItem("eunik-cookies", "1");
          // Seed the visitor ID now so the next page_view is attributed
          if (!localStorage.getItem("eunik_vid")) {
            localStorage.setItem("eunik_vid", `v_${crypto.randomUUID().replace(/-/g, "")}`);
          }
          setVisible(false);
        }}
      >
        Allow cookies
      </button>
    </div>
  );
}
