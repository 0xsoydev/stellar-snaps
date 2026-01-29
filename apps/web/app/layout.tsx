import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});
const bricolageGrotesque = localFont({
  src: "./fonts/BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf",
  variable: "--font-bricolage",
});
const interItalic = localFont({
  src: "./fonts/Inter-Italic-VariableFont_opsz,wght.ttf",
  variable: "--font-inter-italic",
});

export const metadata: Metadata = {
  title: "Stellar Snaps",
  description: "Shareable payments on the Stellar Network",
  icons: {
    icon: "/stellardark.png",
    apple: "/stellar.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${bricolageGrotesque.variable} ${interItalic.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
