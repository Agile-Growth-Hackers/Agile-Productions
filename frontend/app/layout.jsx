import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Agile Productions',
  description: 'Speed chasers, storytellers, and visual engineers for the fast lane. Specializing in motorsports coverage, automotive events, and ad films.',
  metadataBase: new URL('https://agileproductions.in'),
  openGraph: {
    type: 'website',
    title: 'Agile Productions',
    description: 'Speed chasers, storytellers, and visual engineers for the fast lane. Specializing in motorsports coverage, automotive events, and ad films.',
    images: [{ url: 'https://r2.agileproductions.in/site-images/social-image.webp' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agile Productions',
    description: 'Speed chasers, storytellers, and visual engineers for the fast lane. Specializing in motorsports coverage, automotive events, and ad films.',
    images: ['https://r2.agileproductions.in/site-images/social-image.webp'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Agile',
  },
  other: {
    'theme-color': '#1f2937',
  },
  icons: {
    icon: 'https://r2.agileproductions.in/logos/site/icon.webp',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://r2.agileproductions.in" />
        <link rel="dns-prefetch" href="https://r2.agileproductions.in" />
        <link rel="preconnect" href="https://agile-productions-api.cool-bonus-e67f.workers.dev" />
        <link rel="dns-prefetch" href="https://agile-productions-api.cool-bonus-e67f.workers.dev" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preload" href="/fonts/Nasi.otf" as="font" type="font/otf" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              "name": "Agile Productions",
              "description": "Speed chasers, storytellers, and visual engineers for the fast lane. Specializing in motorsports coverage, automotive events, and ad films.",
              "url": "https://agileproductions.in",
              "logo": "https://r2.agileproductions.in/logos/site/icon.webp",
              "image": "https://r2.agileproductions.in/site-images/social-image.webp",
              "sameAs": ["https://agileproductions.ae"],
              "address": { "@type": "PostalAddress", "addressCountry": "IN" },
              "serviceType": ["Motorsports Coverage", "Automotive Events", "Ad Films", "Video Production", "Visual Content Creation"],
              "areaServed": [{ "@type": "Country", "name": "India" }, { "@type": "Country", "name": "United Arab Emirates" }],
              "contactPoint": { "@type": "ContactPoint", "contactType": "Customer Service", "url": "https://agilegrowthhackers.com" }
            })
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
