import type { Project } from '@/types/portfolio'

/**
 * Relic Archive — project showcase data.
 *
 * ⚠️ Entries other than "Trailblaze Archive" are SAMPLE content that shows the
 * shape of a project. Replace titles, descriptions, stacks and URLs with your
 * real work. `https://example.com/...` links are placeholders on purpose.
 *
 * Trailblaze behaviour:
 *   { type: 'external', url }  → window.open(url, '_blank', 'noopener,noreferrer')
 *   { type: 'internal', route } → router.push(route)
 */
export const projects: Project[] = [
  {
    id: 'trailblaze-archive',
    slug: 'trailblaze-archive',
    arcana: '0',
    title: 'Trailblaze Archive',
    epithet: 'A star-chart of every path walked',
    category: 'Creative Frontend',
    year: 2026,
    status: 'Live',
    motif: 'astrolabe',
    accent: 'gold',
    summary:
      'This portfolio hub — a Planarcardia-inspired gallery with a Three.js cosmos, relic cards and a career chronicle.',
    description:
      'A personal hub built as a theatrical stage. A Three.js backdrop renders a starfield, drifting arcana frames and an astrolabe that turns to follow the selected relic. Project cards unveil through a GSAP-orchestrated drop sequence, and every piece of content is driven from typed data files so new work can be added without touching components.',
    architecture: [
      'Vue 3 + <script setup> TypeScript components, Vue Router for project dossiers',
      'Single Three.js renderer exposed through a provide/inject scene controller',
      'GSAP timelines for card-drop, light-sweep and route transitions',
      'Tailwind v4 theme tokens enforcing a strict 60:30:10 palette',
    ],
    highlights: [
      'WebGL capability check with an automatic 2D gallery fallback',
      'Respects prefers-reduced-motion across canvas and GSAP',
      'Keyboard-navigable 3D stage, focus-trapped modal, aria-labelled controls',
    ],
    techStack: ['Vue 3', 'TypeScript', 'Three.js', 'GSAP', 'Tailwind CSS', 'Vite'],
    trailblaze: { type: 'internal', route: '/projects/trailblaze-archive' },
    repoUrl: 'https://example.com/trailblaze-archive',
  },
  {
    id: 'ledger-oracle',
    slug: 'ledger-oracle',
    arcana: 'II',
    title: 'Ledger Oracle',
    epithet: 'The eye that reads every transaction',
    category: 'Internal Tooling',
    year: 2025,
    status: 'Archived',
    motif: 'seer-eye',
    accent: 'crimson',
    summary:
      'Sample entry — a monitoring dashboard that surfaces anomalies in transaction batches for operations teams.',
    description:
      'Sample entry: replace with a real project. Describes an internal dashboard that ingests batch job results, flags failed or delayed runs, and gives operations staff a single place to triage. Built around a REST API with role-scoped views and exportable reports.',
    architecture: [
      'Spring Boot REST services with scheduled batch-status collectors',
      'PostgreSQL for job history and audit trails',
      'Vue 3 dashboard with chart widgets and filterable incident log',
    ],
    highlights: [
      'Cut manual status-checking with a single consolidated view',
      'Role-based access so each team sees only its jobs',
      'CSV / PDF export for daily operations reports',
    ],
    techStack: ['Java', 'Spring Boot', 'PostgreSQL', 'Vue 3', 'Chart.js'],
    trailblaze: { type: 'external', url: 'https://example.com/ledger-oracle' },
    careerId: 'bca',
  },
  {
    id: 'masquerade-gate',
    slug: 'masquerade-gate',
    arcana: 'V',
    title: 'Masquerade Gate',
    epithet: 'Every guest wears a verified mask',
    category: 'Identity & Access',
    year: 2025,
    status: 'Prototype',
    motif: 'fool-mask',
    accent: 'crimson',
    summary:
      'Sample entry — a role-based access gateway that unifies login and permissions across internal apps.',
    description:
      'Sample entry: replace with a real project. A gateway service that centralises authentication, issues short-lived tokens and maps organisational roles to application permissions, with an admin console for approvals.',
    architecture: [
      'Token-based auth service with refresh rotation',
      'Permission matrix stored per application and role',
      'Admin console for access requests and approvals',
    ],
    highlights: [
      'One sign-in across several internal tools',
      'Approval workflow replaces ad-hoc access requests',
      'Audit log of every grant and revoke',
    ],
    techStack: ['Node.js', 'TypeScript', 'Express', 'Redis', 'Vue 3'],
    trailblaze: { type: 'external', url: 'https://example.com/masquerade-gate' },
    careerId: 'bca',
  },
  {
    id: 'credit-compass',
    slug: 'credit-compass',
    arcana: 'X',
    title: 'Credit Compass',
    epithet: 'A golden key for every application',
    category: 'Finance Workflow',
    year: 2026,
    status: 'In Progress',
    motif: 'golden-key',
    accent: 'gold',
    summary:
      'Sample entry — a tracker that follows financing applications from submission to disbursement.',
    description:
      'Sample entry: replace with a real project from your Management Trainee rotation. Tracks each financing application through its stages, highlights bottlenecks per branch and gives supervisors a live pipeline view.',
    architecture: [
      'Stage-based pipeline model with SLA timers',
      'Branch-level aggregation for supervisor dashboards',
      'Notification hooks for stalled applications',
    ],
    highlights: [
      'Pipeline visibility from submission to disbursement',
      'SLA breach alerts per stage',
      'Built alongside business stakeholders during MT rotation',
    ],
    techStack: ['Laravel', 'MySQL', 'Vue 3', 'Tailwind CSS'],
    trailblaze: { type: 'internal', route: '/projects/credit-compass' },
    careerId: 'fifgroup',
  },
  {
    id: 'sigil-registry',
    slug: 'sigil-registry',
    arcana: 'XVII',
    title: 'Sigil Registry',
    epithet: 'Where scholars inscribe their names',
    category: 'Information System',
    year: 2024,
    status: 'Archived',
    motif: 'chalice',
    accent: 'gold',
    summary:
      'Sample entry — a campus information system for course registration and academic records.',
    description:
      'Sample entry: replace with a real Information Systems coursework or thesis project. Covers requirements analysis, ERD and UML design, and an implemented registration flow with advisor approval.',
    architecture: [
      'Requirements & business-process modelling (BPMN, UML)',
      'Normalised relational schema with ERD documentation',
      'MVC web application with role-based dashboards',
    ],
    highlights: [
      'Full SDLC: analysis → design → implementation → testing',
      'Advisor approval flow for course plans',
      'Documented with use-case and sequence diagrams',
    ],
    techStack: ['PHP', 'Laravel', 'MySQL', 'Bootstrap', 'UML'],
    trailblaze: { type: 'external', url: 'https://example.com/sigil-registry' },
    careerId: 'ukrida',
  },
  {
    id: 'carnival-queue',
    slug: 'carnival-queue',
    arcana: 'XXI',
    title: 'Carnival Queue',
    epithet: 'Roll the dice, take your seat',
    category: 'Event Platform',
    year: 2023,
    status: 'Prototype',
    motif: 'carnival-dice',
    accent: 'crimson',
    summary:
      'Sample entry — an event ticketing and queue app for campus festivals.',
    description:
      'Sample entry: replace with a real project. A mobile-first ticketing app with QR check-in, a live queue board and organiser analytics for campus events.',
    architecture: [
      'Mobile-first SPA with QR code generation and scanning',
      'Realtime queue board over WebSockets',
      'Organiser dashboard with attendance analytics',
    ],
    highlights: [
      'QR check-in for fast entry',
      'Live queue position updates',
      'Attendance insights for organisers',
    ],
    techStack: ['Vue 3', 'Firebase', 'WebSockets', 'Tailwind CSS'],
    trailblaze: { type: 'external', url: 'https://example.com/carnival-queue' },
    careerId: 'ukrida',
  },
]

export const findProjectBySlug = (slug: string): Project | undefined =>
  projects.find((p) => p.slug === slug)

export const findProjectsByIds = (ids: string[]): Project[] =>
  ids.map((id) => projects.find((p) => p.id === id)).filter((p): p is Project => Boolean(p))
