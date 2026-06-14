export interface Song {
  name: string;
  artist: string;
  img: string; // original asset name, eg "img1"
  audio: string; // original asset name, eg "2-Ori Vaari"
  imageUrl: string; // Unsplash fallback or real loaded URL
  streamUrl?: string; // remote high-quality fallback streaming link
  category?: string; // for filtering/organizing
  durationStr?: string; // default duration string, e.g. "3:42"
}

export interface PlayerState {
  currentSongIndex: number;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number; // 0 to 1
  currentTime: number;
  duration: number;
  isRepeatEnabled: 'none' | 'one' | 'all'; // Support different repeat modes (No Repeat, Repeat One, Repeat All)
  isShuffleEnabled: boolean;
}
