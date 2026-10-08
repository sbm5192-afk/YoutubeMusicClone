export type Song = {
  id: string
  title: string
  artist: string
  thumb: string
  src?: string // direct audio URL (free, licensed tracks). YouTube songs have no src.
  license?: string
}

export type Me = { name: string; email: string; avatar?: string; isAdmin: boolean }
export type Pl = { id: string; name: string }

// YouTube cover, served through our own /api/img route so it also shows where i.ytimg.com is blocked.
export const thumbOf = (id: string) => `/api/img/${id}`
