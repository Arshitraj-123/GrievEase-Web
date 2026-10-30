'use client';

import { usePathname } from 'next/navigation';
import { siteConfig } from '@/config/site';

export function HreflangLinks() {
  const pathname = usePathname() || '/';

  // Do not output hreflang on authenticated/internal pages
  if (
    pathname.startsWith('/app') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/guard') ||
    pathname.startsWith('/vendor') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/activate') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/forgot-password')
  ) {
    return null;
  }

  // Determine base canonical path without /hi prefix
  const canonicalPath =
    pathname === '/hi'
      ? '/'
      : pathname.startsWith('/hi/')
        ? pathname.slice(3)
        : pathname;

  const baseUrl = siteConfig.url.replace(/\/$/, '');
  const enHref = `${baseUrl}${canonicalPath}`;
  const hiHref = `${baseUrl}${canonicalPath === '/' ? '/hi' : `/hi${canonicalPath}`}`;

  return (
    <>
      <link rel="alternate" hrefLang="en" href={enHref} />
      <link rel="alternate" hrefLang="hi" href={hiHref} />
      <link rel="alternate" hrefLang="x-default" href={enHref} />
    </>
  );
}

