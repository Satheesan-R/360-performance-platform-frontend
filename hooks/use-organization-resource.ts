"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "@/lib/api";

export function useOrganizationResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const fetchData = useCallback(async () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    try {
      const result = await Promise.resolve().then(() => load(request.signal));
      if (!request.signal.aborted) setData(result);
    } catch (error) {
      if (!request.signal.aborted) setError(getApiErrorMessage(error));
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }, [load]);
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    await fetchData();
  }, [fetchData]);
  useEffect(() => {
    const request = new AbortController();
    controller.current = request;
    Promise.resolve().then(() => load(request.signal))
      .then((result) => { if (!request.signal.aborted) setData(result); })
      .catch((error: unknown) => { if (!request.signal.aborted) setError(getApiErrorMessage(error)); })
      .finally(() => { if (!request.signal.aborted) setLoading(false); });
    return () => request.abort();
  }, [load]);
  return { data, loading, error, reload };
}
