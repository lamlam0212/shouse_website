function report(payload: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") return;
  const body = JSON.stringify({ ...payload, timestamp: new Date().toISOString() });
  navigator.sendBeacon("/api/telemetry", new Blob([body], { type: "application/json" }));
}

window.addEventListener("error", event => {
  report({ type: "client-error", message: event.message, path: location.pathname });
});

window.addEventListener("unhandledrejection", event => {
  const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
  report({ type: "client-rejection", message, path: location.pathname });
});
