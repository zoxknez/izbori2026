import type { MetadataRoute } from "next";
import { getAllRules } from "@/lib/data";

const siteUrl = "https://izborilegalnost.vercel.app";
const staticRoutes = [
  "",
  "/vidim-problem",
  "/pravila",
  "/kontrolor",
  "/validator",
  "/van-birackog-mesta",
  "/krivicna-dela",
  "/mit-ili-cinjenica",
  "/rokovi",
  "/prijavi",
  "/izvori",
  "/trening/kviz",
  "/simulator/biracki-dan",
  "/offline",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rules = await getAllRules();
  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...rules.map((rule) => ({
      url: `${siteUrl}/pravila/${rule.slug}`,
      lastModified: getValidDate(rule.lastLegalReview, now),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

function getValidDate(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}
