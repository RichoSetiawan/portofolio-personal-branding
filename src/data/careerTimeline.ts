import type { CareerMilestone } from '@/types/portfolio'

/** Visible range of the chronicle axis. */
export const TIMELINE_START = 2022
export const TIMELINE_END = 2026

/**
 * Career & Education Chronicle (2022 – 2026).
 * Highlights below are written generically — tune them to your actual experience.
 * Projects appear under a milestone automatically via their `careerId` in projects.ts.
 */
export const careerTimeline: CareerMilestone[] = [
  {
    id: 'ukrida',
    kind: 'Education',
    startYear: 2022,
    endYear: 2026,
    organization: 'UKRIDA',
    organizationFull: 'Universitas Kristen Krida Wacana',
    role: 'Information Systems (Sistem Informasi)',
    location: 'Jakarta, Indonesia',
    summary:
      'Undergraduate study bridging business processes and software — where the trailblaze began.',
    domainFocus: [
      'Systems Analysis & Design',
      'Database Management',
      'Business Process Modelling',
      'Web Development',
    ],
    highlights: [
      'Analysed and designed information systems end-to-end, from requirements to deployment',
      'Built coursework and team projects across web, database and process design',
      'Graduated into a finance-industry career path',
    ],
    sigil: 'quill',
    accent: 'gold',
  },
  {
    id: 'bca',
    kind: 'Internship',
    startYear: 2024,
    endYear: 2025,
    organization: 'BCA',
    organizationFull: 'Bank Central Asia',
    role: 'Application Developer Intern',
    location: 'Jakarta, Indonesia',
    summary:
      'Hands-on application development inside one of Indonesia’s largest private banks.',
    domainFocus: ['Banking Applications', 'Backend Services', 'Internal Tooling', 'SDLC in Regulated Environments'],
    highlights: [
      'Contributed to internal application development within an enterprise banking team',
      'Worked with code review, testing and release processes at bank scale',
      'Collaborated with business units to translate requirements into features',
    ],
    sigil: 'vault',
    accent: 'crimson',
  },
  {
    id: 'fifgroup',
    kind: 'Full-Time / Program',
    startYear: 2026,
    endYear: null,
    organization: 'FIFGROUP',
    organizationFull: 'PT Federal International Finance (FIFGROUP)',
    role: 'Management Trainee (MT)',
    location: 'Jakarta, Indonesia',
    summary:
      'Management Trainee program — rotating across the business while building and linking ongoing work.',
    domainFocus: ['Consumer Financing', 'Digital Transformation', 'Process Improvement', 'Cross-functional Leadership'],
    highlights: [
      'Rotations across business and technology functions',
      'Hub for ongoing work and linked portfolio items',
      'Bridging operational needs with digital solutions',
    ],
    sigil: 'compass',
    accent: 'gold',
  },
]
