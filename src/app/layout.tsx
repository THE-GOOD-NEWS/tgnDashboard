import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/style.css";
import React from "react";
import ClientWrapper from "@/components/Wrapper";
import { wifeyFont } from "./lib/fonts";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Wifey For Lifey</title>
      </head>
      <body
        suppressHydrationWarning={true}
        className={`$${wifeyFont.className} bg-creamey  antialiased`}
      >
        <ClientWrapper>{children}</ClientWrapper>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}