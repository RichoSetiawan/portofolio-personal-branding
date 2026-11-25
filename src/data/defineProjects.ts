import type { AccentTone, CareerMilestone, Project, ProjectInput, RelicMotif } from '@/types/portfolio'

/**
 * Fills in everything you don't want to hand-maintain when adding projects:
 * arcana numerals, slugs, emblem/accent rotation, default Trailblaze target.
 * Array order = order on the 3D stage, in the grid and in the numerals.
 */

const MOTIF_CYCLE: RelicMotif[] = ['astrolabe', 'seer-eye', 'fool-mask', 'golden-key', 'chalice', 'carnival-dice']
const ACCENT_CYCLE: AccentTone[] = ['gold', 'crimson']

const ROMAN: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

/** Tarot-style numeral: 0 (The Fool), I, II … XXI, then keeps counting (XXII …). */
export function toArcanaNumeral(n: number): string {
  if (n <= 0) return '0'
  let rest = Math.floor(n)
  let out = ''
  for (const [value, glyph] of ROMAN) {
    while (rest >= value) {
      out += glyph
      rest -= value
    }
  }
  return out
}

export function defineProjects(inputs: ProjectInput[]): Project[] {
  return inputs.map((p, index) => {
    const slug = p.slug ?? p.id
    return {
      ...p,
      index,
      slug,
      arcana: p.arcana ?? toArcanaNumeral(index),
      motif: p.motif ?? MOTIF_CYCLE[index % MOTIF_CYCLE.length]!,
      accent: p.accent ?? ACCENT_CYCLE[index % ACCENT_CYCLE.length]!,
      description: p.description ?? p.summary,
      architecture: p.architecture ?? [],
      highlights: p.highlights ?? [],
      techStack: p.techStack ?? [],
      trailblaze: p.trailblaze ?? { type: 'internal', route: `/projects/${slug}` },
    }
  })
}

/**
 * Dev-only sanity checks, printed to the browser console.
 * Catches the usual mistakes when adding a project by hand.
 */
export function validatePortfolio(projects: Project[], timeline: CareerMilestone[]): void {
  const warn = (msg: string) => console.warn(`[portfolio data] ${msg}`)
  const ids = new Set<string>()
  const slugs = new Set<string>()
  const milestoneIds = new Set(timeline.map((m) => m.id))

  for (const p of projects) {
    if (ids.has(p.id)) warn(`duplicate project id "${p.id}"`)
    ids.add(p.id)
    if (slugs.has(p.slug)) warn(`duplicate slug "${p.slug}" — two projects would share one URL`)
    slugs.add(p.slug)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug)) warn(`slug "${p.slug}" should be lowercase kebab-case`)
    if (p.careerId && !milestoneIds.has(p.careerId)) warn(`"${p.id}" has unknown careerId "${p.careerId}"`)
    if (p.trailblaze.type === 'external' && !/^https?:\/\//.test(p.trailblaze.url))
      warn(`"${p.id}" trailblaze url must start with http(s)://`)
    if (p.trailblaze.type === 'internal' && !p.trailblaze.route.startsWith('/'))
      warn(`"${p.id}" trailblaze route must start with "/"`)
    if (p.epithet.length > 60) warn(`"${p.id}" epithet is long (${p.epithet.length} chars) — keep the card front short`)
  }
  for (const m of timeline) {
    for (const id of m.connectedProjectIds ?? []) {
      if (!ids.has(id)) warn(`milestone "${m.id}" links unknown project "${id}"`)
    }
  }
}
