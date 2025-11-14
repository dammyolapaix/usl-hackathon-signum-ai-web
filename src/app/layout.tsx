import type { Metadata } from "next";
import { Fredoka, Baloo_2 } from "next/font/google";
import "./globals.css";

// Fredoka: Playful, rounded font for headings
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Baloo 2: Fun, friendly font for body text
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sign Language Learning for Kids",
  description:
    "Fun and accessible sign language learning app for children with special needs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fredoka.variable} ${baloo.variable} antialiased font-[family-name:var(--font-baloo)]`}
      >
        {children}
      </body>
    </html>
  );
}
