import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Noto_Sans, Playfair_Display } from "next/font/google";

import { cn } from "~/lib/utils";

const playfairDisplayHeading = Playfair_Display({subsets:['latin'],variable:'--font-heading'});

const notoSans = Noto_Sans({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "COBISS Book Finder",
  description: "Browse books from the COBISS library catalog.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(geist.variable, "font-sans", notoSans.variable, playfairDisplayHeading.variable)}>
      <body>
        {children}
      </body>
    </html>
  );
}
