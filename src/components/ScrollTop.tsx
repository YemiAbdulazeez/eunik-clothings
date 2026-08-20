import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function ScrollTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      className="fixed bottom-8 right-8 z-40 hidden flex-col items-center text-[13px] uppercase tracking-[0.2em] text-ink xl:flex"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span className="mb-2">Scroll</span>
      <span className="flex h-16 w-[2px] items-end bg-line">
        <ArrowUp className="relative left-[-7px] h-4 w-4" />
      </span>
    </button>
  );
}
