import type { NextConfig } from "next";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Portadas y galerías de eventos subidas desde el panel (bucket público "eventos").
    remotePatterns: supabase
      ? [
          {
            protocol: "https",
            hostname: supabase.hostname,
            port: "",
            pathname: "/storage/v1/object/public/eventos/**",
            search: "",
          },
        ]
      : [],
  },
};

export default nextConfig;
