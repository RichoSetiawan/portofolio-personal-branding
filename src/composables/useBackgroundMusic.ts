import { readonly, ref } from 'vue'
import { backgroundMusic } from '@/data/backgroundMusic'

/**
 * App-wide background music (singleton — survives route changes).
 *
 *  • Never autoplays on a first visit; starts on the ♪ button.
 *  • Remembers the visitor's choice; if it was "on", resumes on their first click/keypress
 *    (browsers only allow sound after a user gesture).
 *  • Fades through a Web Audio GainNode, since iOS Safari ignores `audio.volume`.
 *  • Pauses while the tab is hidden; `preload="none"` so phones don't download it until asked.
 *  • Hides itself when the file is missing (dev shows a dimmed button + hint instead).
 */

const STORAGE_KEY = 'rs-archive:music'
const FADE_IN = 1.8
const FADE_OUT = 0.6

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
let initialised = false

function readPref(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}
function writePref(on: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    /* storage blocked */
  }
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

async function play(): Promise<void> {
  if (!available.value) return
  const el = ensureAudio()
  ensureGraph(el)
  window.clearTimeout(pauseTimer)
  loading.value = true
  try {
    if (ctx?.state === 'suspended') await ctx.resume()
    if (!gain) el.volume = 0
    await el.play()
    playing.value = true
    fadeTo(backgroundMusic.volume, FADE_IN)
    writePref(true)
    setMediaSession()
  } catch (err) {
    playing.value = false
    loading.value = false
    const name = (err as DOMException | undefined)?.name
    if (name === 'NotSupportedError') available.value = false
  }
}

function pause(remember = true) {
  if (!audio) return
  playing.value = false
  loading.value = false
  if (remember) writePref(false)
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

/* ---------- global listeners (registered once) ---------- */
function onFirstGesture(e: Event) {
  const target = e.target as Element | null
  if (target?.closest?.('[data-music-toggle]')) return // the toggle handles itself
  removeGestureListeners()
  if (readPref() && !playing.value) void play()
}
function removeGestureListeners() {
  window.removeEventListener('pointerdown', onFirstGesture, true)
  window.removeEventListener('keydown', onFirstGesture, true)
}

function onVisibility() {
  if (document.hidden) {
    if (playing.value) {
      resumeWhenVisible = true
      pause(false)
    }
  } else if (resumeWhenVisible) {
    resumeWhenVisible = false
    void play()
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
  if (readPref()) {
    window.addEventListener('pointerdown', onFirstGesture, true)
    window.addEventListener('keydown', onFirstGesture, true)
  }
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
