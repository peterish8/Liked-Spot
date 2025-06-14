"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Music, Search, Filter, Plus, LogOut, Headphones } from "lucide-react";
import Image from "next/image";

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
      <div className="min-h-screen bg-gradient-to-br from-[#191414] via-[#232526] to-[#1DB954] flex items-center justify-center">
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-10 text-center">
          <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-white/90">Loading your liked songs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#191414] via-[#232526] to-[#1DB954] text-white">
      <header className="flex items-center justify-between px-8 py-6 border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="flex items-center space-x-3">
          <Music className="h-8 w-8 text-[#1DB954] drop-shadow-lg" />
          <span className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1DB954] to-[#1ed760]">
            Liked Spot
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-white/80 font-semibold text-lg">
            {user?.display_name}
          </span>
          <Button
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 text-[#1DB954] font-bold px-4 py-2 rounded-xl shadow-lg backdrop-blur-md border border-white/20 transition-all"
          >
            <LogOut className="mr-2 h-5 w-5" /> Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white/90">
                Total Liked Songs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-4xl font-extrabold text-[#1DB954] drop-shadow-lg">
                {tracks.length}
              </span>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white/90">
                Filtered Songs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-4xl font-extrabold text-[#1DB954] drop-shadow-lg">
                {filteredTracks.length}
              </span>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white/90">
                Selected Songs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-4xl font-extrabold text-[#1DB954] drop-shadow-lg">
                {selectedTracks.size}
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
          <div className="flex-1 w-full">
            <div className="relative">
              <Input
                className="w-full px-6 py-4 rounded-2xl bg-white/20 text-white placeholder:text-white/60 border border-white/20 shadow-lg backdrop-blur-md focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all"
                placeholder="Search songs, artists, or albums..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70" />
            </div>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Button
              onClick={selectAllFiltered}
              className="backdrop-blur-lg bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white font-extrabold px-7 py-4 rounded-2xl shadow-2xl border-2 border-white/30 hover:scale-110 hover:from-green-500 hover:to-green-700 active:scale-95 transition-all duration-200 text-lg tracking-wide animate-pulse"
            >
              <Plus className="mr-2 h-5 w-5 animate-bounce" /> Select All
            </Button>
            <Button
              onClick={clearSelection}
              className="backdrop-blur-lg bg-gradient-to-r from-pink-400 via-red-400 to-red-600 text-white font-extrabold px-7 py-4 rounded-2xl shadow-2xl border-2 border-white/30 hover:scale-110 hover:from-pink-500 hover:to-red-700 active:scale-95 transition-all duration-200 text-lg tracking-wide animate-pulse"
            >
              <Filter className="mr-2 h-5 w-5 animate-spin" /> Clear Selection
            </Button>
            <Button
              onClick={() => setShowFilters((v) => !v)}
              className="backdrop-blur-lg bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 text-white font-extrabold px-7 py-4 rounded-2xl shadow-2xl border-2 border-white/30 hover:scale-110 hover:from-blue-500 hover:to-cyan-700 active:scale-95 transition-all duration-200 text-lg tracking-wide animate-pulse"
            >
              <Filter className="mr-2 h-5 w-5 animate-ping" /> Filters
            </Button>
          </div>
        </div>

        {/* Playlist Creation */}
        {selectedTracks.size > 0 && (
          <Card className="bg-[#1DB954]/10 border-[#1DB954]/20 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-white">
                    Playlist Name
                  </label>
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

        {/* Playlist creation loading overlay */}
        {isCreatingPlaylist && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg">
            <div className="flex flex-col items-center gap-6 p-10 rounded-3xl bg-gradient-to-br from-[#1DB954]/80 via-[#232526]/80 to-[#191414]/90 shadow-2xl border-2 border-white/20">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute w-full h-full rounded-full border-8 border-t-[#1DB954] border-b-[#1ed760] border-l-transparent border-r-transparent animate-spin"></div>
                <Headphones className="w-16 h-16 text-[#1DB954] animate-bounce" />
              </div>
              <div className="text-2xl font-extrabold text-white drop-shadow-lg animate-pulse">
                Creating your playlist...
              </div>
              <div className="text-lg text-white/80">
                Hang tight! Your playlist will be ready in a few seconds.
              </div>
            </div>
          </div>
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
                      src={
                        track.album.images[0]?.url ||
                        "/placeholder.svg?height=48&width=48"
                      }
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
                    <h3 className="font-medium text-white truncate">
                      {track.name}
                    </h3>
                    <p className="text-sm text-gray-400 truncate">
                      {track.artists.map((artist) => artist.name).join(", ")}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {track.album.name}
                    </p>
                  </div>

                  <div className="text-xs text-gray-500">
                    {new Date(track.added_at).toLocaleDateString()}
                  </div>
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
  );
}
