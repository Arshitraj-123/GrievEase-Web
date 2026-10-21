export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string;
  navItems: { label: string; href: string }[];
  storeUrls: {
    ios: string;
    android: string;
  };
  socialUrls: {
    twitter: string;
    linkedin: string;
    instagram: string;
  };
  demoVideoUrl: string; // If empty string, shows "Demo coming soon" modal with link to /contact
  contactInbox: string; // Server side email recipient
  appVersion: string | null; // null hides the version pill in hero / download
  pricingCopy: string;
  featureFlags: {
    showImpactStats: boolean;
    showTestimonials: boolean;
    enablePricing: boolean;
    enableChangelog: boolean;
    enableBlog: boolean;
    enableCareers: boolean;
    enablePress: boolean;
    allowAbsoluteHeadline: boolean; // false -> "No complaint gets ignored." (no extra "Ever.")
    showResidentCountClaim: boolean; // false -> hides hardcoded "500+ residents" claims
    trustGuarantees: {
      noCreditCard: boolean;
      freeForResidents: boolean;
      fastSetup: boolean;
    };
  };
}

export const siteConfig: SiteConfig = {
  name: 'GrievEase',
  tagline: 'Smarter Communities, Happier Living',
  description:
    'GrievEase is a modern society grievance management platform that helps residents report issues, track progress and get them resolved faster, easier and more transparently.',
  url: 'https://grievease.in',
  navItems: [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Transparency', href: '/transparency' },
    { label: 'Download', href: '/download' },
    { label: 'FAQ', href: '/faq' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  storeUrls: {
    // Fill in real App Store and Google Play URLs here. Empty string renders disabled "Coming soon" button.
    ios: '',
    android: '',
  },
  socialUrls: {
    // Fill in verified social profile URLs. Empty string hides the icon in footer.
    twitter: 'https://x.com/grievease',
    linkedin: 'https://linkedin.com/company/grievease',
    instagram: 'https://instagram.com/grievease',
  },
  demoVideoUrl: '', // Provide a YouTube / Vimeo embed URL or leave empty for "Demo coming soon"
  contactInbox: process.env.CONTACT_INBOX || 'support@grievease.in',
  appVersion: null, // Set to 'v1.0.0' or keep null to hide unverified version numbers
  pricingCopy:
    'GrievEase is 100% free for all residents and tenants! Housing societies pay a nominal annual society subscription for administrative governance, analytics dashboards, and infrastructure maintenance.',
  featureFlags: {
    showImpactStats: true,
    showTestimonials: true,
    enablePricing: false,
    enableChangelog: false,
    enableBlog: false,
    enableCareers: false,
    enablePress: false,
    allowAbsoluteHeadline: false,
    showResidentCountClaim: false,
    trustGuarantees: {
      noCreditCard: true,
      freeForResidents: true,
      fastSetup: true,
    },
  },
};
