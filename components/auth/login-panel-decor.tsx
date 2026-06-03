"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function LoginPanelDecor({ className }: { className?: string }) {
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  return (
    <div
      className={cn("login-panel-decor relative overflow-hidden", className)}
      aria-hidden
    >
      <svg
        viewBox="0 0 480 100"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        className="h-[100px] w-full"
      >
        <defs>
          <pattern
            id="manifest-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeOpacity="0.04"
            />
          </pattern>
        </defs>

        {/* Structural Grid Background */}
        <rect width="480" height="100" fill="url(#manifest-grid)" />

        {/* Form / Data Blocks Abstraction (representing declarations/ledgers) */}
        <g>
          <rect x="20" y="20" width="140" height="8" fill="currentColor" fillOpacity="0.08" className={!reduced ? "login-panel-decor-slide" : undefined} style={{ animationDelay: '0.2s' }} />
          <rect x="20" y="34" width="80" height="4" fill="currentColor" fillOpacity="0.05" className={!reduced ? "login-panel-decor-slide" : undefined} style={{ animationDelay: '0.3s' }} />
          <rect x="108" y="34" width="52" height="4" fill="currentColor" fillOpacity="0.05" className={!reduced ? "login-panel-decor-slide" : undefined} style={{ animationDelay: '0.4s' }} />
          
          <g className={!reduced ? "login-panel-decor-slide" : undefined} style={{ animationDelay: '0.5s' }}>
            <rect x="20" y="54" width="200" height="24" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.1" />
            <line x1="20" y1="66" x2="220" y2="66" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.05" />
            <line x1="120" y1="54" x2="120" y2="78" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.05" />
          </g>
        </g>

        {/* Dynamic Route / Progress lines */}
        <g>
          <line
            x1="260"
            y1="24"
            x2="440"
            y2="24"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.15"
            className={!reduced ? "login-panel-decor-draw" : undefined}
          />
          <circle cx="260" cy="24" r="2.5" fill="currentColor" fillOpacity="0.3" className={!reduced ? "login-panel-decor-dot" : undefined} />
          <circle cx="350" cy="24" r="2.5" fill="currentColor" fillOpacity="0.3" className={!reduced ? "login-panel-decor-dot" : undefined} style={!reduced ? { animationDelay: '0.6s' } : undefined} />
          <circle cx="440" cy="24" r="2.5" fill="currentColor" fillOpacity="0.3" className={!reduced ? "login-panel-decor-dot" : undefined} style={!reduced ? { animationDelay: '0.7s' } : undefined} />
        </g>

        {/* Abstract Barcode (Customs / Freight scanning) */}
        <g className={!reduced ? "login-panel-decor-fade" : undefined} style={!reduced ? { animationDelay: '0.8s' } : undefined}>
          {[
            { x: 380, w: 2 }, { x: 384, w: 1 }, { x: 387, w: 3 }, { x: 392, w: 1 },
            { x: 395, w: 2 }, { x: 399, w: 1 }, { x: 402, w: 4 }, { x: 408, w: 1 },
            { x: 411, w: 2 }, { x: 415, w: 1 }, { x: 418, w: 2 }, { x: 422, w: 3 },
            { x: 427, w: 1 }, { x: 430, w: 2 }, { x: 434, w: 4 }, { x: 440, w: 1 }
          ].map((bar, i) => (
            <rect
              key={i}
              x={bar.x}
              y="54"
              width={bar.w}
              height="24"
              fill="currentColor"
              fillOpacity="0.15"
            />
          ))}
          
          {/* Scanning Laser Line */}
          {!reduced && (
            <line 
              x1="376" y1="52" x2="376" y2="80" 
              stroke="currentColor" strokeWidth="1" strokeOpacity="0.5"
              className="login-panel-decor-scan"
            />
          )}

          <text
            x="380"
            y="90"
            className="fill-background/30 font-mono text-[8px] tracking-widest"
            style={{ fontFamily: "var(--font-sans-flex), system-ui, sans-serif" }}
          >
            SYS-RDY
          </text>
        </g>
      </svg>
    </div>
  );
}
