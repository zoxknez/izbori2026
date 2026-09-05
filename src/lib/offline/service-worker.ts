import { serviceWorkerConfig } from "./service-worker-config";
import { hasOpenDraft } from "./indexed-db";

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  if (serviceWorkerConfig.register) return navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
}

export async function activateWaitingServiceWorker(registration: ServiceWorkerRegistration): Promise<"activated" | "blocked" | "unavailable"> {
  if (!registration.waiting) return "unavailable";
  if (await hasOpenDraft()) return "blocked";
  return new Promise((resolve) => {
    const onControllerChange = () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      resolve("activated");
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange, { once: true });
    registration.waiting?.postMessage({ type: "SKIP_WAITING" });
  });
}
