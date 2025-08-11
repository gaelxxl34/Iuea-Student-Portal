import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Student Application Portal - International University of East Africa",
  description: "Official student application portal for International University of East Africa (IUEA). Submit your applications, track application status, and manage your admission process online.",
  keywords: "IUEA, International University of East Africa, student application, university admission, online application, Uganda university, higher education",
  authors: [{ name: "International University of East Africa" }],
  creator: "International University of East Africa",
  publisher: "International University of East Africa",
  robots: "index, follow",
  viewport: "width=device-width, initial-scale=1",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
