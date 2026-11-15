import "~/styles/globals.css";

import { type Metadata } from "next";
import { ThemeProvider } from "next-themes";
import {
  Figtree,
  Geist,
  Noto_Sans,
  Playfair_Display,
  Space_Grotesk,
} from "next/font/google";

import { cn } from "~/lib/utils";

const font = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "COBISS Book Finder",
  description: "Browse books from the COBISS library catalog.",
  icons: [
    {
      rel: "icon",
      url: "/favicon.ico",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(font.variable)}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <main className="flex min-h-dvh w-full flex-col">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
