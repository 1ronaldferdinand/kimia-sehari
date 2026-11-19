import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneRendererProps } from "./types";

const SCENE_PALETTES = [
  { bg: "#F7F4EC", accent: "#2E6F40", secondary: "#0284C7", dark: "#3B281E" },
  { bg: "#FAF8F3", accent: "#0284C7", secondary: "#F59E0B", dark: "#3B281E" },
  { bg: "#F5F2EB", accent: "#2E6F40", secondary: "#0284C7", dark: "#3B281E" },
  { bg: "#F7F4EC", accent: "#D97706", secondary: "#2E6F40", dark: "#3B281E" },
  { bg: "#FAF8F3", accent: "#2E6F40", secondary: "#6D4C41", dark: "#3B281E" },
];

/** Default animated Remotion scene used directly or as fallback if generated TSX fails typecheck. */
export const GeneratedScene: React.FC<SceneRendererProps> = ({
  sceneIndex,
  totalScenes,
  scene,
  judulPendek,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = SCENE_PALETTES[sceneIndex % SCENE_PALETTES.length];
  const isDark = false;

  const badgeSpring = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const titleSpring = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 15, stiffness: 110 },
  });
  const cardSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 14, stiffness: 95 },
  });

  const orbitAngle = (frame / fps) * 32;
  const pulse = 1 + Math.sin((frame / fps) * 3.2) * 0.05;
  const floatY = Math.sin((frame / fps) * 2.4) * 14;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.bg,
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "96px 56px 280px",
      }}
    >
      {/* Badge */}
      <div
        style={{
          backgroundColor: palette.accent,
          color: "#FFFFFF",
          padding: "12px 30px",
          borderRadius: 999,
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          transform: `translateY(${interpolate(badgeSpring, [0, 1], [-32, 0])}px)`,
          opacity: badgeSpring,
        }}
      >
        {sceneIndex + 1}/{totalScenes} • {scene.badge}
      </div>

      {/* Title */}
      <div
        style={{
          marginTop: 22,
          color: palette.dark,
          fontSize: 46,
          fontWeight: 900,
          textAlign: "center",
          lineHeight: 1.18,
          transform: `translateY(${interpolate(titleSpring, [0, 1], [28, 0])}px)`,
          opacity: titleSpring,
        }}
      >
        {judulPendek}
      </div>

      {/* Animated Molecular Stage */}
      <div
        style={{
          marginTop: 40,
          width: 920,
          height: 980,
          borderRadius: 44,
          backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
          border: `6px solid ${isDark ? "#334155" : "#FFFFFF"}`,
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.14)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${interpolate(cardSpring, [0, 1], [0.92, 1])})`,
          opacity: cardSpring,
        }}
      >
        <svg width="920" height="980" viewBox="0 0 920 980">
          <g transform={`translate(460, ${460 + floatY})`}>
            <circle
              r={250}
              fill="none"
              stroke={palette.accent}
              strokeWidth={4}
              strokeDasharray="16 14"
              transform={`rotate(${orbitAngle})`}
            />
            <circle
              r={160}
              fill="none"
              stroke={palette.secondary}
              strokeWidth={3}
              strokeDasharray="10 10"
              transform={`rotate(${-orbitAngle * 1.4})`}
            />
            <circle r={82 * pulse} fill={palette.accent} opacity={0.92} />
            <circle
              cx={Math.cos((orbitAngle * Math.PI) / 180) * 250}
              cy={Math.sin((orbitAngle * Math.PI) / 180) * 250}
              r={34}
              fill={palette.secondary}
            />
            <circle
              cx={Math.cos(((orbitAngle + 140) * Math.PI) / 180) * 160}
              cy={Math.sin(((orbitAngle + 140) * Math.PI) / 180) * 160}
              r={26}
              fill="#F59E0B"
            />
          </g>
        </svg>

        {/* Staggered Callout Pills */}
        <div
          style={{
            position: "absolute",
            bottom: 44,
            left: 40,
            right: 40,
            display: "flex",
            justifyContent: "center",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          {(scene.callouts || []).slice(0, 3).map((label, i) => {
            const p = spring({
              frame: Math.max(0, frame - 18 - i * 10),
              fps,
              config: { damping: 14, stiffness: 120 },
            });
            return (
              <div
                key={i}
                style={{
                  backgroundColor: i % 2 === 0 ? palette.accent : palette.secondary,
                  color: "#FFFFFF",
                  padding: "14px 26px",
                  borderRadius: 999,
                  fontSize: 22,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  transform: `translateY(${interpolate(p, [0, 1], [24, 0])}px)`,
                  opacity: p,
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
