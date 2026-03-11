import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Control Hub",
  description: "Hub de control de gestión",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
