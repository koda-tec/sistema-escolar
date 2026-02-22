import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ToastProvider } from "@/app/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// METADATA OPTIMIZADA PARA PWA Y APPLE
export const metadata: Metadata = {
  title: "KodaEd - Sistema Escolar",
  description: "Plataforma digital de comunicaciones y gestión académica",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // Hace que la app se vea full screen en iPhone
    title: "KodaEd",
  },
  icons: {
    apple: "/icons/icon-192x192.png", // Icono específico para iPhone
  },
  formatDetection: {
    telephone: false,
  },
};

// VIEWPORT: CRÍTICO PARA EL NOTCH Y ÁREAS SEGURAS
export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // ESTO PERMITE QUE EL COLOR SE META DETRÁS DEL NOTCH
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 1. Toaster de react-hot-toast */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b', // Un gris pizarra más moderno que el #363636
              color: '#fff',
              fontSize: '14px',
              borderRadius: '16px',
              padding: '12px 20px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* 2. Proveedor de Toasts local y contenido de la App */}
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}