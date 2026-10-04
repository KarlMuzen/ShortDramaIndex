import type { Metadata, Viewport } from 'next';
import { Schibsted_Grotesk } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/src/config/site';

const fontMain = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-main',
  display: 'swap',
});
import { SessionProvider } from '@/src/context/session-context';
import { ThemeProvider } from '@/src/context/theme-context';
import { ToastProvider } from '@/src/components/ui/toast';
import { Header } from '@/src/components/layout/header';
import { Footer } from '@/src/components/layout/footer';
import { ServiceWorkerRegister } from '@/src/components/pwa/ServiceWorkerRegister';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F7F9' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1117' },
  ],
};

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
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: 'default',
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
      className={fontMain.variable}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-[var(--paper)] text-[var(--ink)] antialiased"
      >
        <script
          id="theme-init-script"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <ThemeProvider>
          <SessionProvider>
            <ToastProvider>
              <ServiceWorkerRegister />
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
