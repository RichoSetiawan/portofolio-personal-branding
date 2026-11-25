import { readonly, ref } from 'vue'
import { backgroundMusic } from '@/data/backgroundMusic'

/**
 * App-wide background music (singleton — survives route changes).
 *
 *  • With `autoplay: true`, music is ON for a visitor until they switch it off with ♪.
 *    It tries to start when the page opens. Browsers usually block sound before any
 *    interaction, so it then starts on the first click/tap/key press anywhere.
 *  • Remembers the visitor's own choice ('on' / 'off') over the default.
 *  • Fades through a Web Audio GainNode, since iOS Safari ignores `audio.volume`.
 *  • Pauses while the tab is hidden; `preload="none"`, so nothing downloads until it actually plays.
 *  • Hides itself when the file is missing (dev shows a dimmed button + hint instead).
 */

const STORAGE_KEY = 'rs-archive:music'
const FADE_IN = 1.8
const FADE_OUT = 0.6
/** Events that count as a "user activation" for sound. Touch only unlocks on finger-up (pointerup/touchend). */
const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'keydown'] as const

const configured = Boolean(backgroundMusic.src)
const available = ref(false)
const devMissing = ref(false)
const playing = ref(false)
const loading = ref(false)

let audio: HTMLAudioElement | null = null
let ctx: AudioContext | null = null
let gain: GainNode | null = null
let pauseTimer = 0
let resumeWhenVisible = false
let listening = false
let initialised = false

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

function ensureAudio(): HTMLAudioElement {
  if (audio) return audio
  audio = new Audio()
  audio.src = backgroundMusic.src
  audio.loop = true
  audio.preload = 'none'
  audio.addEventListener('waiting', () => (loading.value = true))
  audio.addEventListener('playing', () => (loading.value = false))
  audio.addEventListener('error', () => {
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
  if (!('mediaSession' in navigator)) return
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: backgroundMusic.title,
      artist: backgroundMusic.artist,
      album: 'Richo Setiawan · Trailblaze Archive',
    })
    navigator.mediaSession.setActionHandler('play', () => void play())
    navigator.mediaSession.setActionHandler('pause', () => pause())
  } catch {
    /* unsupported action */
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

/** Is there really an audio file at `src`? (SPA hosts answer missing files with index.html.) */
async function probeSource(): Promise<boolean> {
  try {
    const res = await fetch(backgroundMusic.src, { method: 'HEAD' })
    const type = res.headers.get('content-type') ?? ''
    return res.ok && !type.includes('text/html')
  } catch {
    return false
  }
}

async function init() {
  if (initialised || typeof window === 'undefined' || !configured) return
  initialised = true
  const ok = await probeSource()
  available.value = ok
  if (!ok) {
    if (import.meta.env.DEV) {
      devMissing.value = true
      console.info(`[music] No audio file at "${backgroundMusic.src}" — add it under /public to enable the ♪ button.`)
    }
    return
  }
  document.addEventListener('visibilitychange', onVisibility)
  if (!wantsMusic()) return
  addGestureListeners() // first click/tap/key anywhere starts it if the browser blocks the attempt below
  if (document.hidden) resumeWhenVisible = true // opened in a background tab
  else void start(false) // succeeds where the browser already allows sound (e.g. a site the visitor uses often)
}

export function useBackgroundMusic() {
  void init()
  return {
    track: backgroundMusic,
    available: readonly(available),
    devMissing: readonly(devMissing),
    playing: readonly(playing),
    loading: readonly(loading),
    play,
    pause,
    toggle,
  }
}
