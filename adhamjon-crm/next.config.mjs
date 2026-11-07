/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Telegraf faqat serverda ishlaydi — bundle qilinmasin
    serverComponentsExternalPackages: ["telegraf"],
  },
};

export default nextConfig;
