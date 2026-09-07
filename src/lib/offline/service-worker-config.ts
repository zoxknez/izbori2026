/** Manual lifecycle policy: no automatic reload while a draft is in progress. */
export const serviceWorkerConfig = {
  register: false,
  reloadOnOnline: false,
  shellCache: "izborna-shell-v2",
  legalDataCache: "legal-data-v2",
} as const;
