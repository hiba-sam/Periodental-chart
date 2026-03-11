import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Periodontal Chart API",
  description: "API for periodontal charting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}
