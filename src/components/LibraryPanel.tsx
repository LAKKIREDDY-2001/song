import React, { useState } from 'react';
import { Song } from '../types';
import { Search, Music, FolderOpen, Play, Check, Plus, Trash2 } from 'lucide-react';

interface LibraryPanelProps {
  songs: Song[];
  currentSongIndex: number;
  isPlaying: boolean;
  onSongSelect: (index: number) => void;
  onAddCustomSong: (song: Song) => void;
  onRemoveCustomSong?: (index: number) => void;
}

export default function LibraryPanel({
  songs,
  currentSongIndex,
  isPlaying,
  onSongSelect,
  onAddCustomSong,
  onRemoveCustomSong,
}: LibraryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // State for the custom track addition form
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customStreamUrl, setCustomStreamUrl] = useState('');

  // Extract all unique categories
  const categories = ['All', ...Array.from(new Set(songs.map((s) => s.category || 'Global')))];

  // Filter songs based on search query and category
  const filteredSongs = songs.filter((song) => {
    const matchesSearch =
      song.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory =
      activeCategory === 'All' || (song.category || 'Global') === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const handleAddCustomSongSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customArtist) return;

    const newSong: Song = {
      name: customName,
      artist: customArtist,
      img: 'img_custom',
      audio: customName.replace(/\s+/g, '-'),
      imageUrl: 'https://images.unsplash.com/photo-1481887328591-3e277f9473dc?w=600&auto=format&fit=crop&q=80', // Beautiful generic neon image
      streamUrl: customStreamUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // fallback test track
      category: 'Custom',
      durationStr: '3:00'
    };

    onAddCustomSong(newSong);
    
    // Reset form
    setCustomName('');
    setCustomArtist('');
    setCustomStreamUrl('');
    setShowAddForm(false);
  };

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const objectUrl = URL.createObjectURL(file);
      
      const newSong: Song = {
        name: file.name.replace(/\.[^/.]+$/, ""), // remove extension
        artist: "My Device Audio",
        img: 'img_local',
        audio: file.name,
        imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
        streamUrl: objectUrl, // loaded from browser memory!
        category: 'Local File',
        durationStr: 'Local'
      };

      onAddCustomSong(newSong);
    }
  };

  return (
    <div id="library-panel-root" className="flex flex-col h-full glass-effect rounded-[32px] p-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-zinc-100">
          <BookShelfIcon />
          <h2 className="font-sans font-semibold text-lg tracking-tight">Music Library</h2>
        </div>
        <button
          id="toggle-add-form-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition text-xs font-semibold cursor-pointer"
        >
          <Plus size={14} />
          {showAddForm ? 'Close' : 'Import'}
        </button>
      </div>

      {/* Add track form of client source or local files */}
      {showAddForm && (
        <form
          id="add-custom-song-form"
          onSubmit={handleAddCustomSongSubmit}
          className="mb-4 p-3 bg-zinc-900/80 rounded-xl border border-zinc-800/80 text-xs flex flex-col gap-2.5 transition"
        >
          <div className="flex flex-col gap-1">
            <span className="text-zinc-500 font-mono">Upload Device File:</span>
            <label className="flex items-center gap-2 justify-center py-2 px-3 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg cursor-pointer text-zinc-300 hover:text-white transition">
              <FolderOpen size={14} />
              <span>Select MP3 / WAV...</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleLocalFileSelect}
                className="hidden"
              />
            </label>
          </div>

          <div className="relative flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
            <span className="absolute left-1/2 -translate-x-1/2 bg-zinc-900 px-2 text-[10px] text-zinc-500 font-mono">OR LINK URL</span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-zinc-400">Song Title:</span>
            <input
              type="text"
              required
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. My Favorite Melody"
              className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-zinc-400">Artist Name:</span>
            <input
              type="text"
              required
              value={customArtist}
              onChange={(e) => setCustomArtist(e.target.value)}
              placeholder="e.g. NEFFEX"
              className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-zinc-400">File stream URL (Optional):</span>
            <input
              type="url"
              value={customStreamUrl}
              onChange={(e) => setCustomStreamUrl(e.target.value)}
              placeholder="https://example.com/audio.mp3"
              className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="mt-1 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition overflow-hidden text-center cursor-pointer"
          >
            Add to Playlist Queue
          </button>
        </form>
      )}

      {/* Search Input */}
      <div className="relative mb-3 flex items-center">
        <Search className="absolute left-3 text-zinc-500" size={15} />
        <input
          id="library-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search track or artist..."
          className="w-full pl-9 pr-4 py-2 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
        />
      </div>

      {/* Categories Horizontal scrolling container */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2 scrollbar-none no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`cat-filter-${cat}`}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap transition cursor-pointer ${
              activeCategory === cat
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-zinc-900 text-zinc-450 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Playlist Tracks list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[350px] md:max-h-[500px]">
        {filteredSongs.length > 0 ? (
          filteredSongs.map((song) => {
            // Find real index in parent songs array
            const realIndex = songs.findIndex((s) => s.name === song.name);
            const isCurrent = realIndex === currentSongIndex;

            return (
              <div
                key={realIndex}
                id={`song-item-${realIndex}`}
                onClick={() => onSongSelect(realIndex)}
                className={`flex items-center justify-between p-2 rounded-xl group/item cursor-pointer transition ${
                  isCurrent
                    ? 'bg-gradient-to-r from-blue-500/15 to-blue-500/5 border border-blue-500/20'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={song.imageUrl}
                      alt={song.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition">
                      <Play size={14} className="text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold truncate ${
                        isCurrent ? 'text-blue-400' : 'text-zinc-200'
                      }`}
                    >
                      {song.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-zinc-650">
                    {song.durationStr}
                  </span>
                  {isCurrent && isPlaying ? (
                    <span className="flex gap-0.5 items-end justify-center h-3 w-4">
                      <span className="w-0.5 h-3 bg-blue-400 animate-pulse" />
                      <span className="w-0.5 h-2 bg-blue-400 animate-pulse delay-75" />
                      <span className="w-0.5 h-1.5 bg-blue-400 animate-pulse delay-150" />
                    </span>
                  ) : isCurrent ? (
                    <Check size={12} className="text-blue-400" />
                  ) : null}

                  {/* Custom songs can be deleted */}
                  {song.category === 'Custom' && onRemoveCustomSong && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCustomSong(realIndex);
                      }}
                      className="opacity-0 group-hover/item:opacity-100 p-1 rounded hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Music className="text-zinc-600 mb-2 animate-bounce" size={24} />
            <p className="text-xs text-zinc-400 font-semibold">No songs found</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Try searching again or add custom files.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BookShelfIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-library">
      <path d="m16 6 4 14"/>
      <path d="M12 6v14"/>
      <path d="M8 8v12"/>
      <path d="M4 4v16"/>
    </svg>
  );
}
