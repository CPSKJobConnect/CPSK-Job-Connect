import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/SessionProvider";
import { Toaster } from "@/components/ui/sonner";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import ClientLayout from "./ClientLayout";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "CPSK-Job-Connect",
  description: "Connect CPSK talents with opportunities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-poppins antialiased`}>
        <MantineProvider>
          <Toaster richColors closeButton position="top-right" />
          <AuthProvider>
            <ClientLayout>{children}</ClientLayout>
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
