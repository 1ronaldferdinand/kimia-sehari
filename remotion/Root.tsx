import React from "react";
import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import type { VideoProps } from "./types";

const DEFAULT_PROPS: VideoProps = {
  topik: "Mengapa Daun Berubah Warna Saat Musim Gugur?",
  judul_pendek: "Rahasia Warna Daun",
  scenes: [
    {
      id: 1,
      badge: "Kimia Sehari • Fakta Alam",
      narration: "Pernah penasaran kenapa daun hijau tiba-tiba berubah menjadi kuning dan merah menyala?",
      callouts: ["KLOROFIL", "KAROTENOID"],
      audioFile: "",
      durationInFrames: 150,
    },
    {
      id: 2,
      badge: "Mengamati Lebih Dekat",
      narration: "Saat sinar matahari berkurang, pohon menghentikan produksi pigmen hijau di dalam daun.",
      callouts: ["SINAR MATAHARI", "PIGMEN DAUN"],
      audioFile: "",
      durationInFrames: 150,
    },
    {
      id: 3,
      badge: "Zoom Mikroskop & Molekul",
      narration: "Molekul klorofil terurai perlahan, sehingga pigmen karotenoid kuning yang tersembunyi mulai terlihat.",
      callouts: ["TERURAI", "KAROTENOID"],
      audioFile: "",
      durationInFrames: 150,
    },
    {
      id: 4,
      badge: "Mekanisme Reaksi Kimia",
      narration: "Gula yang terperangkap di daun bereaksi membentuk antosianin yang memberi warna merah cerah.",
      callouts: ["GULA DAUN", "ANTOSIANIN"],
      audioFile: "",
      durationInFrames: 150,
    },
    {
      id: 5,
      badge: "Ringkasan Kimia Sehari",
      narration: "Begitulah cara kimia alami membantu pohon menghemat energi sebelum musim dingin tiba.",
      callouts: ["HEMAT ENERGI", "SIKLUS ALAM"],
      audioFile: "",
      durationInFrames: 150,
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="KimiaSehari"
      component={MainVideo as unknown as React.FC<Record<string, unknown>>}
      durationInFrames={750}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={DEFAULT_PROPS as unknown as Record<string, unknown>}
      calculateMetadata={({ props }) => {
        const typed = props as unknown as VideoProps;
        const total = (typed.scenes || []).reduce(
          (sum, s) => sum + Math.max(30, s.durationInFrames || 150),
          0
        );
        return { durationInFrames: Math.max(30, total) };
      }}
    />
  );
};
