/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // docx/exceljs/pdf-lib run only in Route Handlers (Node runtime), never in the client bundle.
    serverComponentsExternalPackages: ["docx", "exceljs", "pdf-lib", "bcryptjs", "pdf-parse"],
  },
};

export default nextConfig;
