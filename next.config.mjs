import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tạo bản chạy độc lập (.next/standalone) cho Docker image gọn nhẹ
  output: 'standalone',
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
