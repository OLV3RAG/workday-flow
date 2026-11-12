import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-figtree",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-bricolage",
  display: "swap",
});

const themeBootScript = `(function(){try{var t=localStorage.getItem('tablero-tema');if(t!=='light'&&t!=='dark'&&t!=='system')t='dark';document.documentElement.setAttribute('data-theme',t);var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',dark?'#09090b':'#fafafa');}catch(e){}})();`;

export const metadata: Metadata = {
  title: {
    default: "Mi tablero de trabajo",
    template: "%s · Mi tablero de trabajo",
  },
  description: "Tablero de trabajo en tiempo real. Organiza pendientes, fechas y enfoque.",
  applicationName: "Mi tablero de trabajo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tablero",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${figtree.variable} ${bricolage.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-ink antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
