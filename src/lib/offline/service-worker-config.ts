/** Manual lifecycle policy: no automatic reload while a draft is in progress. */
export const serviceWorkerConfig = {
  register: false,
  reloadOnOnline: false,
  shellCache: "izborna-shell-v1",
  legalDataCache: "legal-data-v1",
} as const;
