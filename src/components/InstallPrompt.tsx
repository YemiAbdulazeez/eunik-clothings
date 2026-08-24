import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallPrompt() {
  const [event, setEvent] = useState<PromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [hidden, setHidden] = useState(() => localStorage.getItem("eunik-install-dismiss") === "1");

  useEffect(() => {
    if (isStandalone()) return;

    function onPrompt(e: Event) {
      e.preventDefault();
      setEvent(e as PromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS never fires beforeinstallprompt — show Share → Add to Home Screen tip
    if (isIos()) {
      const t = window.setTimeout(() => setIosHint(true), 1200);
      return () => {
        window.removeEventListener("beforeinstallprompt", onPrompt);
        window.clearTimeout(t);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden || isStandalone()) return null;
  if (!event && !iosHint) return null;

  function dismiss() {
    localStorage.setItem("eunik-install-dismiss", "1");
    setHidden(true);
  }

  return (
    <div className="fixed bottom-20 left-4 z-40 max-w-sm rounded-2xl border border-line bg-white p-4 text-sm shadow-lg lg:bottom-4">
      <div className="flex items-start gap-3">
        <Download className="mt-0.5 h-5 w-5 shrink-0 text-ink" />
        <div>
          <p className="font-medium text-ink">Install the EUNIK app</p>
          {event ? (
            <>
              <p className="mt-1 text-muted">Add the house to your home screen — shop, track and fittings without the browser chrome.</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="os-pill bg-ink text-white"
                  onClick={() =>
                    void event.prompt().then(() => {
                      setEvent(null);
                      dismiss();
                    })
                  }
                >
                  Install
                </button>
                <button type="button" className="os-pill border border-line" onClick={dismiss}>
                  Not now
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-muted">
                On iPhone/iPad: tap <Share className="inline h-3.5 w-3.5" /> Share, then{" "}
                <strong className="text-ink">Add to Home Screen</strong>.
              </p>
              <button type="button" className="os-pill mt-3 border border-line" onClick={dismiss}>
                Got it
              </button>
            </>
          )}
        </div>
        <button type="button" aria-label="Dismiss" onClick={dismiss}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
