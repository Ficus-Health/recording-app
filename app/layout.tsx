import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Audio recorder",
  description: "Record your voice with a single button.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="bg-blue-950 text-white">{children}</body>
    </html>
  );
}
