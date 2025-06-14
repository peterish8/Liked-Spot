"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Music, Search, Filter, Plus, LogOut, Headphones } from "lucide-react"
import Image from "next/image"

interface Track {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  added_at: string
  uri: string
}

interface User {
  id: string
  display_name: string
  images: { url: string }[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set())
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false)
  const [playlistName, setPlaylistName] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token")
    if (!token) {
      router.push("/auth")
      return
    }

    fetchUserData(token)
    fetchLikedSongs(token)
  }, [router])

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchLikedSongs = async (token: string) => {
    try {
      setLoading(true)
      const allTracks: Track[] = []
      let url = "https://api.spotify.com/v1/me/tracks?limit=50"

      while (url) {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          allTracks.push(
            ...data.items.map((item: any) => ({
              id: item.track.id,
              name: item.track.name,
              artists: item.track.artists,
              album: item.track.album,
              added_at: item.added_at,
              uri: item.track.uri,
            })),
          )
          url = data.next
        } else {
          break
        }
      }

      setTracks(allTracks)
      setFilteredTracks(allTracks)
    } catch (error) {
      console.error("Error fetching liked songs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    const filtered = tracks.filter(
      (track) =>
        track.name.toLowerCase().includes(query.toLowerCase()) ||
        track.artists.some((artist) => artist.name.toLowerCase().includes(query.toLowerCase())) ||
        track.album.name.toLowerCase().includes(query.toLowerCase()),
    )
    setFilteredTracks(filtered)
  }

  const toggleTrackSelection = (trackId: string) => {
    const newSelected = new Set(selectedTracks)
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId)
    } else {
      newSelected.add(trackId)
    }
    setSelectedTracks(newSelected)
  }

  const selectAllFiltered = () => {
    const allFilteredIds = new Set(filteredTracks.map((track) => track.id))
    setSelectedTracks(allFilteredIds)
  }

  const clearSelection = () => {
    setSelectedTracks(new Set())
  }

  const createPlaylist = async () => {
    if (!playlistName.trim() || selectedTracks.size === 0) return

    setIsCreatingPlaylist(true)
    const token = localStorage.getItem("spotify_access_token")

    try {
      // Create playlist
      const createResponse = await fetch(`https://api.spotify.com/v1/users/${user?.id}/playlists`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playlistName,
          description: `Created with Liked Spot from ${selectedTracks.size} liked songs`,
          public: false,
        }),
      })

      if (createResponse.ok) {
        const playlist = await createResponse.json()

        // Add tracks to playlist
        const selectedTrackUris = tracks.filter((track) => selectedTracks.has(track.id)).map((track) => track.uri)

        // Add tracks in batches of 100
        for (let i = 0; i < selectedTrackUris.length; i += 100) {
          const batch = selectedTrackUris.slice(i, i + 100)
          await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ uris: batch }),
          })
        }

        alert(`Playlist "${playlistName}" created successfully with ${selectedTracks.size} songs!`)
        setPlaylistName("")
        setSelectedTracks(new Set())
      }
    } catch (error) {
      console.error("Error creating playlist:", error)
      alert("Failed to create playlist. Please try again.")
    } finally {
      setIsCreatingPlaylist(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("spotify_access_token")
    localStorage.removeItem("spotify_refresh_token")
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#191414] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading your liked songs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#191414] text-white">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-[#191414] z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-[#1DB954]" />
            <span className="text-2xl font-bold">Liked Spot</span>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                {user.images[0] && (
                  <Image
                    src={user.images[0].url || "/placeholder.svg"}
                    alt={user.display_name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span className="hidden md:inline">{user.display_name}</span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Liked Songs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{tracks.length.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Filtered Songs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{filteredTracks.length.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Selected Songs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#1DB954]">{selectedTracks.size.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search songs, artists, or albums..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700 text-white"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            <Button
              onClick={selectAllFiltered}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              Select All ({filteredTracks.length})
            </Button>

            <Button onClick={clearSelection} variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              Clear
            </Button>
          </div>
        </div>

        {/* Playlist Creation */}
        {selectedTracks.size > 0 && (
          <Card className="bg-[#1DB954]/10 border-[#1DB954]/20 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-white">Playlist Name</label>
                  <Input
                    placeholder="My Awesome Playlist"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <Button
                  onClick={createPlaylist}
                  disabled={!playlistName.trim() || isCreatingPlaylist}
                  className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold"
                >
                  {isCreatingPlaylist ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Playlist ({selectedTracks.size})
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Song List */}
        <div className="grid gap-2">
          {filteredTracks.map((track) => (
            <Card
              key={track.id}
              className={`bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer ${
                selectedTracks.has(track.id) ? "ring-2 ring-[#1DB954]" : ""
              }`}
              onClick={() => toggleTrackSelection(track.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Image
                      src={track.album.images[0]?.url || "/placeholder.svg?height=48&width=48"}
                      alt={track.album.name}
                      width={48}
                      height={48}
                      className="rounded"
                    />
                    {selectedTracks.has(track.id) && (
                      <div className="absolute inset-0 bg-[#1DB954]/80 rounded flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-[#1DB954] rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{track.name}</h3>
                    <p className="text-sm text-gray-400 truncate">
                      {track.artists.map((artist) => artist.name).join(", ")}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{track.album.name}</p>
                  </div>

                  <div className="text-xs text-gray-500">{new Date(track.added_at).toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTracks.length === 0 && (
          <div className="text-center py-12">
            <Headphones className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No songs found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
