import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import { siteConfig } from '@/config/site';
import { AccessibilityProvider } from '@/components/AccessibilityProvider';
import { InstallPrompt } from '@/components/InstallPrompt';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d9488',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon-192.png',
  },
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'society grievance management',
    'resident complaints',
    'housing society app',
    'auto escalation',
    'apartment management software',
    'society visitor management',
    'tamper evident audit trail',
    'anonymous resident complaints',
    'GrievEase',
  ],
  authors: [{ name: 'GrievEase Team', url: siteConfig.url }],
  creator: 'GrievEase',
  publisher: 'GrievEase',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteConfig.url,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    creator: '@grievease',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLdOrg = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    sameAs: [
      siteConfig.socialUrls.twitter,
      siteConfig.socialUrls.linkedin,
      siteConfig.socialUrls.instagram,
    ].filter(Boolean),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: siteConfig.contactInbox,
      areaServed: 'IN',
      availableLanguage: ['en', 'hi', 'mr'],
    },
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
      </head>
      <body className="antialiased text-[#1A1A2E] bg-white selection:bg-[#00B894]/20 selection:text-[#00846A] min-h-screen flex flex-col">
        {/* Skip to main content link for screen-reader and keyboard accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 z-50 px-4 py-2 bg-[#00B894] text-white font-bold rounded-lg shadow-lg"
        >
          Skip to main content
        </a>

        <AccessibilityProvider>
          {/* Section 1: Navbar */}
          <Navbar />

          {/* Page Content */}
          <main id="main-content" className="flex-1">
            {children}
          </main>

          {/* Section 17: Footer */}
          <Footer />

          {/* Cookie Consent Banner */}
          <CookieConsent />

          {/* PWA Add to Home Screen Prompt */}
          <InstallPrompt />
        </AccessibilityProvider>
      </body>
    </html>
  );
}
