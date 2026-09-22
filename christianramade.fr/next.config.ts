import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "christianramade.s3.eu-north-1.amazonaws.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.eu-north-1.amazonaws.com",
        pathname: "/uploads/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
    // Next 16 : limite par défaut 10 Mo pour la mise en mémoire du corps de
    // requête au niveau du proxy interne. Sans ça, les gros uploads peuvent
    // être tronqués avant d'atteindre la server action.
    proxyClientMaxBodySize: "200mb",
  },
};

export default nextConfig;
