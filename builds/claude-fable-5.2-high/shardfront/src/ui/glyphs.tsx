// ui: small original stroke glyphs for commands and resources.
const PATHS: Record<string, string> = {
  attack: 'M5 19L16 8M13 5l6 6M17 3h4v4M5 19l-1 1M8 16l-3-3',
  stop: 'M7 7h10v10H7z',
  hold: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z',
  patrol: 'M5 9h12l-3-3M19 15H7l3 3',
  guard: 'M12 4a8 8 0 1 0 .01 0M12 9a3 3 0 1 0 .01 0',
  build: 'M4 20l9-9M12 6l6 6M14 3l7 7-2 2-7-7z',
  back: 'M15 5l-7 7 7 7',
  cancel: 'M6 6l12 12M18 6L6 18',
  rally: 'M7 21V4M7 5h11l-3 3.5 3 3.5H7',
  brace: 'M4 20h16M8 20V10l4-5 4 5v10M12 12v4',
  curl: 'M12 12a2 2 0 1 1 2 2 4.5 4.5 0 1 1-4.5-4.5A7 7 0 0 1 19 15',
  weld: 'M13 3L6 13h5l-1 8 8-11h-5z',
  spike: 'M12 9v8M8 21h8M12 17l-4 4M12 17l4 4M7.5 7.5a6.5 6.5 0 0 1 9 0M4.5 5a10.5 10.5 0 0 1 15 0',
  mend: 'M12 8v8M8 12h8M12 3a9 9 0 1 0 .01 0',
  armor: 'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6zM9 12l2 2 4-4',
  tier: 'M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.3-5.5-3-5.5 3 1-6.3L3 9.700l6.2-.9z',
};

export function Glyph({ name, size = 26 }: { name: string; size?: number }) {
  const d = PATHS[name] ?? PATHS.tier;
  return (
    <svg className="glyph" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
