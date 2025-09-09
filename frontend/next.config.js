/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['images.unsplash.com', 'avatars.githubusercontent.com'],
    },
    experimental: {
      appDir: true,
    },
  }
  
  module.exports = nextConfig
  