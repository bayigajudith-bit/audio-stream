export interface Track {
  id: string
  title: string
  artist: string
  cover: string
  streamUrl?: string
  pageUrl?: string
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// Map Audiomack's raw JSON to our Track type.
// Check field names against the docs/response you receive and adjust here only.
function normalize(r: any): Track {
  return {
    id: String(r.id ?? r.song_id),
    title: r.title,
    artist: r.artist ?? r.uploader?.name ?? 'Unknown',
    cover: r.image ?? r.image_base ?? '',
    streamUrl: r.streaming_url,
    pageUrl: r.url_slug ? `https://audiomack.com${r.url_slug}` : undefined,
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`)
  if (!res.ok) throw new Error(`Audiomack request failed (${res.status})`)
  return res.json()
}

const demo = (): Track[] =>
  Array.from({ length: 8 }, (_, i) => ({
    id: `demo-${i}`,
    title: `Demo Track ${i + 1}`,
    artist: ['Nova', 'Kito', 'Lumen', 'Asha'][i % 4],
    cover: `https://picsum.photos/seed/wave${i}/400`,
    streamUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${i + 1}.mp3`,
  }))

export async function getTrending(genre = ''): Promise<Track[]> {
  if (USE_MOCK) return demo()
  const data = await get<any>(`/music/trending${genre ? `?genre=${genre}` : ''}`)
  return (data.results ?? data).map(normalize)
}

export async function search(q: string): Promise<Track[]> {
  if (USE_MOCK) return demo().filter(t => (t.title + t.artist).toLowerCase().includes(q.toLowerCase()))
  const data = await get<any>(`/search?q=${encodeURIComponent(q)}&show=songs`)
  return (data.results ?? data).map(normalize)
}
