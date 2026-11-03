import type { MetadataRoute } from 'next'
import { getChurches, getHeritageObjects, getSaints } from '@/lib/data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://iglesiasmerida.local'
  const churches = await getChurches()
  const [objects, saints] = await Promise.all([getHeritageObjects(), getSaints()])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/archivo`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/patrimonio`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/horarios`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/acerca`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/buscar`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ]

  const churchRoutes: MetadataRoute.Sitemap = churches.flatMap((church) => [
    { url: `${baseUrl}/iglesias/${church.slug}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/iglesias/${church.slug}/historia`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/iglesias/${church.slug}/patrimonio`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/iglesias/${church.slug}/santos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/iglesias/${church.slug}/archivo`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/iglesias/${church.slug}/horarios`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/iglesias/${church.slug}/servicios`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ])

  const churchMap = new Map(churches.map((c) => [c.id, c]))

  const objectRoutes: MetadataRoute.Sitemap = objects
    .filter((o) => churchMap.has(o.churchId))
    .map((o) => ({
      url: `${baseUrl}/iglesias/${churchMap.get(o.churchId)!.slug}/patrimonio/${o.id}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

  const saintRoutes: MetadataRoute.Sitemap = saints
    .filter((s) => churchMap.has(s.churchId))
    .map((s) => ({
      url: `${baseUrl}/iglesias/${churchMap.get(s.churchId)!.slug}/santos/${s.id}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

  return [...staticRoutes, ...churchRoutes, ...objectRoutes, ...saintRoutes]
}
