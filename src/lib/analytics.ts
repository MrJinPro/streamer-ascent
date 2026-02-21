type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export const trackEvent = (event: string, payload?: AnalyticsPayload) => {
  if (typeof window === 'undefined') return;

  const body = {
    event,
    timestamp: new Date().toISOString(),
    ...(payload ?? {}),
  };

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(body);
};
