/**
 * SmokeBackground — lightweight ambient mist using CSS-only techniques.
 * Each wisp is an absolutely-positioned div with a radial gradient,
 * CSS blur, and transform animation. All per-frame work is GPU-composited
 * (transform + opacity only). Zero SVG filters, zero JS per-frame cost.
 *
 * Respects prefers-reduced-motion via Tailwind's motion-reduce variant.
 */

const wisps = [
  // Deep background — large, very blurred, slow
  { cx: "-5%",  cy: "-5%",  w: "50vw", h: "22vw", bg: "rgba(94,107,255,0.07)",  blur: "80px",  anim: "sm-d1 40s ease-in-out infinite alternate" },
  { cx: "55%",  cy: "-8%",  w: "45vw", h: "20vw", bg: "rgba(190,194,255,0.05)", blur: "90px",  anim: "sm-d2 45s ease-in-out infinite alternate" },
  { cx: "60%",  cy: "65%",  w: "50vw", h: "24vw", bg: "rgba(190,194,255,0.05)", blur: "85px",  anim: "sm-d1 38s ease-in-out infinite alternate" },
  { cx: "-8%",  cy: "70%",  w: "42vw", h: "20vw", bg: "rgba(94,107,255,0.06)",  blur: "80px",  anim: "sm-d2 42s ease-in-out infinite alternate" },
  { cx: "25%",  cy: "35%",  w: "40vw", h: "18vw", bg: "rgba(34,197,94,0.035)",  blur: "75px",  anim: "sm-d3 35s ease-in-out infinite alternate" },

  // Mid tendrils — elongated, moderate blur, organic rotation
  { cx: "5%",   cy: "12%",  w: "35vw", h: "8vw",  bg: "rgba(94,107,255,0.07)",  blur: "45px",  anim: "sm-t1 22s ease-in-out infinite alternate" },
  { cx: "50%",  cy: "55%",  w: "32vw", h: "7vw",  bg: "rgba(190,194,255,0.06)", blur: "40px",  anim: "sm-t2 26s ease-in-out infinite alternate" },
  { cx: "30%",  cy: "30%",  w: "28vw", h: "6vw",  bg: "rgba(94,107,255,0.055)", blur: "38px",  anim: "sm-t3 20s ease-in-out infinite alternate" },
  { cx: "15%",  cy: "75%",  w: "30vw", h: "7vw",  bg: "rgba(190,194,255,0.05)", blur: "42px",  anim: "sm-t4 28s ease-in-out infinite alternate" },
  { cx: "65%",  cy: "20%",  w: "25vw", h: "6vw",  bg: "rgba(34,197,94,0.04)",   blur: "35px",  anim: "sm-t1 24s ease-in-out infinite alternate" },

  // Foreground wisps — smaller, less blur, faster
  { cx: "12%",  cy: "22%",  w: "18vw", h: "4vw",  bg: "rgba(94,107,255,0.08)",  blur: "22px",  anim: "sm-w1 14s ease-in-out infinite alternate" },
  { cx: "60%",  cy: "45%",  w: "15vw", h: "3.5vw",bg: "rgba(190,194,255,0.07)", blur: "20px",  anim: "sm-w2 16s ease-in-out infinite alternate" },
  { cx: "35%",  cy: "65%",  w: "20vw", h: "4.5vw",bg: "rgba(34,197,94,0.05)",   blur: "25px",  anim: "sm-w3 18s ease-in-out infinite alternate" },
] as const;

export default function SmokeBackground() {
  return (
    <>
      <style>{`
        @keyframes sm-d1 {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); }
          50%  { transform: translate(3vw,1.5vw) rotate(2deg) scale(1.06); }
          100% { transform: translate(5vw,-1vw) rotate(-1deg) scale(1.03); }
        }
        @keyframes sm-d2 {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); }
          50%  { transform: translate(-3vw,-1.5vw) rotate(-2deg) scale(1.08); }
          100% { transform: translate(-5vw,1vw) rotate(1deg) scale(0.98); }
        }
        @keyframes sm-d3 {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); }
          50%  { transform: translate(2vw,-2vw) rotate(3deg) scale(0.94); }
          100% { transform: translate(-1vw,2vw) rotate(-2deg) scale(1.05); }
        }
        @keyframes sm-t1 {
          0%   { transform: translate(0,0) rotate(-4deg) scaleX(1); }
          50%  { transform: translate(4vw,1vw) rotate(6deg) scaleX(1.15); }
          100% { transform: translate(6vw,-0.5vw) rotate(10deg) scaleX(1.05); }
        }
        @keyframes sm-t2 {
          0%   { transform: translate(0,0) rotate(2deg) scaleX(1); }
          50%  { transform: translate(-3vw,-1.5vw) rotate(-6deg) scaleX(1.2); }
          100% { transform: translate(-5vw,1vw) rotate(-10deg) scaleX(0.9); }
        }
        @keyframes sm-t3 {
          0%   { transform: translate(0,0) rotate(0deg) scaleX(1); }
          50%  { transform: translate(-2vw,2vw) rotate(8deg) scaleX(1.15); }
          100% { transform: translate(2vw,-1vw) rotate(-5deg) scaleX(0.92); }
        }
        @keyframes sm-t4 {
          0%   { transform: translate(0,0) rotate(-2deg) scaleX(1); }
          50%  { transform: translate(4vw,-1vw) rotate(5deg) scaleX(1.1); }
          100% { transform: translate(1vw,2vw) rotate(-6deg) scaleX(1.12); }
        }
        @keyframes sm-w1 {
          0%   { transform: translate(0,0) rotate(-6deg); opacity:0.6; }
          50%  { transform: translate(3vw,1vw) rotate(5deg); opacity:1; }
          100% { transform: translate(5vw,-0.5vw) rotate(12deg); opacity:0.7; }
        }
        @keyframes sm-w2 {
          0%   { transform: translate(0,0) rotate(4deg); opacity:0.7; }
          50%  { transform: translate(-2vw,-1.5vw) rotate(-8deg); opacity:1; }
          100% { transform: translate(-4vw,0.5vw) rotate(6deg); opacity:0.5; }
        }
        @keyframes sm-w3 {
          0%   { transform: translate(0,0) rotate(0deg); opacity:0.5; }
          50%  { transform: translate(2.5vw,-1.5vw) rotate(-6deg); opacity:0.9; }
          100% { transform: translate(-1vw,1vw) rotate(8deg); opacity:0.6; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sm-wisp { animation: none !important; }
        }
      `}</style>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {wisps.map((w, i) => (
          <div
            key={i}
            className="sm-wisp absolute rounded-full will-change-transform"
            style={{
              left: w.cx,
              top: w.cy,
              width: w.w,
              height: w.h,
              background: `radial-gradient(ellipse at center, ${w.bg} 0%, transparent 70%)`,
              filter: `blur(${w.blur})`,
              animation: w.anim,
            }}
          />
        ))}
      </div>
    </>
  );
}
