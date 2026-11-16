import React from "react";
import {
  AbsoluteFill,
  Audio,
  Series,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { GeneratedScene } from "./GeneratedScenes";
import type { SceneSpec, VideoProps } from "./types";

const ChunkedSubtitle: React.FC<{ text: string; durationInFrames: number }> = ({
  text,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  const chunks: string[][] = [];
  for (let i = 0; i < words.length; i += 4) {
    chunks.push(words.slice(i, i + 4));
  }

  const framesPerChunk = Math.max(1, durationInFrames / chunks.length);
  const activeChunkIdx = Math.min(
    chunks.length - 1,
    Math.floor(frame / framesPerChunk)
  );
  const chunkWords = chunks[activeChunkIdx] || [];
  const chunkLocalProgress =
    (frame - activeChunkIdx * framesPerChunk) / framesPerChunk;
  const activeWordInChunk = Math.min(
    chunkWords.length - 1,
    Math.max(0, Math.floor(chunkLocalProgress * chunkWords.length))
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 120,
        left: 72,
        right: 72,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "10px 14px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.84)",
          padding: "18px 30px",
          borderRadius: 24,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px 14px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
        }}
      >
        {chunkWords.map((w, idx) => (
          <span
            key={idx}
            style={{
              fontFamily: "Montserrat, Inter, system-ui, sans-serif",
              fontSize: 44,
              fontWeight: 800,
              color: idx === activeWordInChunk ? "#FDE047" : "#FFFFFF",
              lineHeight: 1.25,
            }}
          >
            {w}
          </span>
        ))}
      </div>
    </div>
  );
};

const TopProgressBar: React.FC<{
  sceneIndex: number;
  totalScenes: number;
  durationInFrames: number;
}> = ({ sceneIndex, totalScenes, durationInFrames }) => {
  const frame = useCurrentFrame();
  const startPct = (sceneIndex / totalScenes) * 100;
  const endPct = ((sceneIndex + 1) / totalScenes) * 100;
  const widthPct = interpolate(frame, [0, durationInFrames], [startPct, endPct], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 44,
        left: 64,
        right: 64,
        height: 10,
        borderRadius: 999,
        backgroundColor: "rgba(148, 163, 184, 0.35)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${widthPct}%`,
          height: "100%",
          backgroundColor: "#2E6F40",
          borderRadius: 999,
        }}
      />
    </div>
  );
};

const SceneWrapper: React.FC<{
  scene: SceneSpec;
  sceneIndex: number;
  totalScenes: number;
  judulPendek: string;
}> = ({ scene, sceneIndex, totalScenes, judulPendek }) => {
  const frame = useCurrentFrame();
  const fadeIn =
    sceneIndex > 0
      ? interpolate(frame, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;
  const fadeOut =
    sceneIndex < totalScenes - 1
      ? interpolate(
          frame,
          [scene.durationInFrames - 8, scene.durationInFrames],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        )
      : 1;

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
      <GeneratedScene
        sceneIndex={sceneIndex}
        totalScenes={totalScenes}
        scene={scene}
        judulPendek={judulPendek}
      />
      <TopProgressBar
        sceneIndex={sceneIndex}
        totalScenes={totalScenes}
        durationInFrames={scene.durationInFrames}
      />
      <ChunkedSubtitle
        text={scene.narration}
        durationInFrames={scene.durationInFrames}
      />
      {scene.audioFile ? <Audio src={staticFile(scene.audioFile)} /> : null}
    </AbsoluteFill>
  );
};

export const MainVideo: React.FC<VideoProps> = ({ judul_pendek, scenes }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#F7F4EC" }}>
      <Series>
        {scenes.map((scene, idx) => (
          <Series.Sequence
            key={scene.id}
            durationInFrames={Math.max(30, scene.durationInFrames)}
          >
            <SceneWrapper
              scene={scene}
              sceneIndex={idx}
              totalScenes={scenes.length}
              judulPendek={judul_pendek}
            />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};
