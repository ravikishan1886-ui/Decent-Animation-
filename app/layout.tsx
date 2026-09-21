import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Decent Animation — Premium Donghua Streaming Platform',
  description: 'A premium Hindi and English Donghua streaming platform featuring Chinese animation, cultivation fantasy, and subscription access.',
  openGraph: {
    title: 'Decent Animation — Premium Donghua Streaming Platform',
    description: 'A premium Hindi and English Donghua streaming platform featuring Chinese animation, cultivation fantasy, and subscription access.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Decent Animation — Premium Donghua Streaming Platform',
    description: 'A premium Hindi and English Donghua streaming platform featuring Chinese animation, cultivation fantasy, and subscription access.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-[#08080b] text-[#f4f4f7] min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
