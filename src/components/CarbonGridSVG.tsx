/**
 * CarbonGridSVG — animated inline SVG globe showing global emission hotspots.
 * Replaces the external CDN earth-map image on the landing page:
 *  - No external network request
 *  - Scales crisp at any resolution
 *  - CSS-only animations (GPU-composited, no JS per-frame work)
 */
export default function CarbonGridSVG() {
  return (
    <svg
      viewBox="0 0 380 380"
      className="w-full h-full"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="cgsvg-clip">
          <circle cx="190" cy="190" r="135" />
        </clipPath>

        {/* Subtle glow filters */}
        <filter id="cgsvg-glow-r" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="cgsvg-rim" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feColorMatrix in="b" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.30  0 0 0 0 0.7  0 0 0 0.25 0" result="c" />
          <feMerge><feMergeNode in="c" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* Globe fill */}
        <radialGradient id="cgsvg-globe" cx="38%" cy="32%" r="68%">
          <stop offset="0%"   stopColor="#0f1545" />
          <stop offset="45%"  stopColor="#0a0e30" />
          <stop offset="100%" stopColor="#040614" />
        </radialGradient>

        {/* Atmosphere edge */}
        <radialGradient id="cgsvg-atmo" cx="50%" cy="50%" r="50%">
          <stop offset="88%" stopColor="#4a5adc" stopOpacity="0" />
          <stop offset="96%" stopColor="#4a5adc" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#4a5adc" stopOpacity="0.10" />
        </radialGradient>

        {/* Scanner sweep */}
        <linearGradient id="cgsvg-scan" x1="0" y1="0" x2="1" y2="0" gradientTransform="rotate(10)">
          <stop offset="0%"   stopColor="#4a5adc" stopOpacity="0" />
          <stop offset="60%"  stopColor="#4a5adc" stopOpacity="0.04" />
          <stop offset="90%"  stopColor="#6875e0" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#8a94f0" stopOpacity="0.25" />
        </linearGradient>

        {/* Data arc glow */}
        <filter id="cgsvg-arc" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        <style>{`
          @keyframes cgsvg-sweep { to { transform: rotate(360deg); } }
          @keyframes cgsvg-dash  { to { stroke-dashoffset: -36; } }
          .cgsvg-sweep { transform-origin:190px 190px; animation:cgsvg-sweep 12s linear infinite; }
          .cgsvg-df    { animation:cgsvg-dash 2.5s linear infinite; }
          .cgsvg-df2   { animation:cgsvg-dash 2.5s linear infinite; animation-delay:-1.25s; }
        `}</style>
      </defs>

      {/* Outer reference rings */}
      <circle cx="190" cy="190" r="168" fill="none" stroke="#1a1d35" strokeWidth=".4" />
      <circle cx="190" cy="190" r="155" fill="none" stroke="#14162a" strokeWidth=".3" strokeDasharray="1.5 8" />

      {/* Degree markers — minimal, 90-degree intervals */}
      <g opacity=".15">
        <line x1="190" y1="20" x2="190" y2="30" stroke="#6875e0" strokeWidth=".8" />
        <line x1="190" y1="350" x2="190" y2="360" stroke="#6875e0" strokeWidth=".8" />
        <line x1="20" y1="190" x2="30" y2="190" stroke="#6875e0" strokeWidth=".8" />
        <line x1="350" y1="190" x2="360" y2="190" stroke="#6875e0" strokeWidth=".8" />
      </g>

      {/* Globe */}
      <circle cx="190" cy="190" r="135" fill="url(#cgsvg-globe)" />
      <circle cx="190" cy="190" r="137" fill="url(#cgsvg-atmo)" />

      {/* Clipped internals */}
      <g clipPath="url(#cgsvg-clip)">

        {/* Latitude grid */}
        {[
          { cy: 190, rx: 135, ry: 20, w: ".5" },
          { cy: 152, rx: 116, ry: 16, w: ".5" },
          { cy: 228, rx: 116, ry: 16, w: ".5" },
          { cy: 118, rx: 85,  ry: 12, w: ".4" },
          { cy: 262, rx: 85,  ry: 12, w: ".4" },
          { cy: 88,  rx: 45,  ry: 7,  w: ".3" },
          { cy: 292, rx: 45,  ry: 7,  w: ".3" },
        ].map(({ cy, rx, ry, w }, i) => (
          <ellipse key={`lat-${i}`} cx="190" cy={cy} rx={rx} ry={ry}
            fill="none" stroke="#181e48" strokeWidth={w} strokeDasharray="3 7" />
        ))}

        {/* Longitude grid */}
        {[0, 36, 72, 108, 144].map((deg, i) => (
          <ellipse key={`lon-${i}`} cx="190" cy="190" rx="24" ry="135"
            fill="none" stroke="#181e48" strokeWidth={i < 3 ? ".5" : ".4"} strokeDasharray={i < 3 ? "3 7" : "2 7"}
            transform={deg ? `rotate(${deg} 190 190)` : undefined} />
        ))}

        {/* Continent silhouettes */}
        <path d="M 98 125 Q 105 112 118 108 Q 130 105 138 110 Q 142 115 140 122 Q 138 130 130 138
                 Q 125 145 118 150 Q 112 155 105 152 Q 98 148 95 140 Q 92 132 95 128 Z"
              fill="#0e1638" opacity=".8" />
        <path d="M 128 195 Q 135 188 140 192 Q 145 198 143 208 Q 140 218 136 228
                 Q 133 238 128 242 Q 122 240 120 232 Q 118 222 120 212 Q 122 202 126 196 Z"
              fill="#0e1638" opacity=".75" />
        <path d="M 178 118 Q 188 112 198 114 Q 205 118 204 126 Q 200 132 194 135
                 Q 186 138 180 134 Q 174 128 175 122 Z"
              fill="#0e1638" opacity=".8" />
        <path d="M 195 148 Q 205 142 212 148 Q 218 155 218 168 Q 216 180 210 192
                 Q 205 202 198 208 Q 192 210 188 204 Q 185 195 186 185
                 Q 186 172 188 162 Q 190 152 193 148 Z"
              fill="#0e1638" opacity=".8" />
        <path d="M 225 118 Q 238 112 252 115 Q 262 120 268 130 Q 270 140 265 150
                 Q 258 158 248 160 Q 238 162 230 155 Q 222 148 220 138 Q 218 128 222 120 Z"
              fill="#0e1638" opacity=".75" />
        <path d="M 235 162 Q 242 158 248 162 Q 252 168 250 178 Q 246 186 240 190
                 Q 234 188 232 180 Q 230 172 233 164 Z"
              fill="#0e1638" opacity=".7" />
        <path d="M 268 220 Q 278 215 286 218 Q 290 224 288 232 Q 282 238 274 238
                 Q 266 236 264 228 Q 264 222 267 220 Z"
              fill="#0e1638" opacity=".65" />

        {/* Data flow arcs */}
        <g filter="url(#cgsvg-arc)">
          <path d="M 115 130 Q 148 95 192 122" fill="none" stroke="#5e6bff" strokeWidth="1" strokeDasharray="4 6" opacity=".5" className="cgsvg-df" />
          <path d="M 192 122 Q 225 95 252 128" fill="none" stroke="#5e6bff" strokeWidth="1" strokeDasharray="4 6" opacity=".5" className="cgsvg-df2" />
          <path d="M 252 128 Q 258 148 242 168" fill="none" stroke="#8a94f0" strokeWidth=".8" strokeDasharray="3 5" opacity=".35" className="cgsvg-df" />
          <path d="M 205 168 Q 215 158 228 148" fill="none" stroke="#8a94f0" strokeWidth=".7" strokeDasharray="2 6" opacity=".25" className="cgsvg-df2" />
          <path d="M 132 215 Q 100 175 115 130" fill="none" stroke="#8a94f0" strokeWidth=".6" strokeDasharray="2 6" opacity=".2" className="cgsvg-df" />
        </g>

        {/* Sweep line */}
        <g className="cgsvg-sweep">
          <path d="M 190 190 L 325 175 L 325 205 Z" fill="url(#cgsvg-scan)" opacity=".6" />
          <line x1="190" y1="190" x2="325" y2="190" stroke="#8a94f0" strokeWidth=".6" opacity=".3" />
        </g>

        {/* Emission hotspots */}
        <circle cx="250" cy="132" r="5" fill="#e63b2e" filter="url(#cgsvg-glow-r)" />
        <circle cx="250" cy="132" fill="none" stroke="#e63b2e" strokeWidth="1">
          <animate attributeName="r" values="6;18;6" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values=".6;0;.6" dur="3s" repeatCount="indefinite" />
        </circle>

        <circle cx="115" cy="130" r="4.5" fill="#e65530" filter="url(#cgsvg-glow-r)" />
        <circle cx="115" cy="130" fill="none" stroke="#e65530" strokeWidth=".9">
          <animate attributeName="r" values="5;16;5" dur="3.4s" repeatCount="indefinite" begin=".6s" />
          <animate attributeName="opacity" values=".5;0;.5" dur="3.4s" repeatCount="indefinite" begin=".6s" />
        </circle>

        <circle cx="192" cy="122" r="4" fill="#d97030" filter="url(#cgsvg-glow-r)" />
        <circle cx="192" cy="122" fill="none" stroke="#d97030" strokeWidth=".8">
          <animate attributeName="r" values="4;14;4" dur="3.6s" repeatCount="indefinite" begin="1.2s" />
          <animate attributeName="opacity" values=".45;0;.45" dur="3.6s" repeatCount="indefinite" begin="1.2s" />
        </circle>

        <circle cx="242" cy="168" r="3.5" fill="#d97030" filter="url(#cgsvg-glow-r)" />
        <circle cx="242" cy="168" fill="none" stroke="#d97030" strokeWidth=".7">
          <animate attributeName="r" values="3;12;3" dur="3.8s" repeatCount="indefinite" begin="1.8s" />
          <animate attributeName="opacity" values=".4;0;.4" dur="3.8s" repeatCount="indefinite" begin="1.8s" />
        </circle>

        <circle cx="228" cy="148" r="2.8" fill="#c98a30" />
        <circle cx="228" cy="148" fill="none" stroke="#c98a30" strokeWidth=".6">
          <animate attributeName="r" values="3;10;3" dur="4s" repeatCount="indefinite" begin="1s" />
          <animate attributeName="opacity" values=".35;0;.35" dur="4s" repeatCount="indefinite" begin="1s" />
        </circle>

        <circle cx="132" cy="215" r="2.5" fill="#c98a30" />
        <circle cx="132" cy="215" fill="none" stroke="#c98a30" strokeWidth=".5">
          <animate attributeName="r" values="2;9;2" dur="4.2s" repeatCount="indefinite" begin="2.4s" />
          <animate attributeName="opacity" values=".3;0;.3" dur="4.2s" repeatCount="indefinite" begin="2.4s" />
        </circle>

        <circle cx="278" cy="228" r="2" fill="#b08830" />

        {/* CO2 particles */}
        {([
          { cx: 140, cy: 170, fill: "#3d9e5e", dur: "5s",   delay: "0s",   op: ".5",  r: "1.2", dy: 20 },
          { cx: 230, cy: 178, fill: "#3d9e5e", dur: "4.5s", delay: "1.5s", op: ".4",  r: "1",   dy: 18 },
          { cx: 190, cy: 155, fill: "#3d9e5e", dur: "5.5s", delay: "3s",   op: ".35", r: "1",   dy: 17 },
          { cx: 108, cy: 148, fill: "#4a5adc", dur: "5s",   delay: "1s",   op: ".3",  r: ".8",  dy: 16 },
          { cx: 262, cy: 155, fill: "#4a5adc", dur: "4.8s", delay: "2.2s", op: ".3",  r: ".8",  dy: 15 },
        ] as const).map(({ cx, cy, fill, dur, delay, op, r, dy }, i) => (
          <circle key={`p-${i}`} cx={cx} cy={cy} r={Number(r)} fill={fill}>
            <animate attributeName="cy" values={`${cy};${cy - dy};${cy}`} dur={dur} repeatCount="indefinite" begin={delay} />
            <animate attributeName="opacity" values={`0;${op};0`} dur={dur} repeatCount="indefinite" begin={delay} />
          </circle>
        ))}
      </g>

      {/* Globe rim */}
      <circle cx="190" cy="190" r="135" fill="none" stroke="#4a5adc" strokeWidth="1.2" opacity=".3" filter="url(#cgsvg-rim)" />
      <circle cx="190" cy="190" r="136.5" fill="none" stroke="#8a94f0" strokeWidth=".3" opacity=".1" />

      {/* Region labels with connectors */}
      <line x1="112" y1="127" x2="55" y2="108" stroke="#555570" strokeWidth=".4" opacity=".5" />
      <circle cx="55" cy="108" r="1" fill="#555570" opacity=".5" />
      <text x="16" y="103" fill="#9090a0" fontSize="7" fontFamily="system-ui,sans-serif" fontWeight="600" letterSpacing=".05em">USA</text>
      <text x="16" y="113" fill="#e65530" fontSize="6.5" fontFamily="monospace" opacity=".7">5.2 t/cap</text>

      <line x1="253" y1="130" x2="318" y2="108" stroke="#555570" strokeWidth=".4" opacity=".5" />
      <circle cx="318" cy="108" r="1" fill="#555570" opacity=".5" />
      <text x="322" y="103" fill="#9090a0" fontSize="7" fontFamily="system-ui,sans-serif" fontWeight="600" letterSpacing=".05em">CHN</text>
      <text x="322" y="113" fill="#e63b2e" fontSize="6.5" fontFamily="monospace" opacity=".7">9.7 t/cap</text>

      <line x1="192" y1="118" x2="192" y2="66" stroke="#555570" strokeWidth=".4" opacity=".4" />
      <circle cx="192" cy="66" r="1" fill="#555570" opacity=".4" />
      <text x="178" y="60" fill="#9090a0" fontSize="7" fontFamily="system-ui,sans-serif" fontWeight="600" letterSpacing=".05em">EUR</text>
      <text x="178" y="70" fill="#d97030" fontSize="6.5" fontFamily="monospace" opacity=".6">3.8 t/cap</text>

      <line x1="244" y1="170" x2="305" y2="198" stroke="#555570" strokeWidth=".4" opacity=".4" />
      <circle cx="305" cy="198" r="1" fill="#555570" opacity=".4" />
      <text x="310" y="194" fill="#9090a0" fontSize="7" fontFamily="system-ui,sans-serif" fontWeight="600" letterSpacing=".05em">IND</text>
      <text x="310" y="204" fill="#d97030" fontSize="6.5" fontFamily="monospace" opacity=".6">1.9 t/cap</text>

      {/* Bottom legend */}
      <g opacity=".5">
        <text x="95" y="365" fill="#707080" fontSize="5.5" fontFamily="system-ui,sans-serif" letterSpacing=".08em">EMISSION INTENSITY</text>
        <circle cx="187" cy="363" r="2.5" fill="#c98a30" />
        <text x="192" y="365" fill="#707080" fontSize="5" fontFamily="monospace">LOW</text>
        <circle cx="218" cy="363" r="2.5" fill="#d97030" />
        <text x="223" y="365" fill="#707080" fontSize="5" fontFamily="monospace">MED</text>
        <circle cx="251" cy="363" r="2.5" fill="#e63b2e" />
        <text x="256" y="365" fill="#707080" fontSize="5" fontFamily="monospace">HIGH</text>
      </g>
    </svg>
  );
}
