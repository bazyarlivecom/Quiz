import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import '../styles/globals.css';

const vazirmatn = Vazirmatn({ 
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-vazirmatn',
});

export const metadata: Metadata = {
  title: 'بازی کویز',
  description: 'دانش خود را با بازی کویز ما محک بزنید',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazirmatn.variable} font-sans`}>{children}</body>
    </html>
  );
}

