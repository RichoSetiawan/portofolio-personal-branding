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

export type ProjectStatus = 'Live' | 'In Progress' | 'Archived' | 'Prototype'

/**
 * What you write in `src/data/projects.ts`.
 * Only the un-marked fields are required — everything marked "auto" is filled in
 * by `defineProjects()` when omitted.
 */
export interface ProjectInput {
  /** Unique, kebab-case. Also used as the URL slug unless `slug` is given. */
  id: string
  /** auto: = id. URL segment for `/projects/:slug`. */
  slug?: string
  /** auto: tarot numeral from the array position (0, I, II … XXI, XXII …). */
  arcana?: string
  title: string
  /** One short poetic line for the card front. */
  epithet: string
  category: string
  year: number
  status: ProjectStatus
  summary: string
  /** auto: cycles through the six built-in emblems. */
  motif?: RelicMotif
  /** auto: alternates gold / crimson. */
  accent?: AccentTone
  /** Optional illustration (e.g. '/relics/foo.webp' in /public); replaces the SVG emblem. */
  imageUrl?: string
  /** auto: = summary. */
  description?: string
  architecture?: string[]
  highlights?: string[]
  techStack?: string[]
  /** auto: internal route to this project's own dossier page. */
  trailblaze?: TrailblazeTarget
  repoUrl?: string
  /** Career milestone this project belongs to — it then appears under that milestone automatically. */
  careerId?: CareerId
}

/** Fully-resolved project used by every component. */
export interface Project
  extends Omit<
    ProjectInput,
    'slug' | 'arcana' | 'motif' | 'accent' | 'description' | 'architecture' | 'highlights' | 'techStack' | 'trailblaze'
  > {
  /** Position in the archive (0-based). */
  index: number
  slug: string
  arcana: string
  motif: RelicMotif
  accent: AccentTone
  description: string
  architecture: string[]
  highlights: string[]
  techStack: string[]
  trailblaze: TrailblazeTarget
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
  /**
   * Optional EXTRA project ids to show under this milestone.
   * Projects with a matching `careerId` are linked automatically — no need to list them here.
   */
  connectedProjectIds?: string[]
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
