import type { NextConfig } from "next";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Solo con Supabase local (supabase start): permite optimizar imágenes servidas desde 127.0.0.1.
    dangerouslyAllowLocalIP: supabase?.hostname === "127.0.0.1",
    // Portadas de eventos (bucket "eventos") y fotos de perfil de miembros (bucket "perfiles").
    remotePatterns: supabase
      ? ["eventos", "perfiles"].map((bucket) => ({
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
