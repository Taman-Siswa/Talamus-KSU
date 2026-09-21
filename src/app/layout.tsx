import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Inter, Red_Hat_Text } from 'next/font/google';
import Shell from '@/components/Shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'KSU — Dashboard Persiapan SMA Unggulan',
  description: 'Checklist, kalkulator syarat, timeline, dan katalog untuk persiapan masuk SMA unggulan.',
};

// Same type stack as the Talamus FE: Satoshi (self-hosted) for display, Red Hat Text for body, Inter for numbers.
const satoshi = localFont({
  src: [
    { path: './fonts/Satoshi-Regular.otf', weight: '400', style: 'normal' },
    { path: './fonts/Satoshi-Medium.otf', weight: '500', style: 'normal' },
    { path: './fonts/Satoshi-Bold.otf', weight: '700', style: 'normal' },
    { path: './fonts/Satoshi-Black.otf', weight: '900', style: 'normal' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
});
const redhat = Red_Hat_Text({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-redhat', display: 'swap' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap' });

// Applies the theme before first paint so it doesn't flash. Signed-out pages (login, daftar) are always dark;
// signed-in users get their own saved choice.
const themeScript = `try{var a=JSON.parse(localStorage.getItem('tsprep-auth')||'{}'),u=a.state&&a.state.session;if(!u){document.documentElement.dataset.theme='dark'}else{var s=JSON.parse(localStorage.getItem('tsprep-v1:'+u)||'{}');if(s.v===2&&s.dark)document.documentElement.dataset.theme='dark'}}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="id" suppressHydrationWarning className={`${satoshi.variable} ${redhat.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
