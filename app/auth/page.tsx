"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSpotifyLogin = async () => {
    setIsLoading(true)

    const scopes = ["user-library-read", "playlist-modify-public", "playlist-modify-private", "user-read-private"].join(
      " ",
    )

    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "",
      response_type: "code",
      redirect_uri: `${window.location.origin}/callback`,
      scope: scopes,
      state: Math.random().toString(36).substring(7),
    })

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-[#191414] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Music className="h-8 w-8 text-[#1DB954]" />
            <span className="text-2xl font-bold">Liked Spot</span>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Connect to Spotify</CardTitle>
            <CardDescription className="text-gray-400">
              We need access to your liked songs to create organized playlists for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-gray-400">
              <p className="font-medium text-white">We'll request permission to:</p>
              <ul className="space-y-1 ml-4">
                <li>• Read your liked songs (read-only)</li>
                <li>• Create new playlists in your account</li>
                <li>• Access your basic profile info</li>
              </ul>
            </div>

            <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-400">
                <strong>Safe & Secure:</strong> We never modify your original liked songs collection.
              </p>
            </div>

            <Button
              onClick={handleSpotifyLogin}
              disabled={isLoading}
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold"
            >
              {isLoading ? "Connecting..." : "Connect with Spotify"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
