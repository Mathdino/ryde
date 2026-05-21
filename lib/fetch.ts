import Constants from "expo-constants";
import { useCallback, useEffect, useState } from "react";

/**
 * Retorna a URL base do servidor de API.
 * - DEV: usa o IP do servidor Metro local (ex: http://192.168.x.x:8081/)
 * - PROD: usa EXPO_PUBLIC_SERVER_URL (Vercel/deploy)
 */
export const getServerUrl = (): string => {
  if (__DEV__) {
    // hostUri = "192.168.x.x:8081" em dispositivo físico ou emulador
    const hostUri =
      Constants.expoConfig?.hostUri ??
      Constants.manifest?.debuggerHost ??
      "localhost:8081";

    const host = hostUri.split(":")[0];
    return `http://${host}:8081/`;
  }

  return process.env.EXPO_PUBLIC_SERVER_URL ?? "";
};

export const fetchAPI = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, options);

    const text = await response.text();

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `Resposta inválida do servidor (status ${response.status}): ${text.slice(0, 200)}`,
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.error ?? data?.message ?? `HTTP error! status: ${response.status}`,
      );
    }

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export const useFetch = <T>(url: string, options?: RequestInit) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAPI(url, options);
      setData(result.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
