// Custom chunky stationery SVG glyphs (2px crisp strokes, zero generic icon-pack clone look)
window.SpendIcons = {
  binderClip: `
    <svg class="binder-clip-svg" viewBox="0 0 96 54" width="96" height="54" aria-hidden="true">
      <path d="M32 22 C28 6, 36 3, 48 3 C60 3, 68 6, 64 22" fill="none" stroke="#DCE5F2" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M36 22 C33 10, 39 7, 48 7 C57 7, 63 10, 60 22" fill="none" stroke="#9AA9BE" stroke-width="2" stroke-linecap="round"/>
      <path d="M16 20 L80 20 L86 48 C86 50.5 84 52 81.5 52 L14.5 52 C12 52 10 50.5 10 48 Z" fill="#D81B7E" stroke="#8C0D50" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="20" y="25" width="56" height="6" rx="2" fill="#F252A4" opacity="0.65"/>
      <rect x="14" y="45" width="68" height="4" rx="1.5" fill="#9E115B"/>
    </svg>
  `,
  rulerCorner: `
    <svg class="desk-prop desk-prop-ruler" viewBox="0 0 120 120" width="110" height="110" aria-hidden="true">
      <polygon points="6,6 112,6 6,112" fill="#F5C122" stroke="#A67C08" stroke-width="3" stroke-linejoin="round"/>
      <polygon points="24,24 68,24 24,68" fill="#126CE2" stroke="#A67C08" stroke-width="2.5" stroke-linejoin="round"/>
      <line x1="22" y1="6" x2="22" y2="15" stroke="#8A6504" stroke-width="2"/>
      <line x1="38" y1="6" x2="38" y2="13" stroke="#8A6504" stroke-width="2"/>
      <line x1="54" y1="6" x2="54" y2="15" stroke="#8A6504" stroke-width="2"/>
      <line x1="70" y1="6" x2="70" y2="13" stroke="#8A6504" stroke-width="2"/>
      <line x1="86" y1="6" x2="86" y2="15" stroke="#8A6504" stroke-width="2"/>
    </svg>
  `,
  pencilProp: `
    <svg class="desk-prop desk-prop-pencil" viewBox="0 0 150 32" width="136" height="28" aria-hidden="true">
      <rect x="24" y="7" width="96" height="18" rx="2" fill="#F5C122" stroke="#8A6504" stroke-width="2.5"/>
      <line x1="24" y1="13" x2="120" y2="13" stroke="#D19B0B" stroke-width="2"/>
      <rect x="120" y="7" width="10" height="18" fill="#D5DFEC" stroke="#6E7C91" stroke-width="2"/>
      <rect x="130" y="7" width="14" height="18" rx="4" fill="#E35699" stroke="#8C0D50" stroke-width="2"/>
      <polygon points="24,7 6,16 24,25" fill="#F2D7B6" stroke="#8A6504" stroke-width="2.5" stroke-linejoin="round"/>
      <polygon points="11,13.5 5,16 11,18.5" fill="#1E293B"/>
    </svg>
  `,
  bell: `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">
      <path d="M6 10a6 6 0 1 1 12 0v5l2 2H4l2-2v-5Z"/>
      <path d="M10 20h4"/>
    </svg>
  `,
  sheet: `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="1"/>
      <line x1="8" y1="8" x2="16" y2="8"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
      <line x1="8" y1="16" x2="13" y2="16"/>
    </svg>
  `,
  calendar: `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="1"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="8" y1="3" x2="8" y2="7"/>
      <line x1="16" y1="3" x2="16" y2="7"/>
    </svg>
  `,
  folder: `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">
      <path d="M3 6h6l2 2h10v11H3V6Z"/>
    </svg>
  `,
  sun: `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square" aria-hidden="true">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="5"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="5" y2="12"/>
      <line x1="19" y1="12" x2="22" y2="12"/>
      <line x1="4.9" y1="4.9" x2="7.1" y2="7.1"/>
      <line x1="16.9" y1="16.9" x2="19.1" y2="19.1"/>
      <line x1="16.9" y1="7.1" x2="19.1" y2="4.9"/>
      <line x1="4.9" y1="19.1" x2="7.1" y2="16.9"/>
    </svg>
  `,
  moon: `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="miter" aria-hidden="true">
      <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z"/>
    </svg>
  `,
  edit: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square" aria-hidden="true">
      <path d="M4 20h4l11-11-4-4L4 16v4Z"/>
    </svg>
  `,
  trash: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square" aria-hidden="true">
      <path d="M4 7h16"/>
      <path d="M9 4h6v3H9V4Z"/>
      <path d="M6 7l1 13h10l1-13"/>
    </svg>
  `,
  checkStamp: `
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" aria-hidden="true">
      <polyline points="4 12 9 17 20 6"/>
    </svg>
  `,
  download: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square" aria-hidden="true">
      <path d="M12 4v11"/>
      <polyline points="7 11 12 16 17 11"/>
      <line x1="4" y1="20" x2="20" y2="20"/>
    </svg>
  `,
  chevronLeft: `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" aria-hidden="true">
      <polyline points="15 5 8 12 15 19"/>
    </svg>
  `,
  chevronRight: `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" aria-hidden="true">
      <polyline points="9 5 16 12 9 19"/>
    </svg>
  `
};
