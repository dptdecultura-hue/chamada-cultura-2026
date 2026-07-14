/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ⚠️ Ignora erros de TypeScript durante o build
    ignoreBuildErrors: true,
  },
  // ⚠️ O ESLint agora é configurado via eslint.config.mjs, não no next.config
}

module.exports = nextConfig
