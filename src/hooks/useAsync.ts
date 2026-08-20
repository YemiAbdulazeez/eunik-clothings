import { useCallback, useEffect, useState } from "react";
import { subscribe } from "@/db/database";

export function useDbVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((current) => current + 1)), []);
  return version;
}

export function useAsync<T>(factory: () => Promise<T>, deps: unknown[] = []) {
  const version = useDbVersion();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(() => {
    let alive = true;
    setLoading(true);
    factory()
      .then((value) => {
        if (!alive) return;
        setData(value);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!alive) return;
        setError(cause instanceof Error ? cause.message : "Something went wrong.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, deps);

  useEffect(() => {
    return run();
  }, [version, run]);

  return { data, loading, error, reload: run };
}
