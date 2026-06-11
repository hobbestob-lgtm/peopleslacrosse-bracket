import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '🥍 Lacrosse Bracket Predictor — People\'s Lacrosse',
  description: 'Predict lacrosse brackets for PLL, WLL, and Olympic Sixes. Compete with friends, share your picks, and track your scores.',
  keywords: ['lacrosse bracket', 'PLL bracket', 'WLL bracket', 'olympic lacrosse', 'sixes lacrosse', 'bracket predictor', 'LA 2028', 'lacrosse predictions', 'confidence pool'],
  openGraph: {
    title: '🥍 Lacrosse Bracket Predictor',
    description: 'Predict lacrosse brackets for PLL, WLL, and Olympic Sixes. Compete with friends and share your picks.',
    url: 'https://bracket.peopleslacrosse.com',
    siteName: 'People\'s Lacrosse',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🥍 Lacrosse Bracket Predictor',
    description: 'Predict lacrosse brackets for PLL, WLL, and Olympic Sixes. Compete with friends and share your picks.',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: 'index, follow',
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
      </head>
      <body className="bg-[#0a1628] text-white antialiased">
        {children}
      </body>
    </html>
  );
}