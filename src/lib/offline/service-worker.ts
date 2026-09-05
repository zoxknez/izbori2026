import { serviceWorkerConfig } from "./service-worker-config";

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  if (serviceWorkerConfig.register) return navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
}
