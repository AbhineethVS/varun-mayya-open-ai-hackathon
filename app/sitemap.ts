import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, lastModified: new Date("2026-08-23"), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/review`, lastModified: new Date("2026-08-23"), changeFrequency: "weekly", priority: 0.9 },
  ];
}
