import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://novelfliy.pages.dev'),
  title: 'NovelFliy — Baca Webtoon Trending dari Sumbernya',
  description:
    'NovelFliy — pembaca webtoon: cari judul, lihat detail dan daftar episode, lalu baca langsung dari webtoons.com. Tanpa daftar, tanpa iklan.',
  openGraph: {
    title: 'NovelFliy — Baca Webtoon Trending dari Sumbernya',
    description:
      'NovelFliy — pembaca webtoon: cari judul, lihat detail dan daftar episode, lalu baca langsung dari webtoons.com. Tanpa daftar, tanpa iklan.',
    url: 'https://novelfliy.pages.dev',
    siteName: 'NovelFliy',
    type: 'website',
    images: [
      {
        url: 'https://novelfliy.pages.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NovelFliy — Baca Webtoon Trending dari Sumbernya',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NovelFliy — Baca Webtoon Trending dari Sumbernya',
    description:
      'NovelFliy — pembaca webtoon: cari judul, lihat detail dan daftar episode, lalu baca langsung dari webtoons.com. Tanpa daftar, tanpa iklan.',
    images: ['https://novelfliy.pages.dev/og-image.png'],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NovelFliy',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} dark`}>
      <head>
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="bg-[#0a0a0a] text-white font-space selection:bg-[#ccff00] selection:text-black antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      console.log('SW Registered: ', registration.scope);
    }, function(err) {
      console.log('SW Registration failed: ', err);
    });
  });
}
`,
          }}
        />
      </body>
    </html>
  );
}
