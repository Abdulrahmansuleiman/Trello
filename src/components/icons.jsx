const s = { display: 'block' }

export const IconLogo = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <rect x="1" y="1" width="22" height="22" rx="3" fill="#0C66E4" />
    <rect x="4.5" y="4.5" width="6" height="12" rx="1.3" fill="#fff" />
    <rect x="13.5" y="4.5" width="6" height="8" rx="1.3" fill="#fff" />
  </svg>
)

export const IconStar = ({ filled, size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <path
      d="M12 3.2l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.5l-5.2 2.7 1-5.8L3.6 9.3l5.8-.8L12 3.2z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
)

export const IconChevron = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconShare = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <path d="M12 16V4m0 0L8 8m4-4l4 4M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconDots = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <circle cx="5" cy="12" r="1.7" fill="currentColor" />
    <circle cx="12" cy="12" r="1.7" fill="currentColor" />
    <circle cx="19" cy="12" r="1.7" fill="currentColor" />
  </svg>
)

export const IconPlus = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

export const IconX = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

export const IconCheck = ({ size = 12 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconCheckbox = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M7.5 12.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconClock = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconDescription = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <path d="M5 7h14M5 12h14M5 17h9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const IconAttachment = ({ size = 13 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <path d="M21 11.5l-8.5 8.5a5 5 0 01-7-7l8.5-8.5a3.3 3.3 0 014.7 4.7L10 17.4a1.7 1.7 0 01-2.4-2.4l7.3-7.3" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconTrash = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const IconYoutube = ({ size = 12 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <path d="M23 12s0-3.3-.4-4.9a2.6 2.6 0 00-1.8-1.8C19.2 5 12 5 12 5s-7.2 0-8.8.3A2.6 2.6 0 001.4 7.1C1 8.7 1 12 1 12s0 3.3.4 4.9a2.6 2.6 0 001.8 1.8C4.8 19 12 19 12 19s7.2 0 8.8-.3a2.6 2.6 0 001.8-1.8C23 15.3 23 12 23 12z" fill="#fff" />
    <path d="M9.8 15.2V8.8l5.6 3.2-5.6 3.2z" fill="#FF0000" />
  </svg>
)

export const IconInstagram = ({ size = 12 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="#fff" strokeWidth="2" />
    <circle cx="12" cy="12" r="4.3" fill="none" stroke="#fff" strokeWidth="2" />
    <circle cx="17.3" cy="6.7" r="1.3" fill="#fff" />
  </svg>
)

export const IconTikTok = ({ size = 12 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <path d="M14 3c.3 2.2 1.8 3.8 4 4.1v2.6c-1.5.1-2.9-.3-4.2-1.1v5.9a5.3 5.3 0 11-5.3-5.3c.3 0 .6 0 .9.1v2.7a2.6 2.6 0 102 2.5V3H14z" fill="#fff" />
  </svg>
)

export const IconLinkedin = ({ size = 12 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <path d="M4.5 3.5a2 2 0 100 4 2 2 0 000-4zM3 9h3v12H3zM9.5 9h2.8v1.7h.04c.4-.75 1.4-1.55 2.9-1.55 3.1 0 3.7 2 3.7 4.7V21h-3v-5.2c0-1.24-.02-2.84-1.7-2.84-1.7 0-2 1.34-2 2.75V21h-3z" fill="#fff" />
  </svg>
)

export const IconFacebook = ({ size = 12 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} style={s} aria-hidden="true">
    <path d="M14 9h2.5V6H14a4 4 0 00-4 4v2H8v3h2v7h3v-7h2.4l.6-3H13v-1.6c0-.8.2-1.4 1-1.4z" fill="#fff" />
  </svg>
)

const PLATFORM_ICONS = {
  youtube: IconYoutube,
  instagram: IconInstagram,
  tiktok: IconTikTok,
  linkedin: IconLinkedin,
  facebook: IconFacebook,
}

export function PlatformIcon({ name, size = 12 }) {
  const Cmp = PLATFORM_ICONS[name]
  return Cmp ? <Cmp size={size} /> : null
}
