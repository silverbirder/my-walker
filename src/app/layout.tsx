import "@/styles/globals.css";

import { Noto_Sans_JP } from "next/font/google";
import { type Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { TRPCReactProvider } from "@/trpc/react";

const baseUrl = process.env.BASE_URL ?? "http://my-walker.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "散歩コース生成",
  description:
    "現在地から出発し、同じ場所に戻ってくる散歩コースをGoogle Mapで案内します",
  robots: {
    index: true,
  },
  icons: [{ rel: "icon", url: "/icon/48" }],
};

const noto = Noto_Sans_JP({
  weight: ["400", "700", "800"],
  style: "normal",
  subsets: ["latin"],
  adjustFontFallback: false,
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={noto.className}>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
        {process.env.GA_ID && <GoogleAnalytics gaId={process.env.GA_ID} />}
      </body>
    </html>
  );
}
