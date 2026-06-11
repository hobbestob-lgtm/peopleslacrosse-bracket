import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '🥍 Lacrosse Bracket Predictor — People\'s Lacrosse',
  description: 'Predict Olympic lacrosse brackets, compete with friends, and share your picks. The only lacrosse bracket predictor on the web.',
  keywords: ['lacrosse bracket', 'olympic lacrosse', 'sixes lacrosse', 'bracket predictor', 'LA 2028', 'lacrosse predictions'],
  openGraph: {
    title: '🥍 Lacrosse Bracket Predictor',
    description: 'Predict Olympic lacrosse brackets, compete with friends, and share your picks.',
    url: 'https://bracket.peopleslacrosse.com',
    siteName: 'People\'s Lacrosse',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🥍 Lacrosse Bracket Predictor',
    description: 'Predict Olympic lacrosse brackets, compete with friends, and share your picks.',
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
      <body className="bg-[#0a1628] text-white antialiased">
        {children}
      </body>
    </html>
  );
}