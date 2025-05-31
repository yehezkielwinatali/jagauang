import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JagaUang",
  description: "Track your expenses with our finance platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning={true}>
        <body className={`${inter.className}`}>
          {/* Header */}
          <Header />

          <main className="min-h-screen">{children}</main>

          <Toaster richColors />
          {/* Footer */}
          <footer className="bg-blue-50 py-5">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>&copy; Angelo</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
