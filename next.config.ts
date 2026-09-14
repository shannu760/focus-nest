import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  async redirects() {
    return [
      {
        source: "/auth/login",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/auth/signup",
        destination: "/signup",
        permanent: false,
      },
      {
        source: "/auth/register",
        destination: "/signup",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
