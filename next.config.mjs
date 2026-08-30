/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tyfa2qhumr.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "nos3hy6pzl.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    outputFileTracingIncludes: {
      "/api/workshop-ticket": [
        "./src/assets/fonts/**/*",
        "./public/images/qr/**/*",
      ],
    },
  },
};

export default nextConfig;
