import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/:path*",
        destination: `http://localhost:${process.env.BACKEND_PORT}/:path*`,
      },
    ];
  },
};

export default nextConfig;
