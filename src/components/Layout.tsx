import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import CookieBanner from "./CookieBanner";
import Footer from "./Footer";
import Header from "./Header";
import ScrollTop from "./ScrollTop";
import InstallPrompt from "./InstallPrompt";
import { db } from "@/db/database";
import { useAsync } from "@/hooks/useAsync";
import { trackPageView } from "@/lib/track";

export default function Layout() {
  const location = useLocation();
  const { data: settings } = useAsync(() => db.settings.get(), []);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      });
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);

  // When VITE_API_URL is set, demoMode comes from Postgres settings.
  // In local dev without an API, always show the banner.
  const apiConfigured = Boolean(import.meta.env.VITE_API_URL);
  const showDemoBanner = apiConfigured ? Boolean(settings?.demoMode) : (import.meta.env.DEV || Boolean(settings?.demoMode));

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Outlet />
      </main>
      {showDemoBanner ? (
        <p className="bg-paper py-1 text-center text-[11px] uppercase tracking-wide text-ink">
          Presentation store — no live charges — data stays in this browser.
        </p>
      ) : null}
      <Footer />
      <CookieBanner />
      <InstallPrompt />
      <ScrollTop />
    </div>
  );
}
