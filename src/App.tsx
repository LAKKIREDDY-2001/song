/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Volume2, 
  VolumeX, 
  Heart, 
  Maximize2, 
  Sparkles, 
  Headphones, 
  FileAudio,
  Radio,
  BookOpen,
  Compass,
  Repeat,
  Menu,
  X,
  Plus
} from 'lucide-react';
import { Song, PlayerState } from './types';
import { INITIAL_SONGS } from './data/songs';
import { USER_ADDED_SONGS } from './data/customSongs';
import { fallbackSynth } from './utils/audioSynth';
import Visualizer from './components/Visualizer';
import LyricsPanel from './components/LyricsPanel';
import LibraryPanel from './components/LibraryPanel';

export default function App() {
  // Playlist State - initializes with defined songs and user custom-added ones!
  const [songs, setSongs] = useState<Song[]>(() => [...INITIAL_SONGS, ...USER_ADDED_SONGS]);
  
  // Active Song Index (Starts at 1st song)
  const [currentIndex, setCurrentIndex] = useState(0);

  // Playback settings
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(240); // default fallback
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('all');
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  
  // Interactive UI States
  const [heartSongs, setHeartSongs] = useState<Record<number, boolean>>({});
  const [useProceduralSynth, setUseProceduralSynth] = useState(false);
  const [isSidebarOpenInMobile, setIsSidebarOpenInMobile] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'player' | 'library' | 'lyrics'>('player');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSong = songs[currentIndex] || songs[0];

  // Sync heart status
  const toggleHeart = (idx: number) => {
    setHeartSongs(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Switch to specific track
  const handleSongSelect = (idx: number) => {
    setCurrentIndex(idx);
    setIsPlaying(true);
    setIsSidebarOpenInMobile(false);
    setMobileActiveTab('player');
  };

  // Add custom song
  const handleAddCustomSong = (newSong: Song) => {
    setSongs(prev => [...prev, newSong]);
    // Switch to new song immediately
    setCurrentIndex(songs.length);
    setIsPlaying(true);
    setMobileActiveTab('player');
  };

  // Remove custom song
  const handleRemoveCustomSong = (targetIdx: number) => {
    if (songs.length <= 1) return; // Prevent draining the entire list
    
    setSongs(prev => prev.filter((_, idx) => idx !== targetIdx));
    
    // Adjust current playing index if needed
    if (currentIndex >= targetIdx && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Core Audio trigger logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (useProceduralSynth) {
        // Start offline chimes synth
        fallbackSynth.start();
        audio.pause();
      } else {
        // Stop synth, play standard audio element
        fallbackSynth.stop();
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn("Audio tag play prevented. Falling back to synth audio automatically!", err);
            // Auto switch to synthesizer so sound always works in sandbox previews!
            setUseProceduralSynth(true);
          });
        }
      }
    } else {
      audio.pause();
      fallbackSynth.stop();
    }
  }, [isPlaying, currentIndex, useProceduralSynth]);

  // Handle switching audio nodes or synth when song state moves
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset progress tracking
    setCurrentTime(0);
    
    // Load and play
    if (isPlaying) {
      if (useProceduralSynth) {
        fallbackSynth.start();
      } else {
        audio.load();
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn("Autoplay was blocked or failed", err);
          });
        }
      }
    }
  }, [currentIndex]);

  // Audio Event Bindings
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!useProceduralSynth) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleDurationChange = () => {
      if (!useProceduralSynth && audio.duration) {
        setDuration(audio.duration);
      }
    };

    // "Go to next song after completing current song"
    const handleEnded = () => {
      handleNextSong();
    };

    const handleError = () => {
      console.warn("Failed loading target source file: falling back to high fidelity streaming link or custom chimes");
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [currentIndex, repeatMode, shuffleEnabled, songs, useProceduralSynth]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle synthesized music timer simulation
  useEffect(() => {
    let interval: number;
    if (isPlaying && useProceduralSynth) {
      setDuration(240); // Standard simulated duration
      interval = window.setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= 240) {
            handleEndedSynth();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, useProceduralSynth, currentIndex, repeatMode, shuffleEnabled]);

  const handleEndedSynth = () => {
    handleNextSong();
  };

  const handleNextSong = () => {
    if (repeatMode === 'one') {
      // Repeat the exact current song
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        if (isPlaying && !useProceduralSynth) audioRef.current.play();
      }
      return;
    }

    if (shuffleEnabled) {
      // Select random song from playlist
      const randIndex = Math.floor(Math.random() * songs.length);
      setCurrentIndex(randIndex);
    } else {
      // Regular sequential rotation
      if (currentIndex === songs.length - 1) {
        if (repeatMode === 'all') {
          setCurrentIndex(0);
        } else {
          setIsPlaying(false); // Stop playback at queue end
        }
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }
  };

  const handlePrevSong = () => {
    if (currentTime > 5) {
      // Restart current song if elapsed time is > 5s
      setCurrentTime(0);
      if (audioRef.current) audioRef.current.currentTime = 0;
    } else {
      // Go to previous track
      if (currentIndex === 0) {
        setCurrentIndex(songs.length - 1);
      } else {
        setCurrentIndex(prev => prev - 1);
      }
    }
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (!useProceduralSynth && audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Helper formats seconds to MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div id="application-root" className="min-h-screen text-zinc-100 flex flex-col font-sans relative bg-[#050505] selection:bg-blue-400 selection:text-black overflow-x-hidden antialiased">
      
      {/* Background ambient blurring glows that adapt to the active category color tone */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div id="glow-blue" className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-900/25 blur-[120px] rounded-full transition-all duration-1000" />
        <div id="glow-purple" className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-900/25 blur-[120px] rounded-full transition-all duration-1000" />
        <img 
          src={currentSong.imageUrl} 
          alt="" 
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-10 blur-[70px] scale-110 select-none transition-all duration-[1200ms]"
        />
      </div>

      {/* Top compact Navigation Header */}
      <header id="app-top-header" className="relative z-10 w-full border-b border-white/5 bg-zinc-950/60 backdrop-blur-md px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/15">
            <Headphones className="text-white" size={18} />
          </div>
          <div>
            <h1 className="font-sans font-bold text-sm tracking-widest uppercase bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
              VibeStream
            </h1>
            <p className="text-[9px] font-mono text-zinc-500 tracking-wider">PREMIUM OFFLINE FLUID PLAYER</p>
          </div>
        </div>

        {/* Audio Mode Selectors */}
        <div className="flex items-center gap-2">
          {/* Quick theme selector/mode notifier */}
          <button
            id="audio-mode-selector-btn"
            onClick={() => setUseProceduralSynth(!useProceduralSynth)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition ${
              useProceduralSynth 
                ? 'bg-amber-400/10 text-amber-300 border-amber-400/30 shadow-lg shadow-amber-400/5' 
                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
            }`}
            title="Toggle Procedural Synthesizer Fallback"
          >
            {useProceduralSynth ? <Sparkles size={13} className="animate-spin-slow" /> : <Radio size={13} />}
            <span>{useProceduralSynth ? 'Procedural Chimes' : 'Standard Audio'}</span>
          </button>

          {/* Mobile Library toggle trigger */}
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={() => setIsSidebarOpenInMobile(!isSidebarOpenInMobile)}
            className="md:hidden p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition"
          >
            {isSidebarOpenInMobile ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </header>

      {/* Main Container: Fully responsive. Maps the "it need to fit edge to edge for phone also" requirements */}
      <main id="app-main-content" className="flex-1 max-w-[1300px] w-full mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-6 relative z-10 min-h-0">
        
        {/* LEFT COLUMN: Main player screen */}
        <section id="column-active-player" className="flex-1 flex flex-col justify-center items-center min-w-0">
          
          {/* Mobile Navigation Tabs (Shown on phone view ONLY to support edge to edge modular panels) */}
          <div className="md:hidden flex items-center justify-between w-full max-w-sm mb-4 bg-zinc-900/40 p-1 rounded-xl border border-zinc-800/50">
            <button
              id="mobile-tab-player"
              onClick={() => setMobileActiveTab('player')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                mobileActiveTab === 'player' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Player
            </button>
            <button
              id="mobile-tab-library"
              onClick={() => setMobileActiveTab('library')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                mobileActiveTab === 'library' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Library Join
            </button>
            <button
              id="mobile-tab-lyrics"
              onClick={() => setMobileActiveTab('lyrics')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                mobileActiveTab === 'lyrics' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Lyrics
            </button>
          </div>

          <div className="w-full max-w-[420px]">
            {/* If Mobile view is active and different tabs are designated */}
            <div className="w-full">
              
              {/* PANEL 1: Standard interactive player view */}
              <div id="player-view-container" className={`${mobileActiveTab === 'player' ? 'block' : 'hidden md:block'} transition`}>
                <div id="interactive-player-card" className="glass-effect rounded-[40px] p-6 shadow-2xl relative overflow-hidden flex flex-col items-center">
                  
                  {/* Decorative subtle ambient lights */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
                  
                  {/* Image wrapper with refined border shadow and corner rounding */}
                  <div className="relative mt-2 mb-8">
                    <div id="album-artwork-ring" className="album-art-container w-[230px] h-[230px] rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center bg-zinc-950/60 transition duration-500 relative group">
                      <img 
                        src={currentSong.imageUrl} 
                        alt={currentSong.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>

                    <span className="absolute -bottom-1 -right-1 bg-zinc-950 text-zinc-400 hover:text-blue-400 p-2 border border-zinc-800 hover:border-blue-500/30 rounded-full cursor-pointer transition shadow-xl"
                          onClick={() => toggleHeart(currentIndex)}
                    >
                      <Heart size={14} fill={heartSongs[currentIndex] ? '#3b82f6' : 'none'} className={heartSongs[currentIndex] ? 'text-blue-400' : ''} />
                    </span>

                    <span className="absolute -top-1 -left-1 bg-zinc-950 text-blue-400 p-1 px-2.5 border border-zinc-800 rounded-full text-[9px] font-mono tracking-widest">
                      #{currentIndex + 1}
                    </span>
                  </div>

                  {/* Title & Artist & categories info */}
                  <div className="text-center w-full min-h-[70px] mb-4">
                    <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full inline-block">
                      {currentSong.category || 'Global'}
                    </span>
                    <h2 id="current-song-name-label" className="text-xl md:text-2xl font-bold text-zinc-100 truncate mt-2 px-1 max-w-full tracking-tight">
                      {currentSong.name}
                    </h2>
                    <p id="current-song-artist-label" className="text-sm text-blue-400 truncate mt-1 font-semibold opacity-90">
                      {currentSong.artist}
                    </p>
                  </div>

                  {/* Waveform graphic or responsive active Visualizer */}
                  <div className="w-full mb-6 py-1">
                    <Visualizer isPlaying={isPlaying} />
                  </div>

                  {/* Progress Details & Timeline controls */}
                  <div className="w-full mb-6">
                    <div className="flex justify-between items-center text-[10px] font-bold text-white/40 tracking-wider mb-2 px-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>

                    <div className="relative group">
                      <input
                        id="timeline-player-slider"
                        type="range"
                        min="0"
                        max={duration || 100}
                        step="0.1"
                        value={currentTime}
                        onChange={handleTimelineChange}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 focus:outline-none transition"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                            (currentTime / (duration || 1)) * 100
                          }%, rgba(255, 255, 255, 0.1) ${(currentTime / (duration || 1)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
                        }}
                      />
                    </div>
                  </div>

                  {/* Music controls button bar closely matching the design */}
                  <div id="player-controls" className="flex items-center justify-between w-full px-2 max-w-sm mx-auto">
                    {/* Shuffle */}
                    <button
                      id="shuffle-toggle-btn"
                      onClick={() => setShuffleEnabled(!shuffleEnabled)}
                      className={`p-2 rounded-xl transition cursor-pointer hover:bg-white/5 ${
                        shuffleEnabled ? 'text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 'text-white/30 hover:text-white'
                      }`}
                      title={shuffleEnabled ? "Disable Shuffle" : "Enable Shuffle"}
                    >
                      <Shuffle size={16} />
                    </button>

                    {/* skip_previous */}
                    <button
                      id="prev-song-btn"
                      onClick={handlePrevSong}
                      className="text-white/60 hover:text-white p-2.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <SkipBack size={24} />
                    </button>

                    {/* play_pause center wrapper */}
                    <button
                      id="play-pause-btn"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-20 h-20 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    >
                      {isPlaying ? <Pause size={28} fill="#000" /> : <Play size={28} fill="#000" className="translate-x-0.5" />}
                    </button>

                    {/* skip_next */}
                    <button
                      id="next-song-btn"
                      onClick={handleNextSong}
                      className="text-white/60 hover:text-white p-2.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <SkipForward size={24} />
                    </button>

                    {/* repeat modes toggling */}
                    <button
                      id="repeat-toggle-btn"
                      onClick={() => {
                        if (repeatMode === 'none') setRepeatMode('all');
                        else if (repeatMode === 'all') setRepeatMode('one');
                        else setRepeatMode('none');
                      }}
                      className={`p-2 rounded-xl transition flex items-center gap-1 cursor-pointer hover:bg-white/5 ${
                        repeatMode !== 'none' 
                          ? 'text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]' 
                          : 'text-white/30 hover:text-white'
                      }`}
                      title={`Repeat: ${repeatMode}`}
                    >
                      <Repeat size={16} />
                      {repeatMode === 'one' && <span className="text-[8px] font-mono font-bold">1</span>}
                    </button>
                  </div>

                  {/* Lower Volume Slider container */}
                  <div className="w-full mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-3 text-zinc-500">
                    <button
                      id="volume-mute-btn"
                      onClick={() => setIsMuted(!isMuted)}
                      className="hover:text-zinc-300 transition shrink-0 cursor-pointer"
                    >
                      {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>

                    <input
                      id="volume-slider-bar"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        setIsMuted(false);
                      }}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-zinc-300 focus:outline-none transition hover:bg-white/20"
                    />

                    <span className="text-[9px] font-mono shrink-0 w-8 text-right">
                      {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
                    </span>
                  </div>

                </div>
              </div>

              {/* PANEL 2 & PANEL 3: Only displayed as simple screen-swappable panels in small viewport resolutions */}
              <div className={`md:hidden ${mobileActiveTab === 'library' ? 'block' : 'hidden'}`}>
                <LibraryPanel
                  songs={songs}
                  currentSongIndex={currentIndex}
                  isPlaying={isPlaying}
                  onSongSelect={handleSongSelect}
                  onAddCustomSong={handleAddCustomSong}
                  onRemoveCustomSong={handleRemoveCustomSong}
                />
              </div>

              <div className={`md:hidden ${mobileActiveTab === 'lyrics' ? 'block' : 'hidden'}`}>
                <div className="bg-zinc-950/40 border border-zinc-800/50 backdrop-blur-md rounded-3xl p-4 shadow-xl">
                  <div className="border-b border-zinc-900 pb-2 mb-3">
                    <span className="text-xs font-semibold text-zinc-400 flex items-center gap-2">
                      <BookOpen size={14} />
                      Lyrics Reader
                    </span>
                  </div>
                  <LyricsPanel 
                    currentTime={currentTime} 
                    duration={duration} 
                    songName={currentSong.name} 
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Desktop Dashboard items (Lyrics and Library side panels) */}
        <section id="column-desktop-panels" className="hidden md:flex md:w-[420px] shrink-0 flex-col gap-6">
          
          {/* Active Lyrics Sync tracker */}
          <div id="desktop-lyrics-container" className="glass-effect rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-2">
                <BookOpen size={13} className="text-blue-400" />
                Live Sync Lyrics
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                Auto Scroll Active
              </span>
            </div>
            
            <div className="bg-zinc-950/40 rounded-xl border border-white/5 overflow-hidden">
              <LyricsPanel 
                currentTime={currentTime} 
                duration={duration} 
                songName={currentSong.name} 
              />
            </div>
          </div>

          {/* Core Playlist Library tracker */}
          <div className="flex-1 min-h-0">
            <LibraryPanel
              songs={songs}
              currentSongIndex={currentIndex}
              isPlaying={isPlaying}
              onSongSelect={handleSongSelect}
              onAddCustomSong={handleAddCustomSong}
              onRemoveCustomSong={handleRemoveCustomSong}
            />
          </div>

        </section>

      </main>

      {/* Hidden background play element for real audio streaming support */}
      <audio
        ref={audioRef}
        id="main-source-audio-handler"
        src={currentSong.streamUrl || `music/${currentSong.audio}.mp3`}
        preload="auto"
      />

      {/* Drawer Drawer overlay sidebar for full playlist exploration on mobile */}
      {isSidebarOpenInMobile && (
        <div id="mobile-sidebar-backdrop" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden flex justify-end">
          <div className="w-[85%] max-w-[320px] h-full bg-zinc-950 p-4 border-l border-zinc-900 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-900">
              <span className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                <Compass size={16} />
                Explore Library
              </span>
              <button 
                id="close-mobile-sidebar-btn"
                onClick={() => setIsSidebarOpenInMobile(false)}
                className="p-1 text-zinc-400 hover:text-zinc-100 bg-zinc-900 rounded-lg"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <LibraryPanel
                songs={songs}
                currentSongIndex={currentIndex}
                isPlaying={isPlaying}
                onSongSelect={handleSongSelect}
                onAddCustomSong={handleAddCustomSong}
                onRemoveCustomSong={handleRemoveCustomSong}
              />
            </div>
          </div>
        </div>
      )}

      {/* Small informative status bar footer */}
      <footer className="relative z-10 w-full text-center py-4 bg-zinc-950/20 border-t border-zinc-950/60 flex items-center justify-center">
        <p className="text-[10px] text-zinc-600 font-mono tracking-wider flex items-center gap-1.5 justify-center">
          <span>Active Deck: {useProceduralSynth ? 'Synth Engine' : 'Audio Streaming Channel'}</span>
          <span>•</span>
          <span>VibeStream Core OS v2.4</span>
        </p>
      </footer>
      
    </div>
  );
}
