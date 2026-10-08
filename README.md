# Music web app

YouTube Music style web app.

- **Layout**: collapsible left navigation drawer (Home, Explore, Library, New playlist, Liked songs, recent playlists, Settings), top bar with search and account menu, bottom tab bar on phones.
- **Pages**: Home, Explore (new releases, charts, moods and genres), Library (playlists, songs, history), Playlist, Settings, Search, Admin.
- **Free music**: tracks from Jamendo (Creative Commons) play straight from the site with an HTML5 audio player.
- **YouTube**: metadata from the YouTube Data API v3, playback with the official IFrame Player. Covers are served through `/api/img/[id]`.
- **Now playing screen** with Up next, Lyrics (free tracks), Related, autoplay and Save to playlist.
- **Auth**: email + password (confirmation, resend, reset) and Google sign-in via Supabase Auth.
- **Analytics + admin**: events go to `public.analytics_events` through `/api/track`; `/admin` reads them with the `admin_stats` RPC. Admins are rows in `public.admins`.

## Stack
Next.js 14 (App Router), Supabase (auth + Postgres with RLS), Vercel.

## Environment variables
See `.env.example`.

## Supabase email templates (recommended)
Confirm signup link: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
Reset password link: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`
