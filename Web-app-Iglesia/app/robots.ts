import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iglesiasmerida.local'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/panel/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
