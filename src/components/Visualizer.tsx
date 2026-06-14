import React, { useEffect, useState } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
}

export default function Visualizer({ isPlaying }: VisualizerProps) {
  const [heights, setHeights] = useState<number[]>(new Array(16).fill(15));

  useEffect(() => {
    if (!isPlaying) {
      setHeights(new Array(16).fill(6));
      return;
    }

    const interval = setInterval(() => {
      setHeights(
        Array.from({ length: 16 }, () => Math.floor(Math.random() * 32) + 6)
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div id="audio-visualizer-container" className="flex items-end justify-center gap-1 h-14 px-4 w-full max-w-xs mx-auto">
      {heights.map((height, idx) => (
        <span
          key={idx}
          id={`vis-bar-${idx}`}
          className="w-1.5 rounded-full bg-gradient-to-t from-blue-500 via-indigo-500 to-purple-500 transition-all duration-150 ease-out shadow-xs"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}
