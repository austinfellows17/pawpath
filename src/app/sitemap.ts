import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/app-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppBaseUrl();
  const now = new Date();

  const staticRoutes = [
    "",
    "/find",
    "/for-walkers",
    "/how-it-works",
    "/signup",
    "/login",
    "/legal/terms",
    "/legal/privacy",
    "/legal/disclaimer",
  ];

  return staticRoutes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/find" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/find" ? 0.9 : 0.6,
  }));
}
