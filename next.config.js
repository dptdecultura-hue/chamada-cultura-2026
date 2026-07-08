/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ Ignora erros de TypeScript durante o build
    // Isso é necessário porque o arquivo usa JavaScript puro
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ Ignora erros de ESLint durante o build
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
