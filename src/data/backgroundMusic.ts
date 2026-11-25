/**
 * Background music.
 *
 * PLAYLIST
 * - Every audio file in `src/assets/audio/` is picked up automatically at build time
 *   (.mp3 .m4a .aac .ogg .opus .webm .wav .flac). Add or remove files there; nothing else to edit.
 * - ORDER: songs listed in `tracks` below play first, in the order listed. Other files follow in
 *   file-name order. After the last song the playlist starts again from the first.
 *   A single song simply loops.
 * - TITLES: guessed from the file name (`ex-nihilo.mp3` → "Ex Nihilo"). For downloaded files with
 *   messy names, set `title`, `artist` and `credit` in `tracks`. Keys are the exact file names;
 *   case and repeated spaces don't matter. In `npm run dev`, a typo in a key is reported in the console.
 *
 * STARTING
 * - `autoplay: true` means the music is ON for new visitors. It tries to start as soon as the page
 *   opens. Browsers block sound until the visitor interacts with the page.
 * - `entryGate: true` handles that block: a "Begin Trailblaze" entry screen appears, and its click
 *   starts the music as the site opens. It's skipped when sound is already allowed, when there are
 *   no audio files, or when the visitor chose "Enter without sound" before.
 *   With `entryGate: false`, the music starts on the first click, tap or key press anywhere.
 * - `autoplay: false` means OFF until the visitor presses ♪. Visitors' own on/off choice is remembered.
 * - The ♪ button stays hidden on the live site while the folder is empty
 *   (in `npm run dev` it shows dimmed with a hint). `enabled: false` removes the feature completely.
 *
 * ⚠️ Copyright: HOYO-MiX songs are © HoYoverse / COGNOSPHERE; Wuthering Waves music is © Kuro Games.
 * Hosting the files on a public website redistributes them, so make sure you have permission
 * before deploying (check each publisher's fan-content policy), or use tracks you have rights to.
 */

/**
 * 'playlist' = the order described above, then back to the first song.
 * 'shuffle' = random order, reshuffled each round.
 * 'repeat-one' = loop the first song forever.
 */
export type PlaybackMode = 'playlist' | 'shuffle' | 'repeat-one'

export interface TrackInfo {
  title?: string
  artist?: string
  /** Rights holder shown in the footer; defaults to `credit` below. */
  credit?: string
}

export interface BackgroundMusicConfig {
  enabled: boolean
  mode: PlaybackMode
  /** Play order + per-file titles, keyed by file name, e.g. `'ex-nihilo.mp3': { title: 'Ex Nihilo' }`. */
  tracks: Record<string, TrackInfo>
  /** Artist for songs whose file name / `tracks` entry doesn't name one. */
  artist: string
  /** 0–1, the level the music fades up to. Keep it low so it stays "background". */
  volume: number
  /** Default footer credit after the song titles: Background music: “Ex Nihilo” — <credit>. */
  credit: string
  /** true = on by default for new visitors (starts at the first interaction); false = off until ♪ is pressed. */
  autoplay: boolean
  /** true = "Begin Trailblaze" entry screen when the browser blocks sound (see above). */
  entryGate: boolean
  /**
   * true = keep playing when the visitor switches tabs or minimizes the browser. They can still
   * pause or skip from the browser's / phone's media controls. false = pause while the tab is hidden.
   */
  playInBackground: boolean
}

export const backgroundMusic: BackgroundMusicConfig = {
  enabled: true,
  mode: 'playlist',
  tracks: {
    'ex-nihilo.mp3': { title: 'Ex Nihilo', artist: 'HOYO-MiX' },
    'Robin, HOYO-MiX - Hope Is the Thing With Feathers (Official Audio) (From Honkai Star Rail) - NARUMI.mp3': {
      title: 'Hope Is the Thing With Feathers',
      artist: 'Robin · HOYO-MiX',
    },
    'EP If I Can Stop One Heart From Breaking  Honkai Star Rail - Honkai Star Rail.mp3': {
      title: 'If I Can Stop One Heart From Breaking',
      artist: 'Honkai: Star Rail',
    },
    'Honkai Star Rail EP Proi Proi - Honkai Star Rail.mp3': {
      title: 'Proi Proi',
      artist: 'Honkai: Star Rail',
    },
    'Da Capo — Honkai Impact 3rd Theme Song - Honkai Impact 3rd.mp3': {
      title: 'Da Capo',
      artist: 'Honkai Impact 3rd',
    },
    'Honkai Impact 3rd Valkyrie Theme Rubia (Performed by Zhou Shen) - Honkai Impact 3rd - Honkai Impact 3rd.mp3': {
      title: 'Rubia',
      artist: 'Zhou Shen · Honkai Impact 3rd',
    },
    'Honkai Impact 3 - วันที่เธอหายไปกับหมู่ดาว _ Hoshi To Kimi Ga Kieta Hi [Subthai_ซับไทย] - Ellen B. Sensei.mp3': {
      title: 'Hoshi to Kimi ga Kieta Hi',
      artist: 'Honkai Impact 3rd',
    },
    'Aemeath Graduation Theme (Unwavering Startorch) Mix Version  Wuthering Waves - Yuyoiup.mp3': {
      title: 'Aemeath Graduation Theme (Unwavering Startorch)',
      artist: 'Wuthering Waves',
      credit: 'Wuthering Waves © Kuro Games',
    },
    'Tokino Mary (토키노 메리).Stellive 4th  Brave Shine - แปลไม่เก่ง.mp3': {
      title: 'Brave Shine (cover)',
      artist: 'Tokino Mary · Stellive',
      credit: 'Tokino Mary (Stellive) cover, original by Aimer',
    },
    '【토키노 메리 (常乃メリ Tokino Mary)】怪獣の花唄 (Kaiju no Hanauta) _ Vaundy【直播翻唱】 - Vtuber歌切推廣.mp3': {
      title: 'Kaiju no Hanauta (cover)',
      artist: 'Tokino Mary · Stellive',
      credit: 'Tokino Mary (Stellive) cover, original by Vaundy',
    },
    '🎵 【이름을 부를게 (名前を呼ぶよ) - Luck Life】Live cover 토키노 메리 - 음색창고.mp3': {
      title: 'Namae wo Yobu yo (live cover)',
      artist: 'Tokino Mary · Stellive',
      credit: 'Tokino Mary (Stellive) cover, original by Luck Life',
    },
    'MONTAGEM HIKARI [EXTENDED] - INSVNIA.mp3': {
      title: 'Montagem Hikari (Extended)',
      artist: 'INSVNIA',
      credit: 'INSVNIA',
    },
    'MONTAGEM KOE [EXTENDED] - INSVNIA.mp3': {
      title: 'Montagem Koe (Extended)',
      artist: 'INSVNIA',
      credit: 'INSVNIA',
    },
  },
  artist: 'HOYO-MiX',
  volume: 0.35,
  credit: 'HOYO-MiX © HoYoverse',
  autoplay: true,
  entryGate: true,
  playInBackground: true,
}
