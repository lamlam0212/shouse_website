"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals(metric => {
    if (process.env.NODE_ENV !== "production") return;
    const body = JSON.stringify({
      type: "web-vital",
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
    navigator.sendBeacon("/api/telemetry", new Blob([body], { type: "application/json" }));
  });
  return null;
}
