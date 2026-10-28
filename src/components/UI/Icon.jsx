export function Icon({ name }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none' }
  switch (name) {
    case 'home':
      return <svg {...common}><path d="M4 10.5 12 4l8 6.5V20H15v-6H9v6H4V10.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
    case 'users':
      return <svg {...common}><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" /><path d="M4 19c.5-3 2.5-5 5-5s4.5 2 5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
    case 'groups':
      return <svg {...common}><rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" /><path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
    case 'book':
      return <svg {...common}><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H20v14H7.5A2.5 2.5 0 0 0 5 20.5V6.5Z" stroke="currentColor" strokeWidth="1.7" /></svg>
    case 'teacher':
      return <svg {...common}><circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" /><path d="M5 19c1-3.5 3.5-5.5 7-5.5s6 2 7 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
    case 'link':
      return <svg {...common}><path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5.93" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
    case 'grades':
      return <svg {...common}><path d="M5 4h10l4 4v12H5V4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
    case 'report':
      return <svg {...common}><path d="M5 19V9M10 19V5M15 19v-7M20 19V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
    case 'key':
      return <svg {...common}><circle cx="8" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" /><path d="M11 12h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
    case 'log':
      return <svg {...common}><rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" /></svg>
    case 'cap':
      return <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M3 10.5 12 5l9 5.5-9 5.5L3 10.5Z" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round" /><path d="M7 13v4.2c0 .3 1.8 2.3 5 2.3s5-2 5-2.3V13" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" /></svg>
    case 'search':
      return <svg {...common}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
    default:
      return null
  }
}
