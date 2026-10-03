import type { Metadata } from 'next';
import {
  Schibsted_Grotesk,
  Noto_Sans_SC,
  Noto_Sans_JP,
  Noto_Sans_KR,
} from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/src/config/site';
import { SessionProvider } from '@/src/context/session-context';
import { ThemeProvider } from '@/src/context/theme-context';
import { ToastProvider } from '@/src/components/ui/toast';
import { Header } from '@/src/components/layout/header';
import { Footer } from '@/src/components/layout/footer';

const mainFont = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-main',
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  preload: false,
  variable: '--font-cjk-sc',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  preload: false,
  variable: '--font-cjk-jp',
});

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  preload: false,
  variable: '--font-cjk-kr',
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.baseUrl),
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.baseUrl,
    siteName: siteConfig.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

// Inline script to prevent theme flash (FOUC)
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('sdi_theme');
    var isDark = false;
    if (stored === 'dark') {
      isDark = true;
    } else if (stored === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${mainFont.variable} ${notoSansSC.variable} ${notoSansJP.variable} ${notoSansKR.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-[var(--paper)] text-[var(--ink)] antialiased">
        <script
          id="theme-init-script"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <ThemeProvider>
          <SessionProvider>
            <ToastProvider>
              <Header />
              <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {children}
              </main>
              <Footer />
            </ToastProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
