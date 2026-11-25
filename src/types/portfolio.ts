/**
 * Shared domain types for the Trailblaze Archive portfolio.
 * Data lives in `src/data/*`; components only consume these shapes.
 */

/** Centerpiece emblem drawn on a project's relic card (see `components/art/RelicArt.vue`). */
export type RelicMotif =
  | 'astrolabe' // Planarcardia star-chart — orbits & navigation
  | 'seer-eye' // LotM-style clockwork divination eye — observability & insight
  | 'fool-mask' // Aha / Masked Fools theatre mask — identity & access
  | 'golden-key' // Umineko-style ornate key — unlocking finance workflows
  | 'chalice' // Arcane grail — knowledge & academia
  | 'carnival-dice' // Elation dice — playful / event / chance-driven apps

/** Which 10% accent leads a card's rim light. */
export type AccentTone = 'crimson' | 'gold'

/** Where the "Trailblaze" CTA sends the visitor. */
export type TrailblazeTarget =
  | { type: 'external'; url: string }
  | { type: 'internal'; route: string }

export type CareerId = 'ukrida' | 'bca' | 'fifgroup'

export interface Project {
  id: string
  /** URL segment for `/projects/:slug`. */
  slug: string
  /** Tarot-style numeral shown on the card crown. */
  arcana: string
  title: string
  /** One-line poetic subtitle kept short for the card front. */
  epithet: string
  category: string
  year: number
  status: 'Live' | 'In Progress' | 'Archived' | 'Prototype'
  motif: RelicMotif
  accent: AccentTone
  /** Optional raster/vector illustration; replaces the SVG motif when present. */
  imageUrl?: string
  summary: string
  description: string
  architecture: string[]
  highlights: string[]
  techStack: string[]
  trailblaze: TrailblazeTarget
  repoUrl?: string
  /** Career milestone this project belongs to (links timeline ↔ gallery). */
  careerId?: CareerId
}

export type MilestoneKind = 'Education' | 'Internship' | 'Full-Time / Program'

export interface CareerMilestone {
  id: CareerId
  kind: MilestoneKind
  startYear: number
  /** `null` means ongoing ("Present"). */
  endYear: number | null
  organization: string
  organizationFull: string
  role: string
  location: string
  summary: string
  domainFocus: string[]
  highlights: string[]
  /** Project ids (from `projects.ts`) surfaced when this milestone is inspected. */
  connectedProjectIds: string[]
  /** Small glyph rendered inside the timeline node. */
  sigil: 'quill' | 'vault' | 'compass'
  accent: AccentTone
}

export type SocialPlatform = 'linkedin' | 'github' | 'instagram' | 'tiktok' | 'youtube'

export interface SocialLink {
  platform: SocialPlatform
  label: string
  handle: string
  url: string
  ariaLabel: string
}
