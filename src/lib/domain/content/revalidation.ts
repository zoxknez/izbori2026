import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Public pages are statically regenerated for speed. Any editorial or legal
 * mutation must explicitly invalidate every page whose server payload embeds
 * the changed data, so a publish never leaves a visitor on a one-hour-old rule.
 */
const PUBLIC_CONTENT_PATHS = [
  "/",
  "/pravila",
  "/vidim-problem",
  "/kontrolor",
  "/van-birackog-mesta",
  "/izvori",
  "/mit-ili-cinjenica",
  "/trening/kviz",
  "/sitemap.xml",
] as const;

export function revalidatePublicContent(): void {
  PUBLIC_CONTENT_PATHS.forEach((path) => revalidatePath(path));
}
