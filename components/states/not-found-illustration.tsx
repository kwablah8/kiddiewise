/**
 * Bespoke 404 art for the school-management app. A magnifying glass (`--primary` blue ring, navy
 * brand-gradient handle) searching a "record card" whose avatar + name/detail lines deliberately
 * echo the Students/Staff table rows (06-UI §6), the metaphor is a record search that returns
 * nothing. Pure inline SVG on design tokens: no external asset, no new dependency. Decorative;
 * the heading carries the meaning for assistive tech.
 */
export function NotFoundIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 200"
      className={className}
      fill="none"
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nf-brand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--brand-top)" />
          <stop offset="1" stopColor="var(--brand-bottom)" />
        </linearGradient>
      </defs>

      {/* soft ground shadow */}
      <ellipse cx="116" cy="178" rx="74" ry="8" fill="var(--brand-bottom)" opacity="0.05" />

      {/* second card behind, for a sense of a stack of records */}
      <g transform="rotate(-8 108 80)" opacity="0.5">
        <rect
          x="50"
          y="36"
          width="116"
          height="88"
          rx="15"
          fill="var(--surface)"
          stroke="var(--border)"
          strokeWidth="2"
        />
      </g>

      {/* front record card */}
      <rect
        x="38"
        y="46"
        width="120"
        height="92"
        rx="16"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="2"
      />

      {/* avatar (brand gradient, matching the app's profile chips) + person glyph */}
      <circle cx="66" cy="74" r="13" fill="url(#nf-brand)" />
      <circle cx="66" cy="70" r="3.6" fill="#fff" />
      <path d="M60 81c0-3.6 2.7-6 6-6s6 2.4 6 6z" fill="#fff" />

      {/* name + subtitle lines */}
      <rect x="88" y="66" width="52" height="8" rx="4" fill="var(--text)" opacity="0.15" />
      <rect x="88" y="80" width="34" height="7" rx="3.5" fill="var(--text)" opacity="0.1" />

      {/* divider + two detail fields */}
      <line x1="54" y1="104" x2="142" y2="104" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="54" y="114" width="44" height="6" rx="3" fill="var(--text)" opacity="0.1" />
      <rect x="106" y="114" width="36" height="6" rx="3" fill="var(--text)" opacity="0.1" />

      {/* magnifying glass over the corner, empty lens = no match */}
      <circle cx="150" cy="120" r="30" fill="var(--surface)" />
      <circle cx="150" cy="120" r="30" fill="var(--primary)" opacity="0.08" />
      <rect x="140" y="117.5" width="20" height="5" rx="2.5" fill="var(--primary)" opacity="0.55" />
      <circle cx="150" cy="120" r="30" stroke="var(--primary)" strokeWidth="7" />
      <line
        x1="170"
        y1="140"
        x2="189"
        y2="159"
        stroke="url(#nf-brand)"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}
