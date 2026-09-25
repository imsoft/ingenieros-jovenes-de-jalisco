import type { NextConfig } from "next";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Only with local Supabase (supabase start): allows optimizing images served from 127.0.0.1.
    dangerouslyAllowLocalIP: supabase?.hostname === "127.0.0.1",
    // Event covers and galleries ("events" bucket) and member profile photos ("profiles" bucket).
    remotePatterns: supabase
      ? ["events", "profiles"].map((bucket) => ({
          protocol: supabase.protocol === "http:" ? ("http" as const) : ("https" as const),
          hostname: supabase.hostname,
          port: supabase.port,
          pathname: `/storage/v1/object/public/${bucket}/**`,
          search: "",
        }))
      : [],
  },
};

export default nextConfig;
