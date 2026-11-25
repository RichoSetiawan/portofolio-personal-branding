/**
 * Background music.
 *
 * - `autoplay: true` (default) means the music is ON for new visitors. It tries to start as soon as
 *   the page opens. Most browsers block sound until the visitor interacts, so in practice it
 *   starts on their first click, tap or key press anywhere on the page. Scrolling alone doesn't count.
 *   Visitors can switch it off with the ♪ button, and that choice is remembered.
 * - `autoplay: false` means OFF until the visitor presses ♪.
 * - Put the audio file in `public/audio/` and point `src` at it.
 *   The ♪ button stays hidden on the live site until that file exists.
 *   In `npm run dev` it shows dimmed with a hint instead.
 * - Set `src: ''` to remove the feature completely.
 *
 * ⚠️ Copyright: "Ex Nihilo" by HOYO-MiX is © HoYoverse / COGNOSPHERE. Hosting the track on a
 * public website redistributes it, so make sure you have permission before deploying.
 * See HoYoverse's fan-content policy, or use a track you have rights to.
 */
export interface BackgroundMusicConfig {
  /** Path under /public (e.g. '/audio/ex-nihilo.mp3') or a full URL you're allowed to stream. */
  src: string
  title: string
  artist: string
  /** 0–1, the level the music fades up to. Keep it low so it stays "background". */
  volume: number
  /** Shown in the footer credits when the track is available. */
  credit: string
  /** true = on by default for new visitors (starts at the first interaction); false = off until ♪ is pressed. */
  autoplay: boolean
}

export const backgroundMusic: BackgroundMusicConfig = {
  src: '/audio/ex-nihilo.mp3',
  title: 'Ex Nihilo',
  artist: 'HOYO-MiX',
  volume: 0.35,
  autoplay: true,
  credit: '“Ex Nihilo” — HOYO-MiX © HoYoverse',
}
