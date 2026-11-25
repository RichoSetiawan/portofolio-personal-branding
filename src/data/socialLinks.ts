import type { SocialLink } from '@/types/portfolio'

/**
 * Contact Me — centralised social links.
 *
 * ⚠️ Replace every `your-handle` with your real usernames. These are the only
 * place the footer reads URLs from.
 */
export const socialLinks: SocialLink[] = [
  {
    platform: 'linkedin',
    label: 'LinkedIn',
    handle: 'in/richosetiawan',
    url: 'https://www.linkedin.com/in/richosetiawan/',
    ariaLabel: 'Richo Setiawan on LinkedIn (opens in a new tab)',
  },
  {
    platform: 'github',
    label: 'GitHub',
    handle: '@RichoSetiawan',
    url: 'https://github.com/RichoSetiawan',
    ariaLabel: 'Richo Setiawan on GitHub (opens in a new tab)',
  },
  {
    platform: 'instagram',
    label: 'Instagram',
    handle: '@your-handle',
    url: 'https://www.instagram.com/your-handle',
    ariaLabel: 'Richo Setiawan on Instagram (opens in a new tab)',
  },
  {
    platform: 'tiktok',
    label: 'TikTok',
    handle: '@your-handle',
    url: 'https://www.tiktok.com/@your-handle',
    ariaLabel: 'Richo Setiawan on TikTok (opens in a new tab)',
  },
  {
    platform: 'youtube',
    label: 'YouTube',
    handle: '@your-handle',
    url: 'https://www.youtube.com/@your-handle',
    ariaLabel: 'Richo Setiawan on YouTube (opens in a new tab)',
  },
]
