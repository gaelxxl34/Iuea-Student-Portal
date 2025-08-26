import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Student Application Portal - International University of East Africa",
  description: "Official student application portal for International University of East Africa (IUEA). Submit your applications, track application status, and manage your admission process online.",
  keywords: "IUEA, International University of East Africa, student application, university admission, online application, Uganda university, higher education",
  authors: [{ name: "International University of East Africa" }],
  creator: "International University of East Africa",
  publisher: "International University of East Africa",
  robots: "index, follow",
  icons: {
    icon: "/small logo iuea.png",
    shortcut: "/small logo iuea.png",
    apple: "/small logo iuea.png",
  },
  openGraph: {
    type: "website",
    locale: "en_UG",
    url: "https://applicant.iuea.ac.ug",
    siteName: "IUEA Student Application Portal",
    title: "Student Application Portal - International University of East Africa",
    description: "Apply to International University of East Africa online. Submit applications, track status, and manage your admission process.",
    images: [
      {
        url: "https://applicant.iuea.ac.ug/small%20logo%20iuea.png",
        width: 200,
        height: 200,
        alt: "IUEA Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Student Application Portal - IUEA",
    description: "Apply to International University of East Africa online",
    images: ["https://applicant.iuea.ac.ug/small%20logo%20iuea.png"],
  },
  alternates: {
    canonical: "https://applicant.iuea.ac.ug",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-P6XCP2Z');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-P6XCP2Z"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
