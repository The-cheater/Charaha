import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TeamMemory - AI-Powered Knowledge Search',
  description: 'Search your team\'s knowledge with AI-powered semantic search across Slack, Google Drive, and all your data sources.',
  keywords: ['knowledge search', 'semantic search', 'team collaboration', 'AI search', 'slack search', 'google drive search'],
  authors: [{ name: 'TeamMemory' }],
  creator: 'TeamMemory',
  publisher: 'TeamMemory',
  robots: 'index, follow',
  openGraph: {
    title: 'TeamMemory - AI-Powered Knowledge Search',
    description: 'Search your team\'s knowledge with AI-powered semantic search',
    type: 'website',
    locale: 'en_US',
    siteName: 'TeamMemory',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TeamMemory - AI-Powered Knowledge Search',
    description: 'Search your team\'s knowledge with AI-powered semantic search',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0F' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body 
        className={`${inter.variable} font-sans antialiased bg-[#0A0A0F] text-white overflow-x-hidden`}
        suppressHydrationWarning
      >
        {/* Gradient Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),rgba(0,0,0,0))]" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        {/* Main Content */}
        <main className="relative z-0">
          {children}
        </main>

        {/* Toast Notifications */}
        <Toaster 
          position="top-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
            },
          }}
        />
      </body>
    </html>
  );
}
