"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "@/lib/api";

export function useOrganizationResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const reload = useCallback(async () => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setLoading(true);
    setError("");
    try {
      const result = await load(request.signal);
      if (!request.signal.aborted) setData(result);
    } catch (error) {
      if (!request.signal.aborted) setError(getApiErrorMessage(error));
    } finally {
      if (!request.signal.aborted) setLoading(false);
    }
  }, [load]);
  useEffect(() => {
    void reload();
    return () => controller.current?.abort();
  }, [reload]);
  return { data, loading, error, reload };
}
