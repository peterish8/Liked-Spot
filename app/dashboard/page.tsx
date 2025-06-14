"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Music, Search, Filter, Plus, LogOut, Headphones } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

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
    setShowLoadingModal(true);
    setLoadingMessage("Extracting song URIs...");

    const token = localStorage.getItem("spotify_access_token");

    try {
      const selectedTrackUris = tracks
        .filter((track) => selectedTracks.has(track.id))
        .map((track) => track.uri);

      setLoadingMessage("Creating playlist...");
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
        setLoadingMessage("Adding songs to playlist...");

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

        setLoadingMessage("Playlist created successfully!");
        setTimeout(() => {
          setPlaylistName("");
          setSelectedTracks(new Set());
          setShowLoadingModal(false);
        }, 2000); // Show success message for 2 seconds
      } else {
        const errorData = await createResponse.json();
        throw new Error(errorData.error.message || "Failed to create playlist");
      }
    } catch (error: any) {
      console.error("Error creating playlist:", error);
      setLoadingMessage(
        `Error: ${error.message || "Failed to create playlist."}`
      );
      setTimeout(() => setShowLoadingModal(false), 3000); // Show error for 3 seconds
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
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="backdrop-blur-lg bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl p-10 text-center">
          <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-[#b3b3b3]">Loading your liked songs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-[#121212] text-white overflow-x-hidden">
      {/* Header with Spotify Logo */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-6 border-b border-white/10 backdrop-blur-md bg-white/5">
        <div className="flex items-center space-x-3">
          <svg
            className="h-8 w-8 text-[#1DB954] drop-shadow-lg"
            viewBox="0 0 168 168"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="84" cy="84" r="84" fill="#191414" />
            <path
              d="M126.6 120.1c-1.6 2.6-5.1 3.4-7.7 1.8-21.1-12.9-47.7-15.8-79.1-8.6-3 0.7-6-1.2-6.7-4.2-0.7-3 1.2-6 4.2-6.7 33.8-7.7 63.1-4.5 86.2 9.6 2.6 1.6 3.4 5.1 1.8 7.7zm10.9-23.2c-2 3.2-6.2 4.2-9.4 2.2-24.2-14.8-61.1-19.1-89.7-10.4-3.5 1-7.1-1-8.1-4.5-1-3.5 1-7.1 4.5-8.1 31.8-9.5 71.1-5 98.2 11.5 3.2 2 4.2 6.2 2.2 9.3zm0.9-24.2c-28.7-17-76.2-18.6-103.2-10.1-4 1.2-8.2-1-9.4-5-1.2-4 1-8.2 5-9.4 30.6-9.2 82.2-7.4 114.6 11.2 3.7 2.2 4.9 7 2.7 10.7-2.2 3.7-7 4.9-10.7 2.6z"
              fill="currentColor"
            />
          </svg>
          <span className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1DB954] to-[#1ed760]">
            Liked Spot
          </span>
        </div>
        {user && user.images[0]?.url && (
          <div className="flex items-center gap-3">
            <Image
              src={user.images[0].url}
              alt={user.display_name}
              width={40}
              height={40}
              className="rounded-full border-2 border-[#1DB954]"
            />
            <Button
              onClick={handleLogout}
              className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold px-4 py-2 rounded-full shadow-lg transition-all"
            >
              Logout
            </Button>
          </div>
        )}
      </header>
      <main className="container mx-auto px-2 sm:px-4 py-10 w-full">
        <div className="flex flex-row gap-4 mb-8">
          <Card className="flex-1 backdrop-blur-lg bg-[#1a1a1a] border border-[#333] shadow-xl rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#b3b3b3] uppercase">
                Total Liked Songs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-3xl font-extrabold text-[#1DB954] drop-shadow-lg">
                {tracks.length}
              </span>
            </CardContent>
          </Card>
          <Card className="flex-1 backdrop-blur-lg bg-[#1a1a1a] border border-[#333] shadow-xl rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#b3b3b3] uppercase">
                Filtered Songs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-3xl font-extrabold text-[#1DB954] drop-shadow-lg">
                {filteredTracks.length}
              </span>
            </CardContent>
          </Card>
          <Card className="flex-1 backdrop-blur-lg bg-[#1a1a1a] border border-[#333] shadow-xl rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#b3b3b3] uppercase">
                Selected Songs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-3xl font-extrabold text-[#1DB954] drop-shadow-lg">
                {selectedTracks.size}
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 w-full">
          <div className="flex-1 w-full">
            <div className="relative">
              <Input
                className="w-full pl-12 pr-6 py-4 rounded-full bg-black/40 text-white placeholder:text-white/60 border border-white/20 shadow-lg backdrop-blur-md focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all"
                placeholder="Search songs, artists, or albums..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4 sm:mt-0">
            <Button
              onClick={selectAllFiltered}
              className="backdrop-blur-lg bg-gradient-to-r from-green-900 via-green-700 to-green-500 text-white font-extrabold px-7 py-3 rounded-full shadow-xl hover:from-green-700 hover:to-green-400 transition-all text-lg tracking-wide w-full sm:w-auto"
            >
              <Plus className="mr-2 h-5 w-5" /> Select All
            </Button>
            <Button
              onClick={clearSelection}
              className="backdrop-blur-lg bg-gradient-to-r from-red-900 via-pink-700 to-pink-500 text-white font-extrabold px-7 py-3 rounded-full shadow-xl hover:from-pink-700 hover:to-pink-400 transition-all text-lg tracking-wide w-full sm:w-auto"
            >
              <Filter className="mr-2 h-5 w-5" /> Clear Selection
            </Button>
            {selectedTracks.size > 0 && (
              <Button
                onClick={() => createPlaylist()}
                disabled={!playlistName.trim() || isCreatingPlaylist}
                className={`px-7 py-3 rounded-full shadow-xl transition-all text-lg tracking-wide w-full sm:w-auto ${
                  !playlistName.trim()
                    ? "bg-gray-800 text-gray-400 border-2 border-purple-500 hover:border-purple-600"
                    : "bg-gradient-to-r from-purple-900 via-purple-700 to-purple-500 text-white hover:from-purple-700 hover:to-purple-400"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isCreatingPlaylist ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Create Playlist
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        {/* Playlist Name Input */}
        {selectedTracks.size > 0 && (
          <div className="mb-6">
            <Input
              className="w-full bg-black/40 text-white placeholder:text-white/60 border border-white/20 rounded-full px-6 py-4 focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all text-lg"
              placeholder="Enter playlist name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
            />
          </div>
        )}
        {/* Song List */}
        <div className="grid gap-2 w-full rounded-xl">
          {filteredTracks.map((track) => (
            <Card
              key={track.id}
              className={`bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer rounded-xl overflow-hidden ${
                selectedTracks.has(track.id)
                  ? "bg-[#1DB954]/40 border-transparent"
                  : "border-gray-800"
              }`}
              onClick={() => toggleTrackSelection(track.id)}
            >
              <CardContent className="flex items-center gap-4 p-3 w-full rounded-xl overflow-hidden">
                {track.album.images[0]?.url && (
                  <Image
                    src={track.album.images[0].url}
                    alt={track.name}
                    width={40}
                    height={40}
                    className="rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-base truncate text-white">
                    {track.name}
                  </div>
                  <div className="text-[#b3b3b3] truncate text-sm">
                    {track.artists.map((a) => a.name).join(", ")}
                  </div>
                </div>
                <div className="text-[#b3b3b3] text-sm min-w-fit ml-2">
                  {new Date(track.added_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {filteredTracks.length === 0 && (
          <div className="text-center py-12">
            <Headphones className="h-12 w-12 text-[#b3b3b3] mx-auto mb-4" />
            <p className="text-[#b3b3b3]">
              No songs found matching your search.
            </p>
          </div>
        )}
      </main>

      {/* Loading Modal */}
      <Dialog open={showLoadingModal} onOpenChange={setShowLoadingModal}>
        <DialogContent className="max-w-xs w-full bg-black/80 border border-white/20 backdrop-blur-lg rounded-2xl p-6 text-center">
          <DialogTitle className="text-white text-xl mb-4">
            Creating Your Playlist
          </DialogTitle>
          <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-[#b3b3b3]">{loadingMessage}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
