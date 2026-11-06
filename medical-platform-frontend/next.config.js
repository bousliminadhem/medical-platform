/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy /api/* calls to the Spring Boot backend during development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;

