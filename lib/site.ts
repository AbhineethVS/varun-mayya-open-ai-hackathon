const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://epfo-resolve.vercel.app";

export const SITE_URL = configuredUrl.replace(/\/$/, "");
