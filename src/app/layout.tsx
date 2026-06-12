import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Lacrosse Bracket + Picks — People\'s Lacrosse',
    template: '%s — People\'s Lacrosse Bracket',
  },
  description: 'Predict lacrosse brackets for PLL, WLL, and Olympic Sixes. Pick group rankings, predict knockout winners, compete with friends, and share your bracket.',
  keywords: [
    'lacrosse bracket predictor',
    'PLL bracket',
    'WLL bracket',
    'olympic lacrosse bracket',
    'sixes lacrosse',
    'LA 2028 lacrosse',
    'lacrosse predictions',
    'lacrosse confidence pool',
    'PLL playoff bracket',
    'WLL playoff predictions',
    'lacrosse picks',
    'bracket predictor',
    'lacrosse confidence picks',
    'PLL weekly picks',
    'WLL weekly picks',
    'lacrosse bracket game',
    'lacrosse bracket challenge',
  ],
  openGraph: {
    title: 'Lacrosse Bracket + Picks — People\'s Lacrosse',
    description: 'Predict lacrosse brackets for PLL, WLL, and Olympic Sixes. Compete with friends and share your picks.',
    url: 'https://bracket.peopleslacrosse.com',
    siteName: 'People\'s Lacrosse',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://bracket.peopleslacrosse.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Lacrosse Bracket + Picks — Pick winners, rank confidence, compete with friends',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lacrosse Bracket + Picks — People\'s Lacrosse',
    description: 'Predict lacrosse brackets for PLL, WLL, and Olympic Sixes. Compete with friends and share your picks.',
    images: ['https://bracket.peopleslacrosse.com/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  alternates: {
    canonical: 'https://bracket.peopleslacrosse.com',
  },
};

// ── Structured Data Schemas ──

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "People's Lacrosse",
  "url": "https://peopleslacrosse.com",
  "logo": "https://bracket.peopleslacrosse.com/pl-logo-gold.png",
  "sameAs": [
    "https://twitter.com/peopleslax",
    "https://instagram.com/peopleslacrosse",
    "https://www.tiktok.com/@peopleslacrosse",
  ],
  "description": "People's Lacrosse makes lacrosse accessible to everyone. We design and manufacture lacrosse equipment and build tools for lacrosse fans.",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Lacrosse Bracket + Picks",
  "description": "Predict lacrosse brackets for PLL, WLL, and Olympic Sixes. Compete with friends, share your picks, and track your scores.",
  "url": "https://bracket.peopleslacrosse.com",
  "publisher": {
    "@type": "Organization",
    "name": "People's Lacrosse",
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://bracket.peopleslacrosse.com/?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Lacrosse Bracket + Picks",
  "applicationCategory": "Sports",
  "operatingSystem": "Web",
  "description": "Free lacrosse bracket prediction game. Pick PLL, WLL, and Olympic Sixes bracket winners, join groups, compete with friends, and share your picks.",
  "url": "https://bracket.peopleslacrosse.com",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "author": {
    "@type": "Organization",
    "name": "People's Lacrosse",
    "url": "https://peopleslacrosse.com",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I make lacrosse bracket predictions?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Choose a tournament (PLL, WLL, or Olympic Sixes), pick your game type (Bracket or Confidence), rank the teams in group stage, predict knockout winners, and save your bracket to share with friends.",
      },
    },
    {
      "@type": "Question",
      "name": "What is the confidence pool in lacrosse?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The confidence pool lets you pick weekly game winners and rank your confidence in each pick. Higher confidence picks earn more points when correct. Compete with friends in a group to see who picks best over the season.",
      },
    },
    {
      "@type": "Question",
      "name": "Is the lacrosse bracket predictor free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, the Lacrosse Bracket + Picks tool is completely free. Create brackets for PLL, WLL, and Olympic Sixes, join groups, and compete with friends at no cost.",
      },
    },
    {
      "@type": "Question",
      "name": "What lacrosse leagues can I predict?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can predict brackets for the Premier Lacrosse League (PLL), Women's Lacrosse League (WLL), and Olympic Sixes Lacrosse (LA 2028). Each league has its own bracket format and scoring rules.",
      },
    },
    {
      "@type": "Question",
      "name": "How does bracket scoring work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Bracket scoring awards points for correct predictions: group stage positions, knockout match winners, and medal picks. Upset bonuses add extra points when lower-seeded teams win. Confidence pool scoring weights each pick by your confidence ranking.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "People's Lacrosse",
      "item": "https://peopleslacrosse.com",
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Bracket + Picks",
      "item": "https://bracket.peopleslacrosse.com",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="canonical" href="https://bracket.peopleslacrosse.com" />
        <meta name="theme-color" content="#0a1628" />
        <meta name="category" content="sports" />
        <meta name="application-name" content="Lacrosse Bracket + Picks" />
        <meta name="apple-mobile-web-app-title" content="Bracket + Picks" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      </head>
      <body className="bg-[#0a1628] text-white antialiased">
        {children}
      </body>
    </html>
  );
}