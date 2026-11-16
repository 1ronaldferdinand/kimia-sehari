import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from 'remotion';
import type { SceneRendererProps } from './types';

export const GeneratedScene: React.FC<SceneRendererProps> = ({
  sceneIndex,
  scene,
  judulPendek,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const contentOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const pulse = Math.sin(frame * 0.08) * 6;
  const rotFloat = Math.sin(frame * 0.04) * 5;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f1f17',
        color: '#f0fbf4',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Latar Belakang Gradasi Dinamis Kebun */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: -150,
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(62,142,65,0.25) 0%, rgba(15,31,23,0) 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 200,
          right: -100,
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,125,50,0.2) 0%, rgba(15,31,23,0) 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Area Header (Di bawah safe zone 80px) */}
      <div
        style={{
          position: 'absolute',
          top: 96,
          left: 56,
          right: 56,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        <div
          style={{
            backgroundColor: '#2e7d32',
            color: '#e8f5e9',
            padding: '10px 24px',
            borderRadius: 999,
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            transform: `scale(${badgeSpring})`,
            boxShadow: '0 8px 24px rgba(46, 125, 50, 0.4)',
          }}
        >
          {scene.badge}
        </div>
        <div
          style={{
            fontSize: 24,
            color: '#a5d6a7',
            fontWeight: 600,
            letterSpacing: '0.04em',
            maxWidth: 480,
            textAlign: 'right',
          }}
        >
          {judulPendek}
        </div>
      </div>

      {/* Konten Utama Motion Graphics */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          bottom: 340,
          left: 56,
          right: 56,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: contentOpacity,
          zIndex: 10,
        }}
      >
        {/* SCENE 0: Hook Apel Kebun Berubah Cokelat */}
        {sceneIndex === 0 && (
          <svg viewBox="0 0 600 600" style={{ width: '85%', maxHeight: '60%' }}>
            {/* Efek Meja Kayu Kebun */}
            <rect x="50" y="460" width="500" height="30" rx="15" fill="#3e2723" />
            <ellipse cx="300" cy="465" rx="220" ry="18" fill="#1b110e" opacity="0.6" />

            {/* Irisan Apel */}
            <g transform={`rotate(${rotFloat}, 300, 310)`}>
              {/* Daging Apel Kiri (Segar) */}
              <path
                d="M 300 130 C 230 130, 160 200, 160 310 C 160 410, 240 450, 300 450 Z"
                fill="#fffde7"
                stroke="#c0ca33"
                strokeWidth="8"
              />
              {/* Kulit Apel Merah Segar */}
              <path
                d="M 300 130 C 210 130, 140 210, 140 310 C 140 410, 220 460, 300 460"
                fill="none"
                stroke="#c62828"
                strokeWidth="18"
                strokeLinecap="round"
              />

              {/* Daging Apel Kanan (Pencokelatan Bertahap) */}
              {
                (() => {
                  const brownProgress = interpolate(frame, [15, 80], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  });
                  const fillCol = interpolate(brownProgress, [0, 1], [0, 1]);
                  const r = Math.round(255 - fillCol * (255 - 160));
                  const g = Math.round(253 - fillCol * (253 - 100));
                  const b = Math.round(231 - fillCol * (231 - 50));
                  return (
                    <path
                      d="M 300 130 C 370 130, 440 200, 440 310 C 440 410, 360 450, 300 450 Z"
                      fill={`rgb(${r}, ${g}, ${b})`}
                      stroke="#a1887f"
                      strokeWidth="8"
                    />
                  );
                })()
              }
              {/* Kulit Kanan */}
              <path
                d="M 300 130 C 390 130, 460 210, 460 310 C 460 410, 380 460, 300 460"
                fill="none"
                stroke="#8e0000"
                strokeWidth="18"
                strokeLinecap="round"
              />

              {/* Biji Apel & Tangkai */}
              <path d="M 300 130 Q 300 70, 330 50" stroke="#4e342e" strokeWidth="10" fill="none" strokeLinecap="round" />
              <ellipse cx="285" cy="310" rx="8" ry="16" fill="#3e2723" transform="rotate(15, 285, 310)" />
              <ellipse cx="315" cy="310" rx="8" ry="16" fill="#3e2723" transform="rotate(-15, 315, 310)" />
            </g>

            {/* Partikel Udara Masuk */}
            <circle cx={480 + pulse} cy={220} r="16" fill="#81d4fa" opacity="0.8" />
            <circle cx={520} cy={280 + pulse} r="12" fill="#81d4fa" opacity="0.7" />
            <text x="480" y="226" fill="#01579b" fontSize="14" fontWeight="bold" textAnchor="middle">O₂</text>
            <text x="520" y="285" fill="#01579b" fontSize="12" fontWeight="bold" textAnchor="middle">O₂</text>
          </svg>
        )}

        {/* SCENE 1: Irisan Memotong & Sel Pecah */}
        {sceneIndex === 1 && (
          <svg viewBox="0 0 600 600" style={{ width: '85%', maxHeight: '60%' }}>
            {/* Pisau Masuk Memotong */}
            {
              (() => {
                const knifeY = interpolate(frame, [0, 30], [-120, 40], {
                  easing: Easing.out(Easing.quad),
                  extrapolateRight: 'clamp',
                });
                return (
                  <g transform={`translate(280, ${knifeY})`}>
                    <path d="M 0 0 L 40 0 L 20 280 Z" fill="#cfd8dc" stroke="#90a4ae" strokeWidth="4" />
                    <line x1="20" y1="0" x2="20" y2="270" stroke="#ffffff" strokeWidth="6" />
                  </g>
                );
              })()
            }

            {/* Dinding Sel Rusak */}
            <g transform="translate(50, 260)">
              {/* Vakuola & Sitoplasma Meluap */}
              <polygon points="120,60 200,30 250,90 220,170 140,160" fill="#2e7d32" stroke="#81c784" strokeWidth="6" opacity="0.7" />
              <polygon points="270,40 350,20 380,100 330,170 260,130" fill="#c62828" stroke="#ef9a9a" strokeWidth="6" opacity="0.6" />
              <circle cx="240" cy="150" r="35" fill="#ffb74d" opacity="0.85" />
              <text x="240" y="156" fill="#4e342e" fontSize="18" fontWeight="bold" textAnchor="middle">Fenol</text>
              <circle cx="350" cy="120" r="30" fill="#81c784" opacity="0.85" />
              <text x="350" y="126" fill="#1b5e20" fontSize="16" fontWeight="bold" textAnchor="middle">Enzim</text>
            </g>

            {/* Tanda Peringatan Kontak Udara */}
            <g transform="translate(150, 420)">
              <rect x="0" y="0" width="300" height="60" rx="30" fill="#d32f2f" opacity="0.9" />
              <text x="150" y="38" fill="#ffffff" fontSize="22" fontWeight="bold" textAnchor="middle">KOMPARTEMEN SEL LEPAS</text>
            </g>
          </svg>
        )}

        {/* SCENE 2: Level Enzim & Oksigen Berinteraksi */}
        {sceneIndex === 2 && (
          <svg viewBox="0 0 600 600" style={{ width: '85%', maxHeight: '60%' }}>
            {/* Enzim PPO (Bentuk Globular dengan Active Site) */}
            <g transform={`translate(160, 220) scale(1.1)`}>
              <path
                d="M 60 40 C 130 0, 220 30, 230 110 C 240 180, 190 250, 110 240 C 40 230, 0 160, 20 100 Z"
                fill="#2e7d32"
                stroke="#66bb6a"
                strokeWidth="8"
              />
              {/* Kantung Aktif (Active Site Enzim) */}
              <path d="M 90 90 Q 140 130, 160 80" fill="none" stroke="#a5d6a7" strokeWidth="12" strokeLinecap="round" />
              {/* Ion Tembaga Tembus Inti Enzim Cu2+ */}
              <circle cx="110" cy="120" r="16" fill="#ffb300" />
              <text x="110" y="126" fill="#3e2723" fontSize="13" fontWeight="bold" textAnchor="middle">Cu²⁺</text>
              <circle cx="145" cy="110" r="16" fill="#ffb300" />
              <text x="145" y="116" fill="#3e2723" fontSize="13" fontWeight="bold" textAnchor="middle">Cu²⁺</text>
              <text x="130" y="200" fill="#ffffff" fontSize="24" fontWeight="bold" textAnchor="middle">ENZIM PPO</text>
            </g>

            {/* Oksigen Terbang Menuju Kantung Aktif */}
            {
              (() => {
                const oxTravel = interpolate(frame % 45, [0, 45], [0, 1]);
                const oxX = interpolate(oxTravel, [0, 1], [460, 290]);
                const oxY = interpolate(oxTravel, [0, 1], [150, 300]);
                return (
                  <g transform={`translate(${oxX}, ${oxY})`}>
                    <circle cx="0" cy="0" r="28" fill="#0288d1" stroke="#b3e5fc" strokeWidth="4" />
                    <text x="0" y="8" fill="#ffffff" fontSize="22" fontWeight="bold" textAnchor="middle">O₂</text>
                  </g>
                );
              })()
            }

            {/* Molekul Fenol Mendekat */}
            {
              (() => {
                const phTravel = interpolate((frame + 20) % 45, [0, 45], [0, 1]);
                const phX = interpolate(phTravel, [0, 1], [100, 250]);
                const phY = interpolate(phTravel, [0, 1], [480, 360]);
                return (
                  <g transform={`translate(${phX}, ${phY})`}>
                    <polygon points="0,-25 22,-12 22,12 0,25 -22,12 -22,-12" fill="#e65100" stroke="#ffcc80" strokeWidth="4" />
                    <text x="0" y="6" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">Fenol</text>
                  </g>
                );
              })()
            }
          </svg>
        )}

        {/* SCENE 3: Mekanisme Kimia (Fenol + O2 -> Kuinon -> Melanin Cokelat) */}
        {sceneIndex === 3 && (
          <svg viewBox="0 0 600 600" style={{ width: '90%', maxHeight: '65%' }}>
            {/* Senyawa A: Polifenol */}
            <g transform="translate(50, 220)">
              <polygon points="40,0 75,20 75,60 40,80 5,60 5,20" fill="none" stroke="#81c784" strokeWidth="6" />
              <text x="40" y="46" fill="#c8e6c9" fontSize="18" fontWeight="bold" textAnchor="middle">-OH</text>
              <text x="40" y="120" fill="#a5d6a7" fontSize="20" fontWeight="bold" textAnchor="middle">Polifenol</text>
            </g>

            {/* Tanda Tambah + Oksigen */}
            <text x="165" y="265" fill="#ffffff" fontSize="36" fontWeight="bold">+</text>
            <g transform="translate(210, 220)">
              <circle cx="35" cy="40" r="32" fill="#0288d1" stroke="#81d4fa" strokeWidth="4" />
              <text x="35" y="47" fill="#ffffff" fontSize="20" fontWeight="bold" textAnchor="middle">O₂</text>
              <text x="35" y="120" fill="#81d4fa" fontSize="20" fontWeight="bold" textAnchor="middle">Oksigen</text>
            </g>

            {/* Panah Katalisis Enzim */}
            <g transform="translate(310, 250)">
              <line x1="0" y1="0" x2="50" y2="0" stroke="#ffd54f" strokeWidth="8" strokeLinecap="round" />
              <polygon points="50,-12 70,0 50,12" fill="#ffd54f" />
              <text x="35" y="-20" fill="#ffecb3" fontSize="16" fontWeight="bold" textAnchor="middle">PPO</text>
            </g>

            {/* Senyawa B: Kuinon Cokelat */}
            <g transform="translate(420, 220)">
              <polygon points="45,0 80,20 80,60 45,80 10,60 10,20" fill="#bf360c" stroke="#ffab91" strokeWidth="6" />
              <text x="45" y="46" fill="#ffffff" fontSize="18" fontWeight="bold" textAnchor="middle">=O</text>
              <text x="45" y="120" fill="#ffab91" fontSize="20" fontWeight="bold" textAnchor="middle">Kuinon</text>
            </g>

            {/* Polimerisasi Menjadi Melanin Cokelat */}
            <g transform="translate(80, 420)">
              <rect x="0" y="0" width="440" height="75" rx="20" fill="#4e342e" stroke="#8d6e63" strokeWidth="5" />
              <text x="220" y="38" fill="#ffe0b2" fontSize="22" fontWeight="bold" textAnchor="middle">POLIMERISASI BERANTAI</text>
              <text x="220" y="62" fill="#d7ccc8" fontSize="17" textAnchor="middle">Membentuk Pigmen Melanin Cokelat</text>
            </g>
          </svg>
        )}

        {/* SCENE 4: Solusi Nyata & Pencegahan di Dapur */}
        {sceneIndex === 4 && (
          <svg viewBox="0 0 600 600" style={{ width: '85%', maxHeight: '60%' }}>
            {/* Lemon Meneteskan Asam Askorbat (Vitamin C) */}
            <g transform="translate(130, 100)">
              {/* Irisan Jeruk Nipis */}
              <circle cx="90" cy="90" r="80" fill="#c0ca33" stroke="#f0f4c3" strokeWidth="8" />
              <circle cx="90" cy="90" r="65" fill="#afb42b" />
              {/* Segmen Lemon */}
              <line x1="90" y1="25" x2="90" y2="155" stroke="#f0f4c3" strokeWidth="4" />
              <line x1="25" y1="90" x2="155" y2="90" stroke="#f0f4c3" strokeWidth="4" />
              <text x="90" y="190" fill="#f9fbe7" fontSize="22" fontWeight="bold" textAnchor="middle">Asam Sitrat / Vit C</text>
            </g>

            {/* Tetesan Asam Menghambat PPO */}
            {
              (() => {
                const dropY = interpolate(frame % 30, [0, 30], [200, 330]);
                return (
                  <path
                    d={`M 220 ${dropY} C 210 ${dropY + 20}, 230 ${dropY + 20}, 220 ${dropY} Z`}
                    fill="#eeff41"
                  />
                );
              })()
            }

            {/* Simbol Perisai Proteksi */}
            <g transform="translate(350, 160)">
              <path
                d="M 80 20 L 150 50 L 150 150 C 150 210, 80 250, 80 250 C 80 250, 10 210, 10 150 L 10 50 Z"
                fill="#1b5e20"
                stroke="#81c784"
                strokeWidth="8"
              />
              {/* Ikon Enzim Terkunci / Nonaktif */}
              <line x1="45" y1="85" x2="115" y2="165" stroke="#ff5252" strokeWidth="10" strokeLinecap="round" />
              <line x1="115" y1="85" x2="45" y2="165" stroke="#ff5252" strokeWidth="10" strokeLinecap="round" />
              <text x="80" y="285" fill="#a5d6a7" fontSize="20" fontWeight="bold" textAnchor="middle">Enzim Dinonaktifkan</text>
            </g>

            {/* Banner Hasil: Segar Tahan Lama */}
            <g transform="translate(80, 470)">
              <rect x="0" y="0" width="440" height="60" rx="30" fill="#2e7d32" opacity="0.9" />
              <text x="220" y="38" fill="#ffffff" fontSize="24" fontWeight="bold" textAnchor="middle">✓ APEL TETAP SEGAR & CERAH</text>
            </g>
          </svg>
        )}

        {/* Callouts Beranimasi (Pill Tag) */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            marginTop: 30,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {scene.callouts.map((text, idx) => {
            const tagDelay = 10 + idx * 8;
            const tagSpring = spring({
              frame: Math.max(0, frame - tagDelay),
              fps,
              config: { damping: 12, stiffness: 100 },
            });
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '2px solid rgba(165, 214, 167, 0.6)',
                  color: '#e8f5e9',
                  padding: '12px 32px',
                  borderRadius: 999,
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  transform: `scale(${tagSpring})`,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                }}
              >
                {text}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
