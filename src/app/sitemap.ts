import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;

  const routes = [
    '',
    '/features',
    '/how-it-works',
    '/transparency',
    '/society/demo/transparency',
    '/track',
    '/download',
    '/testimonials',
    '/faq',
    '/contact',
    '/privacy',
    '/terms',
    '/cookies',
    '/security',
    '/data-deletion',
    '/login',
    '/join',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route.startsWith('/society') || route === '/features' ? 0.8 : 0.6,
  }));
}
