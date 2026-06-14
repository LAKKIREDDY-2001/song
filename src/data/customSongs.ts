import { Song } from '../types';

/**
 * Add your custom songs to this array!
 * 
 * Your tracks will automatically merge and load into the player playlist queue.
 * Each track should adhere to the following schema:
 * 
 * {
 *   name: "Your Song Title",
 *   artist: "Artist Name",
 *   img: "img_custom",
 *   audio: "my_audio_filename_without_extension", // e.g. "05 - Song" if inside public/music/05 - Song.mp3
 *   imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600", // Unsplash or direct link
 *   streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Optional high-quality streaming URL
 *   category: "Pop", // Genre / Tab filter tag
 *   durationStr: "3:42" // Display duration length
 * }
 */
export const USER_ADDED_SONGS: Song[] = [
  // Paste or write your custom songs below:
  
];
