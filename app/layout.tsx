import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Liked Spot - Transform Your Spotify Liked Songs",
  description:
    "Create organized playlists from your Spotify liked songs without modifying your original collection. Filter, organize, and discover your music in new ways.",
  keywords: "Spotify, playlist, liked songs, music organization, playlist creator",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
