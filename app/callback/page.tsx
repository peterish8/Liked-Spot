"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Music } from "lucide-react"

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Processing...")

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      const error = searchParams.get("error")

      if (error) {
        setStatus("Authentication failed. Please try again.")
        setTimeout(() => router.push("/auth"), 3000)
        return
      }

      if (!code) {
        setStatus("No authorization code received.")
        setTimeout(() => router.push("/auth"), 3000)
        return
      }

      try {
        setStatus("Exchanging authorization code...")

        const response = await fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        })

        if (response.ok) {
          const data = await response.json()
          localStorage.setItem("spotify_access_token", data.access_token)
          localStorage.setItem("spotify_refresh_token", data.refresh_token)

          setStatus("Success! Redirecting to dashboard...")
          setTimeout(() => router.push("/dashboard"), 1000)
        } else {
          throw new Error("Failed to exchange code for tokens")
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        setStatus("Authentication failed. Please try again.")
        setTimeout(() => router.push("/auth"), 3000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-[#191414] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Music className="h-8 w-8 text-[#1DB954] animate-pulse" />
          <span className="text-2xl font-bold">Liked Spot</span>
        </div>
        <div className="space-y-4">
          <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg">{status}</p>
        </div>
      </div>
    </div>
  )
}
