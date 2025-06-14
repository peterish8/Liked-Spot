"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Music, Search, Filter, Plus, LogOut, Headphones } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

        const selectedTrackUris = tracks
          .filter((track) => selectedTracks.has(track.id))
          .map((track) => track.uri);

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
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-10 text-center">
          <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-white/90">Loading your liked songs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-transparent text-white overflow-x-hidden">
      {/* Neon Animated Background */}
      <div className="fixed inset-0 -z-10">
        <svg
          className="w-full h-full"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="neon1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1DB954" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#191414" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="neon2" cx="80%" cy="20%" r="60%">
              <stop offset="0%" stopColor="#ff0057" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#191414" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="neon3" cx="20%" cy="80%" r="60%">
              <stop offset="0%" stopColor="#00cfff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#191414" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="400" cy="400" r="350" fill="url(#neon1)">
            <animate
              attributeName="r"
              values="350;370;350"
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="650" cy="150" r="200" fill="url(#neon2)">
            <animate
              attributeName="r"
              values="200;220;200"
              dur="8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="200" cy="650" r="180" fill="url(#neon3)">
            <animate
              attributeName="r"
              values="180;200;180"
              dur="7s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
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
          <span className="text-3xl font-extrabold tracking-tight text-white">
            Liked Spot
          </span>
        </div>
        <Link href="/auth">
          <Button className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold px-6 py-3 rounded-full shadow-lg transition-all">
            Connect Spotify
          </Button>
        </Link>
      </header>
      <main className="container mx-auto px-2 sm:px-4 py-10 w-full overflow-x-hidden">
        <div className="flex flex-row gap-4 mb-8">
          <Card className="flex-1 backdrop-blur-lg bg-black/40 border border-white/20 shadow-xl rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/90 uppercase">
                Total Liked Songs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-3xl font-extrabold text-[#1DB954] drop-shadow-lg">
                {tracks.length}
              </span>
            </CardContent>
          </Card>
          <Card className="flex-1 backdrop-blur-lg bg-black/40 border border-white/20 shadow-xl rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/90 uppercase">
                Filtered Songs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-3xl font-extrabold text-[#1DB954] drop-shadow-lg">
                {filteredTracks.length}
              </span>
            </CardContent>
          </Card>
          <Card className="flex-1 backdrop-blur-lg bg-black/40 border border-white/20 shadow-xl rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/90 uppercase">
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
        <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
          <div className="flex-1 w-full">
            <div className="relative">
              <Input
                className="w-full px-6 py-3 rounded-lg bg-black/40 text-white placeholder:text-white/60 border border-white/20 shadow-lg backdrop-blur-md focus:ring-2 focus:ring-[#1DB954] focus:border-[#1DB954] transition-all"
                placeholder="Search songs, artists, or albums..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70" />
            </div>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Button
              onClick={selectAllFiltered}
              className="backdrop-blur-lg bg-black/40 border border-white/20 text-white font-medium px-5 py-2 rounded-lg shadow-xl hover:bg-[#1DB954]/20 transition-all text-sm"
            >
              <Plus className="mr-2 h-4 w-4" /> Select All
            </Button>
            <Button
              onClick={clearSelection}
              className="backdrop-blur-lg bg-black/40 border border-white/20 text-white font-medium px-5 py-2 rounded-lg shadow-xl hover:bg-pink-600/20 transition-all text-sm"
            >
              Clear Selection
            </Button>
            <Button
              onClick={() => setShowFilters((v) => !v)}
              className="backdrop-blur-lg bg-black/40 border border-white/20 text-white font-medium px-5 py-2 rounded-lg shadow-xl hover:bg-cyan-600/20 transition-all text-sm"
            >
              Filters
            </Button>
          </div>
        </div>
        {/* Song List */}
        <div className="grid gap-2 w-full overflow-x-hidden">
          {filteredTracks.map((track) => (
            <Card
              key={track.id}
              className={`backdrop-blur-lg bg-black/40 border border-white/20 shadow-lg rounded-lg hover:bg-white/10 transition-colors cursor-pointer w-full overflow-x-hidden flex items-center ${
                selectedTracks.has(track.id) ? "ring-2 ring-[#1DB954]" : ""
              }`}
              onClick={() => toggleTrackSelection(track.id)}
            >
              <CardContent className="flex items-center gap-4 p-3 w-full">
                {track.album.images[0]?.url && (
                  <Image
                    src={track.album.images[0].url}
                    alt={track.name}
                    width={40}
                    height={40}
                    className="rounded-md object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-base truncate text-white">
                    {track.name}
                  </div>
                  <div className="text-gray-300 truncate text-sm">
                    {track.artists.map((a) => a.name).join(", ")}
                  </div>
                </div>
                <div className="text-gray-400 text-sm min-w-fit ml-2">
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
  );
}
