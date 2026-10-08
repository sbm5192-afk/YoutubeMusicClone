export const GENRES = [
  'Pop', 'Hip Hop', 'Rock', 'Electronic', 'R&B', 'Jazz', 'Classical', 'Lo-fi',
  'Persian', 'Turkish', 'Azerbaijani', 'Arabic', 'K-pop', 'Latin', 'Metal', 'Indie', 'Country', 'Reggae',
]

// Genre label -> Jamendo tag (genres without a tag only appear in the YouTube rows)
export const GENRE_TAGS: Record<string, string> = {
  Pop: 'pop',
  'Hip Hop': 'hiphop',
  Rock: 'rock',
  Electronic: 'electronic',
  'R&B': 'rnb',
  Jazz: 'jazz',
  Classical: 'classical',
  'Lo-fi': 'lofi',
  Metal: 'metal',
  Reggae: 'reggae',
  Country: 'country',
  Indie: 'indie',
  Latin: 'latin',
}

// Moods (like YouTube Music's mood chips) -> search query + tile colors
export const MOODS: { label: string; q: string; from: string; to: string }[] = [
  { label: 'Energize', q: 'energetic', from: '#ff512f', to: '#f09819' },
  { label: 'Feel good', q: 'happy', from: '#f7b733', to: '#fc4a1a' },
  { label: 'Relax', q: 'relax', from: '#43cea2', to: '#185a9d' },
  { label: 'Workout', q: 'workout', from: '#e52d27', to: '#b31217' },
  { label: 'Commute', q: 'road trip', from: '#4568dc', to: '#b06ab3' },
  { label: 'Focus', q: 'focus', from: '#396afc', to: '#2948ff' },
  { label: 'Party', q: 'party', from: '#ee0979', to: '#ff6a00' },
  { label: 'Romance', q: 'romantic', from: '#ff5f6d', to: '#ffc371' },
  { label: 'Sad', q: 'sad', from: '#4b6cb7', to: '#182848' },
  { label: 'Sleep', q: 'sleep', from: '#2c3e50', to: '#4ca1af' },
  { label: 'Chill', q: 'chill', from: '#11998e', to: '#38ef7d' },
  { label: 'Acoustic', q: 'acoustic', from: '#c79081', to: '#dfa579' },
]
