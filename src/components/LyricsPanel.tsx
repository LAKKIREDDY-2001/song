import React, { useEffect, useRef } from 'react';

interface LyricsPanelProps {
  currentTime: number;
  duration: number;
  songName: string;
}

export default function LyricsPanel({ currentTime, duration, songName }: LyricsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate generic stylish lyrics or ambient text matching the song to keep the interface highly interactive!
  const getLyricsForSong = (name: string) => {
    switch (name) {
      case "2-Ori Vaari":
        return [
          { time: 0, text: "🎵 Ori Vaari... Challa Thera Neney..." },
          { time: 8, text: "A step into the wind, a heartbeat on the road" },
          { time: 18, text: "The path is calling, but the shadows don't let go" },
          { time: 28, text: "Through the storms and stars, we find our anchor" },
          { time: 38, text: "And the waves whisper secrets of home..." },
          { time: 48, text: "Remember the flame that burned in your chest?" },
          { time: 58, text: "You were built for the climb, never the rest" },
          { time: 68, text: "Ori Vaari, feel the rhythm rise again!" }
        ];
      case "Inkem Inkem Inkem Kaavaale":
        return [
          { time: 0, text: "🌸 Inkem Inkem Inkem Kaavaale..." },
          { time: 6, text: "Chalaane dorikindi ninnu chustene..." },
          { time: 14, text: "Every glance of yours is like a summer breeze" },
          { time: 22, text: "Calming all the fires, putting me at ease" },
          { time: 30, text: "Inkem inkem inkem kaavaale, oh my dear?" },
          { time: 42, text: "The melody keeps singing when you are near..." },
          { time: 55, text: "My heart beats in sync with this peaceful tune" }
        ];
      case "Calm Down":
        return [
          { time: 0, text: "✨ Calm Down, let your worries wash away" },
          { time: 10, text: "Sunset golden hours on the quiet bay" },
          { time: 20, text: "Deep breaths in, let your pulse set the pace" },
          { time: 30, text: "There's no hurry, you are in a safe space" },
          { time: 40, text: "Calm Down, the stars are listing to your song..." }
        ];
      default:
        // Procedurally generated cozy lyrics based on timing
        return [
          { time: 0, text: `🌌 Welcoming you to ${name}` },
          { time: 10, text: "Take a breath, adjust your volume, relax..." },
          { time: 25, text: "The instrumental melody floats on air" },
          { time: 45, text: "A journey of sound, of rhythm, and of mind" },
          { time: 70, text: "Every beat tells a story waiting to be heard" },
          { time: 95, text: "Lost in the warm acoustics of the moment..." },
          { time: 120, text: "Connecting heartbeats with procedural chimes." },
          { time: 160, text: "Thank you for listening to this wonderful track!" }
        ];
    }
  };

  const lyrics = getLyricsForSong(songName);
  
  // Find current active lyric line
  const activeLineIndex = lyrics.reduce((acc, lyric, idx) => {
    if (currentTime >= lyric.time) {
      return idx;
    }
    return acc;
  }, 0);

  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeLineIndex]);

  return (
    <div 
      id="lyrics-scroll-container" 
      ref={containerRef}
      className="flex flex-col gap-6 overflow-y-auto px-4 py-8 h-[240px] scrollbar-thin scrollbar-thumb-gray-600/30 text-center"
    >
      {lyrics.map((line, idx) => {
        const isActive = idx === activeLineIndex;
        return (
          <p
            key={idx}
            id={`lyric-line-${idx}`}
            data-active={isActive ? "true" : "false"}
            className={`transition-all duration-500 font-sans text-sm md:text-base leading-relaxed tracking-wider ${
              isActive 
                ? 'text-blue-400 font-bold scale-102 opacity-100 drop-shadow-[0_2px_12px_rgba(59,130,246,0.4)]' 
                : 'text-zinc-400/60 font-normal scale-98 hover:text-zinc-300 hover:opacity-80'
            }`}
          >
            {line.text}
          </p>
        );
      })}
    </div>
  );
}
