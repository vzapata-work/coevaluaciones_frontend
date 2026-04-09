/** @type {import('next').NextConfig} */
const nextConfig = {
  // El backend corre en Railway en producción
  // En desarrollo apunta a localhost:3001
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  },
}

module.exports = nextConfig
