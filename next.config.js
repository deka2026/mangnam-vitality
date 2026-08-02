/** @type {import('next').NextConfig} */
// STATIC_EXPORT=1 → GitHub Pages용 정적 홍보판 (scripts/build-static.sh 참고)
const isStatic = process.env.STATIC_EXPORT === "1";

const nextConfig = isStatic
  ? {
      output: "export",
      basePath: "/mangnam-vitality",
      trailingSlash: true,
      images: { unoptimized: true },
      experimental: {
        serverComponentsExternalPackages: ["better-sqlite3"],
      },
    }
  : {
      output: "standalone",
      experimental: {
        serverComponentsExternalPackages: ["better-sqlite3"],
      },
    };

module.exports = nextConfig;
