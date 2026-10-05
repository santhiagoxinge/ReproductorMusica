import { Song } from '../models/Song';

export const SAMPLE_SONGS: Song[] = [
  {
    id: 'song-1',
    title: 'Neon Odyssey',
    artist: 'Aetheric Pulse',
    album: 'Data Horizons',
    duration: 12,
    coverUrl: '/assets/covers/cover_1.png',
    audioUrl: '/assets/audio/song_1.wav'
  },
  {
    id: 'song-2',
    title: 'Binary Sunset',
    artist: 'Cyber Ghost',
    album: 'Linked Nodes Vol. 1',
    duration: 12,
    coverUrl: '/assets/covers/cover_2.png',
    audioUrl: '/assets/audio/song_2.wav'
  },
  {
    id: 'song-3',
    title: 'Quantum Drift',
    artist: 'Matrix Echo',
    album: 'Recursive Memory',
    duration: 12,
    coverUrl: '/assets/covers/cover_3.png',
    audioUrl: '/assets/audio/song_3.wav'
  },
  {
    id: 'song-4',
    title: 'Solar Flare',
    artist: 'Starlight Engine',
    album: 'Infinite Loops',
    duration: 12,
    coverUrl: '/assets/covers/cover_4.png',
    audioUrl: '/assets/audio/song_4.wav'
  }
];
