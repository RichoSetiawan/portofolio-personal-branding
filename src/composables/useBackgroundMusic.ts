import { computed, readonly, ref, watch } from 'vue'
import { backgroundMusic } from '@/data/backgroundMusic'

/**
 * App-wide background music (singleton — survives route changes).
 *
 *  • Playlist = every audio file in src/assets/audio/ (collected at build time).
 *    Plays in file-name order (or shuffled), then starts over. A single song just loops.
 *  • With `autoplay: true`, music is ON for a visitor until they switch it off with ♪.
 *    It tries to start when the page opens. Browsers usually block sound before any
 *    interaction, so it then starts on the first click/tap/key press anywhere.
 *  • With `entryGate: true`, a "tap to begin" screen covers the site whenever the browser blocks
 *    that first attempt. Its click is the gesture that unlocks sound, so the music starts as the site opens.
 *  • Remembers the visitor's own choice ('on' / 'off') over the default.
 *  • Fades through a Web Audio GainNode, since iOS Safari ignores `audio.volume`.
 *  • Pauses while the tab is hidden; `preload="none"`, so nothing downloads until it actually plays.
 *  • Hides itself when the folder is empty (dev shows a dimmed button + hint instead).
 *  • OS media keys / lock-screen controls: play, pause, next, previous.
 */

export interface Track {
  file: string
  url: string
  title: string
  artist: string
  credit: string
}

const STORAGE_KEY = 'rs-archive:music'
const FADE_IN = 1.8
const FADE_OUT = 0.6
/** Events that count as a "user activation" for sound. Touch only unlocks on finger-up (pointerup/touchend). */
const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'keydown'] as const

/* ---------- playlist (built at compile time from the folder) ---------- */
const files = import.meta.glob<string>('@/assets/audio/*.{mp3,m4a,aac,ogg,oga,opus,webm,wav,flac}', {
  eager: true,
  query: '?url',
  import: 'default',
})

/**
 * Fallback title for songs not listed in the config's `tracks`: the file name, tidied up.
 * It doesn't guess the artist, since downloaded names mix "Artist - Title" and "Title - Uploader".
 *  "01-ex-nihilo.mp3" → "Ex Nihilo"
 *  "Song Name (Official Audio) - Channel.mp3" → "Song Name - Channel"
 */
function titleFromFile(file: string): string {
  const name = file
    .replace(/\.[^.]+$/, '')
    .replace(/^\d+\s*[-_.]\s*/, '')
    .replace(/\s*[([][^)\]]*\b(official|audio|video|lyrics?|from|hd|4k|mv|ost)\b[^)\]]*[)\]]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  // keep names that are already cased; prettify plain lowercase slugs
  return /\p{Lu}/u.test(name)
    ? name
    : name.replace(/[-_]+/g, ' ').replace(/(^|\s)(\p{L})/gu, (_, sp: string, c: string) => sp + c.toUpperCase())
}

/** Config keys are matched loosely (case, repeated spaces and Unicode form don't matter). */
const norm = (s: string) => s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim()
const configured = Object.entries(backgroundMusic.tracks).map(([file, info], rank) => ({ key: norm(file), info, rank }))
const byName = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

const tracks: Track[] = Object.keys(files)
  .map((path) => {
    const file = path.slice(path.lastIndexOf('/') + 1)
    const entry = configured.find((c) => c.key === norm(file))
    const info = entry?.info ?? {}
    const track: Track = {
      file,
      url: files[path],
      title: info.title ?? titleFromFile(file),
      artist: info.artist ?? backgroundMusic.artist,
      credit: info.credit ?? backgroundMusic.credit,
    }
    return { track, rank: entry?.rank ?? Number.POSITIVE_INFINITY }
  })
  // songs listed in the config's `tracks` play first, in that order; the rest follow by file name
  .sort((a, b) => a.rank - b.rank || byName(a.track.file, b.track.file))
  .map((x) => x.track)

if (import.meta.env.DEV) {
  for (const c of configured) {
    if (!tracks.some((t) => norm(t.file) === c.key)) {
      console.warn(`[music] backgroundMusic.tracks lists "${c.key}", but there's no such file in src/assets/audio/.`)
    }
  }
}

const shuffle = backgroundMusic.mode === 'shuffle'
const loopOne = backgroundMusic.mode === 'repeat-one' || tracks.length === 1

/** Play order as indices into `tracks`; reshuffled every round in shuffle mode. */
function makeOrder(avoidFirst = -1): number[] {
  const order = tracks.map((_, i) => i)
  if (!shuffle) return order
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  // don't play the same song twice in a row across rounds
  if (order.length > 1 && order[0] === avoidFirst) [order[0], order[1]] = [order[1], order[0]]
  return order
}

let order = makeOrder()
let pos = 0
const currentIndex = ref(order[0] ?? 0)
const current = computed<Track | null>(() => tracks[currentIndex.value] ?? null)

/* ---------- state ---------- */
const enabled = backgroundMusic.enabled && tracks.length > 0
const available = ref(enabled)
const devMissing = ref(backgroundMusic.enabled && tracks.length === 0 && import.meta.env.DEV)
const playing = ref(false)
const loading = ref(false)

/** 'checking' until we know whether the entry gate is needed; 'open' while it's shown. */
const gate = ref<'checking' | 'open' | 'closed'>(gateMayBeNeeded() ? 'checking' : 'closed')

let audio: HTMLAudioElement | null = null
let ctx: AudioContext | null = null
let gain: GainNode | null = null
let pauseTimer = 0
let resumeWhenVisible = false
let listening = false
let initialised = false
let failures = 0

function readPref(): 'on' | 'off' | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return v === 'on' || v === 'off' ? v : null
  } catch {
    return null
  }
}
function writePref(on: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    /* storage blocked */
  }
}
/** The visitor's own choice wins; otherwise the site default from the config. */
function wantsMusic(): boolean {
  const pref = readPref()
  return pref === null ? backgroundMusic.autoplay : pref === 'on'
}

function gateMayBeNeeded(): boolean {
  return typeof window !== 'undefined' && enabled && backgroundMusic.entryGate && wantsMusic()
}

function ensureAudio(): HTMLAudioElement {
  if (audio) return audio
  audio = new Audio()
  audio.src = current.value!.url
  audio.loop = loopOne
  audio.preload = 'none'
  audio.addEventListener('waiting', () => (loading.value = true))
  audio.addEventListener('playing', () => {
    loading.value = false
    failures = 0
  })
  audio.addEventListener('ended', () => void skip(1)) // never fires while looping a single song
  audio.addEventListener('error', () => {
    // a broken / unsupported file: try the next song, give up when every song failed
    failures++
    if (failures < tracks.length && !loopOne) {
      void skip(1)
      return
    }
    available.value = false
    playing.value = false
    loading.value = false
    removeGestureListeners()
  })
  return audio
}

/** Route the element through a GainNode so fades work everywhere (incl. iOS). */
function ensureGraph(el: HTMLAudioElement) {
  if (ctx) return
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  try {
    ctx = new AC()
    gain = ctx.createGain()
    gain.gain.value = 0
    ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination)
    el.volume = 1 // the gain node does the fading from here on
  } catch {
    ctx = null
    gain = null
  }
}

function fadeTo(target: number, seconds: number) {
  if (ctx && gain) {
    const now = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(target, now + seconds)
  } else if (audio) {
    audio.volume = target // no-fade fallback
  }
}

/** Resolve after `ms` at the latest; some browsers leave AudioContext.resume() pending while blocked. */
const settle = (p: Promise<unknown> | undefined, ms: number) =>
  Promise.race([p, new Promise((r) => window.setTimeout(r, ms))])

function setMediaSession() {
  if (!('mediaSession' in navigator) || !current.value) return
  const ms = navigator.mediaSession
  ms.metadata = new MediaMetadata({
    title: current.value.title,
    artist: current.value.artist,
    album: 'Richo Setiawan · Trailblaze Archive',
  })
  const handlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
    ['play', () => void play()],
    ['pause', () => pause()],
    ['nexttrack', tracks.length > 1 ? () => void skip(1) : null],
    ['previoustrack', tracks.length > 1 ? () => void skip(-1) : null],
  ]
  for (const [action, handler] of handlers) {
    try {
      ms.setActionHandler(action, handler)
    } catch {
      /* unsupported action */
    }
  }
}

/**
 * Move through the playlist. Called when a song ends, a file fails, or from media keys.
 * Keeps playing if it was playing; the element is already unlocked, so no new gesture is needed.
 */
async function skip(step: 1 | -1) {
  if (!audio || tracks.length === 0) return
  // "previous" a few seconds into a song restarts it, like every music player
  if (step === -1 && audio.currentTime > 3) {
    audio.currentTime = 0
    return
  }
  pos += step
  if (pos >= order.length) {
    order = makeOrder(order[order.length - 1])
    pos = 0
  } else if (pos < 0) {
    pos = order.length - 1
  }
  currentIndex.value = order[pos]
  audio.src = current.value!.url
  if (!playing.value) return
  try {
    await audio.play()
    setMediaSession()
  } catch {
    playing.value = false
    loading.value = false
  }
}

/**
 * Try to start playback. Resolves `false` when the browser still blocks sound.
 * `inGesture`: called from inside a click/tap/key handler.
 */
async function start(inGesture: boolean): Promise<boolean> {
  if (!available.value) return false
  if (playing.value) return true
  const el = ensureAudio()
  window.clearTimeout(pauseTimer)
  loading.value = true
  try {
    if (inGesture) {
      // Kick everything off synchronously inside the gesture; iOS Safari is strict about that.
      ensureGraph(el)
      if (!gain) el.volume = 0
      const resumed = ctx?.state === 'suspended' ? ctx.resume() : undefined
      await el.play()
      await settle(resumed, 1500)
    } else {
      // No gesture: play() rejects at once when sound is blocked, before anything downloads.
      // Only build the AudioContext after that, so blocked visits don't log autoplay warnings.
      if (!gain) el.volume = 0
      await el.play()
      ensureGraph(el)
      if (ctx?.state === 'suspended') await settle(ctx.resume(), 1500)
    }
    if (ctx && ctx.state !== 'running') throw new DOMException('Audio output still blocked', 'NotAllowedError')
    playing.value = true
    loading.value = false
    fadeTo(backgroundMusic.volume, FADE_IN)
    setMediaSession()
    removeGestureListeners()
    gate.value = 'closed'
    return true
  } catch (err) {
    if ((err as DOMException | undefined)?.name === 'NotSupportedError') available.value = false
    if (!playing.value) {
      el.pause()
      loading.value = false
    }
    return false
  }
}

/** Explicit "turn it on" (♪ button, OS media controls). */
async function play(): Promise<void> {
  writePref(true)
  await start(true)
}

function pause(remember = true) {
  if (remember) {
    writePref(false)
    removeGestureListeners()
  }
  if (!audio) return
  playing.value = false
  loading.value = false
  fadeTo(0, FADE_OUT)
  window.clearTimeout(pauseTimer)
  pauseTimer = window.setTimeout(() => {
    if (!playing.value) audio?.pause()
  }, FADE_OUT * 1000 + 50)
}

function toggle() {
  if (playing.value) pause()
  else void play()
}

/** Entry-gate choice. Must run inside the click handler so the click unlocks sound. */
function enter(withMusic: boolean) {
  if (withMusic) void play()
  else pause() // remembered as 'off'; the ♪ button can still turn it on later
  gate.value = 'closed'
}

/**
 * Run `cb` once the visitor is "in": right away when there's no gate, or when the gate closes.
 * Doesn't wait more than `maxWait` ms for the gate decision itself.
 */
function onEntered(cb: () => void, maxWait = 1200) {
  if (gate.value === 'closed') {
    cb()
    return
  }
  let done = false
  const run = () => {
    if (done) return
    done = true
    window.clearTimeout(timer)
    stop()
    cb()
  }
  const timer = window.setTimeout(() => {
    if (gate.value === 'checking') run()
  }, maxWait)
  const stop = watch(gate, (v) => {
    if (v === 'closed') run()
  })
}

/* ---------- global listeners ---------- */
function onGesture(e: Event) {
  const target = e.target as Element | null
  if (target?.closest?.('[data-music-toggle]')) return // the ♪ button handles itself
  if (playing.value || !wantsMusic()) {
    removeGestureListeners()
    return
  }
  // A touch's pointerdown doesn't unlock sound yet (its pointerup/touchend does), so skip it.
  if (navigator.userActivation && !navigator.userActivation.isActive) return
  void start(true)
}
function addGestureListeners() {
  if (listening) return
  listening = true
  for (const type of GESTURES) window.addEventListener(type, onGesture, { capture: true, passive: true })
}
function removeGestureListeners() {
  if (!listening) return
  listening = false
  for (const type of GESTURES) window.removeEventListener(type, onGesture, { capture: true })
}

function onVisibility() {
  if (document.hidden) {
    if (playing.value) {
      resumeWhenVisible = true
      pause(false)
    }
  } else if (resumeWhenVisible) {
    resumeWhenVisible = false
    void start(false)
  }
}

async function init() {
  if (initialised || typeof window === 'undefined') return
  initialised = true
  if (!enabled) {
    if (devMissing.value) {
      console.info('[music] No audio files in src/assets/audio/ — add some to enable the ♪ button.')
    }
    return
  }
  document.addEventListener('visibilitychange', onVisibility)
  if (!wantsMusic()) {
    gate.value = 'closed'
    return
  }
  addGestureListeners() // without a gate: the first click/tap/key anywhere starts it
  // Without a gesture this only succeeds where the browser already allows sound
  // (e.g. a site the visitor uses often). Otherwise the entry gate asks for that click.
  let started = false
  if (document.hidden) resumeWhenVisible = true // opened in a background tab: try when it's shown
  else started = await start(false)
  if (!started) gate.value = backgroundMusic.entryGate ? 'open' : 'closed'
}

/** Footer line, grouped by credit: “Ex Nihilo”, “…” — HOYO-MiX © HoYoverse; “…” — © Kuro Games */
const creditLine = [...new Set(tracks.map((t) => t.credit))]
  .map((credit) => {
    const titles = tracks.filter((t) => t.credit === credit).map((t) => `“${t.title}”`).join(', ')
    return credit ? `${titles} — ${credit}` : titles
  })
  .join('; ')

export function useBackgroundMusic() {
  void init()
  return {
    tracks,
    current,
    creditLine,
    available: readonly(available),
    devMissing: readonly(devMissing),
    playing: readonly(playing),
    loading: readonly(loading),
    gate: readonly(gate),
    play,
    pause,
    toggle,
    skip,
    enter,
    onEntered,
  }
}
