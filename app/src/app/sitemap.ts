import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://krasnodar.vidosgroup.ru'

  // Static pages
  const staticPages = [
    '', '/catalog', '/auth/login', '/auth/register', '/contacts', '/about', '/delivery',
  ].map(path => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }))

  // Dynamic: categories, products — would be fetched from DB
  // For now, return static pages
  return staticPages
}
