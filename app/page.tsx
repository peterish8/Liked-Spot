import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Music, Filter, Zap, Shield } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#191414] text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-[#1DB954]" />
            <span className="text-2xl font-bold">Liked Spot</span>
          </div>
          <Link href="/auth">
            <Button className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold">Connect Spotify</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#1DB954] to-[#1ed760] bg-clip-text text-transparent">
            Transform Your Liked Songs
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Create organized playlists from your Spotify liked songs without touching your original collection. Filter,
            organize, and discover your music in new ways.
          </p>
          <Link href="/auth">
            <Button
              size="lg"
              className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold text-lg px-8 py-4 rounded-full"
            >
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Why Choose Liked Spot?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-[#1DB954] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-white">Safe & Non-Destructive</h3>
              <p className="text-gray-400">
                Your original liked songs collection stays completely untouched. We only create new playlists.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 text-center">
              <Filter className="h-12 w-12 text-[#1DB954] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-white">Advanced Filtering</h3>
              <p className="text-gray-400">
                Filter and create playlists that match your exact vibe.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 text-center">
              <Zap className="h-12 w-12 text-[#1DB954] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-white">Lightning Fast</h3>
              <p className="text-gray-400">
                Process thousands of songs in seconds. Real-time filtering and instant playlist creation.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 bg-gray-900/50">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How It Works</h2>
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center text-black font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Connect Your Spotify</h3>
                <p className="text-gray-400">
                  Securely connect your Spotify account with read-only access to your liked songs.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center text-black font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Filter Your Music</h3>
                <p className="text-gray-400">
                  Use our advanced filters to select exactly which songs you want in your new playlist.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center text-black font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Create New Playlists</h3>
                <p className="text-gray-400">
                  Generate organized playlists that appear directly in your Spotify app, ready to enjoy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2025 Liked Spot. Built with ❤️ for music lovers.</p>
          <p className="mt-2 text-sm">Not affiliated with Spotify AB.</p>
          <p className="mt-2 text-sm">Created by~ Prathick </p>
        </div>
      </footer>
    </div>
  )
}
