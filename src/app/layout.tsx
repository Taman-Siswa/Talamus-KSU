import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Shell from '@/components/Shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'KSU — Dashboard Persiapan SMA Unggulan',
  description: 'Checklist, kalkulator syarat, timeline, dan katalog untuk persiapan masuk SMA unggulan.',
};

// Same type stack as the Talamus FE: Satoshi for display, Red Hat Text for body, Inter for numbers.
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
// Red Hat Text and Inter are self-hosted too (latin, variable weight), so a build without access to Google Fonts
// does not silently fall back to Arial.
const redhat = localFont({ src: './fonts/RedHatText-Variable.woff2', weight: '300 700', variable: '--font-redhat', display: 'swap', fallback: ['system-ui', 'sans-serif'] });
const inter = localFont({ src: './fonts/Inter-Variable.woff2', weight: '100 900', variable: '--font-inter', display: 'swap', fallback: ['system-ui', 'sans-serif'] });

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
