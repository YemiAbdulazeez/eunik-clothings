import { useCallback, useEffect, useRef, useState } from "react";
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
  const factoryRef = useRef(factory);
  factoryRef.current = factory;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const value = await factoryRef.current();
      setData(value);
      setError(null);
      return value;
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : "Something went wrong.";
      setError(message);
      throw cause;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps mirror useEffect factory identity
  }, deps);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    factoryRef.current()
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
  }, [version, reload]);

  return { data, loading, error, reload };
}
