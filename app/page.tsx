"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Music, Search, Filter, Plus, LogOut, Headphones } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SpotifyLogo from "@/components/ui/SpotifyLogo";

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  added_at: string;
  uri: string;
}

interface User {
  id: string;
  display_name: string;
  images: { url: string }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token");
    if (!token) {
      router.push("/auth");
      return;
    }

    fetchUserData(token);
    fetchLikedSongs(token);
  }, [router]);

  const fetchUserData = async (token: string) => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchLikedSongs = async (token: string) => {
    try {
      setLoading(true);
      const allTracks: Track[] = [];
      let url = "https://api.spotify.com/v1/me/tracks?limit=50";

      while (url) {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          allTracks.push(
            ...data.items.map((item: any) => ({
              id: item.track.id,
              name: item.track.name,
              artists: item.track.artists,
              album: item.track.album,
              added_at: item.added_at,
              uri: item.track.uri,
            }))
          );
          url = data.next;
        } else {
          break;
        }
      }

      setTracks(allTracks);
      setFilteredTracks(allTracks);
    } catch (error) {
      console.error("Error fetching liked songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = tracks.filter(
      (track) =>
        track.name.toLowerCase().includes(query.toLowerCase()) ||
        track.artists.some((artist) =>
          artist.name.toLowerCase().includes(query.toLowerCase())
        ) ||
        track.album.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTracks(filtered);
  };

  const toggleTrackSelection = (trackId: string) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
    } else {
      newSelected.add(trackId);
    }
    setSelectedTracks(newSelected);
  };

  const selectAllFiltered = () => {
    const allFilteredIds = new Set(filteredTracks.map((track) => track.id));
    setSelectedTracks(allFilteredIds);
  };

  const clearSelection = () => {
    setSelectedTracks(new Set());
  };

  const createPlaylist = async () => {
    if (!playlistName.trim() || selectedTracks.size === 0) return;

    setIsCreatingPlaylist(true);
    const token = localStorage.getItem("spotify_access_token");

    try {
      // Create playlist
      const createResponse = await fetch(
        `https://api.spotify.com/v1/users/${user?.id}/playlists`,
        {
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
        }
      );

      if (createResponse.ok) {
        const playlist = await createResponse.json();

        // Add tracks to playlist
        const selectedTrackUris = tracks
          .filter((track) => selectedTracks.has(track.id))
          .map((track) => track.uri);

        // Add tracks in batches of 100
        for (let i = 0; i < selectedTrackUris.length; i += 100) {
          const batch = selectedTrackUris.slice(i, i + 100);
          await fetch(
            `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ uris: batch }),
            }
          );
        }

        alert(
          `Playlist "${playlistName}" created successfully with ${selectedTracks.size} songs!`
        );
        setPlaylistName("");
        setSelectedTracks(new Set());
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert("Failed to create playlist. Please try again.");
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-white/90">Loading your liked songs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Neon Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary moving neon circle */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-[#ff0080]/20 to-[#7928ca]/20 blur-3xl animate-pulse">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ff0080]/10 to-[#7928ca]/10 animate-ping"></div>
        </div>
        
        {/* Secondary moving neon circle */}
        <div className="absolute top-3/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-[#00d4ff]/20 to-[#1DB954]/20 blur-3xl animate-pulse delay-1000">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00d4ff]/10 to-[#1DB954]/10 animate-ping delay-1000"></div>
        </div>
        
        {/* Tertiary moving neon circle */}
        <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-[#ffaa00]/20 to-[#ff6b6b]/20 blur-3xl animate-pulse delay-2000">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ffaa00]/10 to-[#ff6b6b]/10 animate-ping delay-2000"></div>
        </div>
        
        {/* Additional floating elements */}
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-[#1DB954]/10 blur-2xl animate-bounce"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full bg-[#ff0080]/10 blur-2xl animate-bounce delay-500"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-6 border-b border-gray-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#1DB954] rounded-full flex items-center justify-center">
              <Music className="w-4 h-4 text-black" />
            </div>
            <span className="text-2xl font-bold text-white">
              Liked Spot
            </span>
          </div>
          <Link href="/auth">
            <Button className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold px-6 py-2 rounded-full">
              Connect Spotify
            </Button>
          </Link>
        </header>

        <main className="container mx-auto max-w-6xl px-6 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-900/80 border-gray-800/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-300 text-sm font-medium">
                  Total Liked Songs
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <span className="text-3xl font-bold text-[#1DB954]">
                  {tracks.length}
                </span>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/80 border-gray-800/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-300 text-sm font-medium">
                  Filtered Songs
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <span className="text-3xl font-bold text-[#1DB954]">
                  {filteredTracks.length}
                </span>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/80 border-gray-800/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-300 text-sm font-medium">
                  Selected Songs
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <span className="text-3xl font-bold text-white">
                  {selectedTracks.size}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border-gray-700 text-white placeholder:text-gray-400 rounded-lg focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954]"
                placeholder="Search songs, artists, or albums..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={selectAllFiltered}
                className="bg-gray-800 hover:bg-gray-700 text-[#1DB954] border border-gray-700 px-4 py-2 rounded-lg font-medium"
              >
                <Plus className="mr-2 h-4 w-4" /> Select All
              </Button>
              <Button
                onClick={clearSelection}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 px-4 py-2 rounded-lg font-medium"
              >
                Clear Selection
              </Button>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 px-4 py-2 rounded-lg font-medium"
              >
                <Filter className="mr-2 h-4 w-4" /> Filters
              </Button>
            </div>
          </div>

          {/* Song List */}
          <div className="space-y-2">
            {filteredTracks.map((track) => (
              <Card
                key={track.id}
                className={`bg-gray-900/60 border-gray-800/30 hover:bg-gray-800/60 transition-all cursor-pointer backdrop-blur-sm ${
                  selectedTracks.has(track.id) ? "ring-2 ring-[#1DB954]" : ""
                }`}
                onClick={() => toggleTrackSelection(track.id)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  {track.album.images[0]?.url && (
                    <Image
                      src={track.album.images[0].url}
                      alt={track.name}
                      width={48}
                      height={48}
                      className="rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">
                      {track.name}
                    </div>
                    <div className="text-gray-400 truncate text-sm">
                      {track.artists.map((a) => a.name).join(", ")}
                    </div>
                    <div className="text-gray-500 truncate text-xs">
                      {track.album.name}
                    </div>
                  </div>
                  <div className="text-gray-500 text-xs">
                    {new Date(track.added_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTracks.length === 0 && (
            <div className="text-center py-12">
              <Headphones className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                No songs found matching your search.
              </p>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(120deg); }
          66% { transform: translateY(10px) rotate(240deg); }
        }
        
        @keyframes drift {
          0% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(100px) translateY(-50px); }
          50% { transform: translateX(-50px) translateY(-100px); }
          75% { transform: translateX(-100px) translateY(50px); }
          100% { transform: translateX(0px) translateY(0px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-drift {
          animation: drift 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
