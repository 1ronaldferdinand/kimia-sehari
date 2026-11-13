const DAILY_CATEGORIES = [
  "reaksi kimia saat memasak atau memanggang di dapur",
  "senyawa aromatik pada tumbuhan, bunga, atau rempah Nusantara",
  "kimia atmosfer, awan, hujan, dan fenomena cuaca",
  "proses fermentasi tradisional dan mikroorganisme pangan",
  "pigmen warna alami pada daun, buah, atau bunga",
  "kimia air, mineral tanah, batuan, dan lautan",
  "reaksi biokimia sederhana di tubuh manusia sehari-hari",
  "cara kerja sabun, pembersih alami, dan emulsi minyak-air",
  "proses oksidasi, perkaratan, atau perubahan warna potongan buah",
  "polimer alami seperti selulosa kayu, karet alam, dan pati",
  "kimia minuman sehari-hari seperti kopi, teh, dan coklat",
  "pertahanan kimia alami pada serangga atau tanaman",
];

const DAILY_ANGLES = [
  "fenomena pagi hari",
  "benda di meja makan",
  "kejadian di kebun atau halaman rumah",
  "perubahan suhu panas ke dingin",
  "interaksi cahaya matahari dengan materi",
  "aroma khas yang sering kita cium",
  "perubahan tekstur dari keras menjadi lunak",
  "reaksi asam dan basa alami",
  "peran enzim dalam mempercepat reaksi",
  "ikatan molekul yang melindungi permukaan benda",
];

function getDailyFocus(date = new Date()) {
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const dayOfYear = Math.floor((date - startOfYear) / 86_400_000);
  const category = DAILY_CATEGORIES[dayOfYear % DAILY_CATEGORIES.length];
  const angle =
    DAILY_ANGLES[
      Math.floor(dayOfYear / DAILY_CATEGORIES.length + date.getUTCDate()) %
        DAILY_ANGLES.length
    ];
  return {
    dateStr: date.toISOString().slice(0, 10),
    category,
    angle,
  };
}

function escapeXml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pill(x, y, text, bg = "#2E6F40", width = 300, cls = "") {
  const label = escapeXml(String(text).toUpperCase().slice(0, 26));
  const rx = x - width / 2;
  return `
    <g class="${cls}">
      <rect x="${rx + 3}" y="${y - 23}" width="${width}" height="52" rx="26" fill="rgba(0,0,0,0.14)" />
      <rect x="${rx}" y="${y - 26}" width="${width}" height="52" rx="26" fill="${bg}" />
      <text x="${x}" y="${y + 8}" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="800" fill="#FFFFFF" text-anchor="middle">${label}</text>
    </g>`;
}

function buildHookSvg(content) {
  const labels = content.macro_labels || ["OBJEK ALAM", "ELEMEN ALAM", "TITIK REAKSI"];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1220">
    <defs>
      <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#D7EEFA"/>
        <stop offset="100%" stop-color="#F7F4EC"/>
      </linearGradient>
    </defs>
    <rect width="1000" height="1220" fill="url(#sky1)"/>
    <g class="float-slow">
      <ellipse cx="220" cy="170" rx="90" ry="36" fill="#FFFFFF" opacity="0.85"/>
      <ellipse cx="270" cy="155" rx="65" ry="30" fill="#FFFFFF" opacity="0.9"/>
      <circle cx="800" cy="170" r="78" fill="#FDE68A" opacity="0.65"/>
      <circle cx="800" cy="170" r="52" fill="#F59E0B"/>
    </g>
    <path d="M0 720 Q250 670 500 715 T1000 695 L1000 1220 L0 1220 Z" fill="#6D4C41"/>
    <path d="M0 720 Q250 670 500 715 T1000 695 L1000 765 Q750 785 500 765 T0 775 Z" fill="#4CAF50"/>
    <g transform="translate(500, 580)">
      <ellipse cx="0" cy="145" rx="250" ry="58" fill="#3B281E" opacity="0.22"/>
      <path d="M-190 130 C-210 -35, -100 -165, 0 -165 C100 -165, 210 -35, 190 130 Z" fill="#8D6E63" stroke="#4E342E" stroke-width="10"/>
      <path d="M-125 120 C-135 -10, -60 -100, 0 -100 C60 -100, 135 -10, 125 120 Z" fill="#A1887F"/>
      <rect class="pulse-box" x="-145" y="-115" width="290" height="220" rx="28" fill="none" stroke="#F59E0B" stroke-width="9" stroke-dasharray="20 12"/>
    </g>
    <g class="float-fast">
      <circle cx="310" cy="480" r="14" fill="#0284C7" opacity="0.8"/>
      <circle cx="690" cy="460" r="16" fill="#2E6F40" opacity="0.8"/>
      <circle cx="500" cy="360" r="12" fill="#F59E0B" opacity="0.85"/>
    </g>
    ${pill(230, 330, labels[1] || "ELEMEN ALAM", "#0284C7", 280, "pop-1")}
    ${pill(770, 330, labels[0] || "OBJEK ALAM", "#2E6F40", 280, "pop-2")}
    ${pill(500, 880, labels[2] || "TITIK REAKSI", "#DC2626", 330, "pop-3")}
  </svg>`;
}

function buildZoomInTransitionSvg(content) {
  const labels = content.macro_labels || ["OBJEK ALAM", "ELEMEN ALAM", "TITIK REAKSI"];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1220">
    <rect width="1000" height="1220" fill="#F5F2EB"/>
    <path d="M0 640 Q250 600 500 635 T1000 620 L1000 1220 L0 1220 Z" fill="#5C4033"/>
    <path d="M0 640 Q250 600 500 635 T1000 620 L1000 680 L0 680 Z" fill="#2E6F40"/>
    <!-- Cross-section closeup -->
    <g transform="translate(500, 610)">
      <rect x="-340" y="-230" width="680" height="460" rx="44" fill="#EFE9DC" stroke="#4E342E" stroke-width="10"/>
      <circle class="pulse-box" cx="0" cy="0" r="165" fill="#FFFFFF" stroke="#F59E0B" stroke-width="10" stroke-dasharray="18 10"/>
      <g class="float-slow">
        <circle cx="-75" cy="-40" r="34" fill="#6D4C41"/>
        <circle cx="65" cy="-55" r="30" fill="#0284C7"/>
        <circle cx="0" cy="65" r="38" fill="#2E6F40"/>
        <line x1="-50" y1="-20" x2="-12" y2="38" stroke="#F59E0B" stroke-width="8" stroke-linecap="round"/>
        <line x1="46" y1="-32" x2="14" y2="36" stroke="#0284C7" stroke-width="8" stroke-linecap="round"/>
      </g>
    </g>
    ${pill(260, 260, labels[0] || "PERMUKAAN", "#5C4033", 300, "pop-1")}
    ${pill(740, 260, labels[1] || "INTERAKSI", "#0284C7", 300, "pop-2")}
    ${pill(500, 960, `ZOOM KE: ${labels[2] || "STRUKTUR MIKRO"}`, "#DC2626", 440, "pop-3")}
  </svg>`;
}

function buildMicroscopeSvg(content) {
  const mols = content.micro_molecules || ["MOLEKUL A", "MOLEKUL B", "IKATAN KIMIA"];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1220">
    <rect width="1000" height="1220" fill="#0F172A"/>
    <g stroke="#1E293B" stroke-width="2">
      <line x1="0" y1="305" x2="1000" y2="305"/>
      <line x1="0" y1="610" x2="1000" y2="610"/>
      <line x1="0" y1="915" x2="1000" y2="915"/>
      <line x1="250" y1="0" x2="250" y2="1220"/>
      <line x1="500" y1="0" x2="500" y2="1220"/>
      <line x1="750" y1="0" x2="750" y2="1220"/>
    </g>
    <circle cx="500" cy="590" r="405" fill="#F8FAFC" stroke="#4CAF50" stroke-width="18"/>
    <circle class="spin-slow" cx="500" cy="590" r="380" fill="none" stroke="#2E6F40" stroke-width="6" stroke-dasharray="18 14" style="transform-origin: 500px 590px;"/>
    <g class="float-slow">
      <line x1="330" y1="500" x2="500" y2="590" stroke="#F59E0B" stroke-width="14" stroke-linecap="round"/>
      <line x1="670" y1="500" x2="500" y2="590" stroke="#F59E0B" stroke-width="14" stroke-linecap="round"/>
      <line x1="500" y1="590" x2="500" y2="770" stroke="#0284C7" stroke-width="14" stroke-dasharray="18 12" stroke-linecap="round"/>
      <circle cx="330" cy="500" r="74" fill="#6D4C41" stroke="#FFFFFF" stroke-width="8"/>
      <circle cx="670" cy="500" r="74" fill="#2E6F40" stroke="#FFFFFF" stroke-width="8"/>
      <circle cx="500" cy="590" r="90" fill="#0284C7" stroke="#FFFFFF" stroke-width="10"/>
      <circle cx="500" cy="785" r="60" fill="#F59E0B" stroke="#FFFFFF" stroke-width="8"/>
    </g>
    <g class="float-fast">
      <circle cx="260" cy="690" r="22" fill="#4CAF50" opacity="0.75"/>
      <circle cx="745" cy="680" r="24" fill="#0284C7" opacity="0.75"/>
      <circle cx="500" cy="325" r="20" fill="#6D4C41" opacity="0.75"/>
    </g>
    ${pill(285, 375, mols[0] || "MOLEKUL A", "#5C4033", 290, "pop-1")}
    ${pill(715, 375, mols[1] || "MOLEKUL B", "#2E6F40", 290, "pop-2")}
    ${pill(500, 920, mols[2] || "IKATAN PELINDUNG", "#DC2626", 360, "pop-3")}
  </svg>`;
}

function buildMechanismSvg(content) {
  const mech = content.mechanism_steps || ["ZAT AWAL", "REAKSI ALAMI", "HASIL STABIL"];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1220">
    <rect width="1000" height="1220" fill="#F7F4EC"/>
    <!-- Left Card: Input -->
    <g class="pop-1">
      <rect x="80" y="180" width="380" height="310" rx="34" fill="#FFFFFF" stroke="#6D4C41" stroke-width="6"/>
      <circle cx="270" cy="300" r="70" fill="#8D6E63"/>
      <circle cx="235" cy="285" r="22" fill="#FDE68A"/>
      <circle cx="305" cy="320" r="26" fill="#A1887F"/>
      ${pill(270, 425, mech[0] || "BAHAN AWAL", "#6D4C41", 310)}
    </g>
    <!-- Plus / Arrow -->
    <g class="float-fast">
      <circle cx="500" cy="335" r="40" fill="#F59E0B"/>
      <text x="500" y="352" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="900" fill="#FFFFFF" text-anchor="middle">+</text>
    </g>
    <!-- Right Card: Catalyst/Reaction -->
    <g class="pop-2">
      <rect x="540" y="180" width="380" height="310" rx="34" fill="#FFFFFF" stroke="#0284C7" stroke-width="6"/>
      <circle cx="730" cy="300" r="70" fill="#0284C7"/>
      <circle cx="710" cy="280" r="20" fill="#E0F2FE"/>
      <circle cx="755" cy="320" r="24" fill="#38BDF8"/>
      ${pill(730, 425, mech[1] || "PROSES REAKSI", "#0284C7", 310)}
    </g>
    <!-- Down Arrow -->
    <path class="float-slow" d="M500 525 L500 625" stroke="#2E6F40" stroke-width="14" stroke-linecap="round"/>
    <polygon points="500,655 474,615 526,615" fill="#2E6F40"/>
    <!-- Result Card -->
    <g class="pop-3">
      <rect x="140" y="685" width="720" height="360" rx="40" fill="#2E6F40"/>
      <circle cx="500" cy="825" r="82" fill="#FFFFFF"/>
      <circle cx="475" cy="810" r="26" fill="#4CAF50"/>
      <circle cx="525" cy="835" r="30" fill="#6D4C41"/>
      ${pill(500, 965, mech[2] || "HASIL REAKSI", "#F59E0B", 460)}
    </g>
  </svg>`;
}

function buildOutroSvg(content) {
  const steps = content.summary_points || ["PROSES ALAMI", "REAKSI STABIL", "MANFAAT NYATA"];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1220">
    <rect width="1000" height="1220" fill="#F5F2EB"/>
    <g class="pop-1">
      <rect x="90" y="110" width="820" height="225" rx="34" fill="#FFFFFF" stroke="#6D4C41" stroke-width="6"/>
      <circle cx="195" cy="222" r="50" fill="#6D4C41"/>
      <text x="195" y="239" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="900" fill="#FFFFFF" text-anchor="middle">1</text>
      <text x="280" y="236" font-family="Inter, Arial, sans-serif" font-size="33" font-weight="800" fill="#3B281E">${escapeXml((steps[0] || "PROSES ALAMI").slice(0, 32))}</text>
    </g>
    <path d="M500 350 L500 415" stroke="#2E6F40" stroke-width="10" stroke-linecap="round"/>
    <polygon points="500,435 480,405 520,405" fill="#2E6F40"/>
    <g class="pop-2">
      <rect x="90" y="450" width="820" height="225" rx="34" fill="#FFFFFF" stroke="#2E6F40" stroke-width="6"/>
      <circle cx="195" cy="562" r="50" fill="#2E6F40"/>
      <text x="195" y="579" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="900" fill="#FFFFFF" text-anchor="middle">2</text>
      <text x="280" y="576" font-family="Inter, Arial, sans-serif" font-size="33" font-weight="800" fill="#3B281E">${escapeXml((steps[1] || "REAKSI KIMIA").slice(0, 32))}</text>
    </g>
    <path d="M500 690 L500 755" stroke="#2E6F40" stroke-width="10" stroke-linecap="round"/>
    <polygon points="500,775 480,745 520,745" fill="#2E6F40"/>
    <g class="pop-3">
      <rect x="90" y="790" width="820" height="225" rx="34" fill="#2E6F40"/>
      <circle cx="195" cy="902" r="50" fill="#FFFFFF"/>
      <text x="195" y="919" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="900" fill="#2E6F40" text-anchor="middle">3</text>
      <text x="280" y="916" font-family="Inter, Arial, sans-serif" font-size="33" font-weight="800" fill="#FFFFFF">${escapeXml((steps[2] || "HASIL NYATA").slice(0, 32))}</text>
    </g>
  </svg>`;
}

function buildCreatomateRenderScript(content) {
  const shortTitle = content.judul_pendek || content.topik;

  const scenesSpec = [
    {
      comment: "Scene 1 - Hook & Macro Overview",
      svg: buildHookSvg(content),
      badge: "Kimia Sehari • Fakta Alam",
      step: "1/5",
      zoom: "macro",
      text: content.scene_1_narasi || content.hook,
      fade: false,
    },
    {
      comment: "Scene 2 - Zoom Into Reaction Zone",
      svg: buildZoomInTransitionSvg(content),
      badge: "Mengamati Lebih Dekat",
      step: "2/5",
      zoom: "macro",
      text: content.scene_2_narasi || content.penjelasan,
      fade: true,
    },
    {
      comment: "Scene 3 - Microscope & Molecular View",
      svg: buildMicroscopeSvg(content),
      badge: "Zoom Mikroskop & Molekul",
      step: "3/5",
      zoom: "microscope",
      text: content.scene_3_narasi || content.penjelasan,
      fade: true,
    },
    {
      comment: "Scene 4 - Chemical Mechanism",
      svg: buildMechanismSvg(content),
      badge: "Mekanisme Reaksi Kimia",
      step: "4/5",
      zoom: "macro",
      text: content.scene_4_narasi || content.kesimpulan,
      fade: true,
    },
    {
      comment: "Scene 5 - Everyday Takeaway",
      svg: buildOutroSvg(content),
      badge: "Ringkasan Kimia Sehari",
      step: "5/5",
      zoom: "outro",
      text:
        content.scene_5_narasi ||
        content.kesimpulan ||
        "Itulah keajaiban kimia sehari-hari di sekitar kita!",
      fade: true,
    },
  ];

  const zoomScale = {
    microscope: { start_scale: "100%", end_scale: "112%" },
    outro: { start_scale: "106%", end_scale: "100%" },
    macro: { start_scale: "100%", end_scale: "108%" },
  };

  return {
    output_format: "mp4",
    width: 1080,
    height: 1920,
    elements: scenesSpec.map((s, idx) => {
      const voiceName = `voice_scene_${idx + 1}`;
      const scale = zoomScale[s.zoom] || zoomScale.macro;

      return {
        type: "composition",
        name: s.comment,
        track: 1,
        fill_color: "#F7F4EC",
        ...(s.fade
          ? {
              animations: [
                {
                  time: 0,
                  duration: 0.6,
                  transition: true,
                  type: "fade",
                },
              ],
            }
          : {}),
        elements: [
          {
            type: "text",
            text: `${s.step} • ${s.badge}`,
            y: "6.5%",
            width: "auto",
            height: "auto",
            x_alignment: "50%",
            y_alignment: "50%",
            x_padding: "2.6%",
            y_padding: "1.1%",
            background_color: "#2E6F40",
            background_border_radius: "50%",
            font_family: "Inter",
            font_weight: "800",
            font_size: "2.3 vmin",
            fill_color: "#FFFFFF",
            text_transform: "uppercase",
          },
          {
            type: "text",
            text: shortTitle,
            y: "13.5%",
            width: "88%",
            height: "auto",
            x_alignment: "50%",
            y_alignment: "50%",
            font_family: "Inter",
            font_weight: "900",
            font_size: "4.1 vmin",
            line_height: "118%",
            fill_color: "#3B281E",
          },
          {
            type: "image",
            source: `data:image/svg+xml;base64,${Buffer.from(s.svg).toString("base64")}`,
            y: "50%",
            width: "92%",
            height: "62%",
            fit: "contain",
            fill_color: "#FFFFFF",
            border_radius: "4%",
            stroke_color: "#FFFFFF",
            stroke_width: "0.6%",
            animations: [
              {
                easing: "ease-in-out",
                type: "scale",
                scope: "element",
                start_scale: scale.start_scale,
                end_scale: scale.end_scale,
              },
            ],
          },
          {
            type: "audio",
            name: voiceName,
            source: s.text,
            provider:
              "elevenlabs model_id=eleven_multilingual_v2 voice_id=XrExE9yKIg1WjnnlVkGX stability=0.75",
          },
          {
            type: "text",
            name: `subtitles_scene_${idx + 1}`,
            text: "Subtitle",
            y: "87%",
            width: "84%",
            height: "16%",
            x_alignment: "50%",
            y_alignment: "50%",
            font_family: "Montserrat",
            font_weight: "700",
            font_size: "4.8 vmin",
            fill_color: "#FFFFFF",
            stroke_color: "#000000",
            stroke_width: "1.2 vmin",
            transcript_source: voiceName,
            transcript_effect: "highlight",
            transcript_color: "#FDE047",
          },
        ],
      };
    }),
  };
}

async function getRecentTopics(redisUrl, redisToken) {
  if (!redisUrl || !redisToken) return [];
  try {
    const res = await fetch(`${redisUrl}/lrange/kimia:topics/0/49`, {
      headers: { Authorization: `Bearer ${redisToken}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.result) ? data.result : [];
  } catch {
    return [];
  }
}

async function saveTopic(redisUrl, redisToken, topic) {
  if (!redisUrl || !redisToken || !topic) return;
  try {
    await fetch(`${redisUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["LPUSH", "kimia:topics", topic],
        ["LTRIM", "kimia:topics", 0, 49],
      ]),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Non-fatal: failing to record topic history should not fail the daily publish.
  }
}

export default async function handler(req, res) {
  try {
    const {
      CRON_SECRET,
      GEMINI_API_KEY,
      MAKE_WEBHOOK_URL,
      TELEGRAM_BOT_TOKEN,
      TELEGRAM_CHAT_ID,
      UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN,
    } = process.env;

    // Vercel automatically sends Authorization: Bearer <CRON_SECRET> when CRON_SECRET is set.
    if (CRON_SECRET && req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY belum disetel di environment variables.");
    }

    const { dateStr, category, angle } = getDailyFocus();
    const recentTopics = await getRecentTopics(
      UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN
    );

    const exclusionLine =
      recentTopics.length > 0
        ? `\nJangan gunakan topik yang sudah pernah dibahas berikut: ${recentTopics.join(", ")}.`
        : "";

    // Avoid naming specific examples like "petrichor" or "tempe" in the prompt so the LLM does not repeat them.
    const prompt = `Tanggal edisi: ${dateStr}.
Buatkan satu topik riset kimia sehari-hari di alam dengan fokus tema "${category}" dari sudut pandang "${angle}".${exclusionLine}
Gunakan gaya bahasa "Kimia Sehari": ramah, santai, edukatif.
Total durasi narasi suara harus sekitar 55-60 detik (sekitar 130-145 kata total, dibagi rata ke dalam 5 adegan berurutan).

Format output dalam JSON murni dengan key:
- "topik": Judul lengkap konten
- "judul_pendek": Judul singkat maksimal 6 kata untuk header video
- "scene_1_narasi": Narasi suara Adegan 1 (24-28 kata) — hook penasaran tentang fenomena nyata yang sering kita lihat
- "scene_2_narasi": Narasi suara Adegan 2 (24-28 kata) — mengajak penonton melihat lebih dekat ke bagian yang bereaksi
- "scene_3_narasi": Narasi suara Adegan 3 (26-30 kata) — penjelasan sains di level mikroskop/molekul/enzim secara jelas
- "scene_4_narasi": Narasi suara Adegan 4 (26-30 kata) — menjelaskan mekanisme reaksi kimia (bahan A bertemu bahan B menghasilkan C)
- "scene_5_narasi": Narasi suara Adegan 5 (24-28 kata) — kesimpulan manfaatnya di kehidupan sehari-hari dan ajakan ringan
- "macro_labels": Array 3 label singkat (maks 3 kata, huruf kapital) untuk diagram Adegan 1-2
- "micro_molecules": Array 3 label molekul/ikatan singkat (maks 3 kata, huruf kapital) untuk diagram mikroskop Adegan 3
- "mechanism_steps": Array 3 label singkat (maks 3 kata, huruf kapital) untuk diagram mekanisme Adegan 4 (Input 1, Input 2, Hasil)
- "summary_points": Array 3 poin singkat (maks 4 kata) untuk diagram ringkasan Adegan 5
- "caption": Caption Instagram & TikTok lengkap dengan hashtag sains`;

    const modelCandidates = process.env.GEMINI_MODEL
      ? [
          process.env.GEMINI_MODEL,
          "gemini-flash-lite-latest",
          "gemini-3.8-flash",
          "gemini-flash-latest",
        ]
      : [
          "gemini-flash-lite-latest",
          "gemini-3.8-flash",
          "gemini-flash-latest",
        ];

    let aiResponse;
    let usedModel = modelCandidates[0];
    let lastError = "";

    for (const model of modelCandidates) {
      usedModel = model;
      try {
        aiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.85,
              },
            }),
            signal: AbortSignal.timeout(18000),
          }
        );
      } catch (err) {
        lastError = `Gemini API timeout/network error (${model}): ${err.message}`;
        continue;
      }

      if (aiResponse.ok) break;

      const errText = await aiResponse.text();
      lastError = `Gemini API gagal (${aiResponse.status} pada ${model}): ${errText}`;

      // Fail over to the next model on 404 (retired), 429 (rate limit), or 503 (high demand spike).
      if (![404, 429, 503].includes(aiResponse.status)) {
        throw new Error(lastError);
      }
    }

    if (!aiResponse || !aiResponse.ok) {
      throw new Error(lastError);
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Gemini API tidak mengembalikan teks konten.");
    }

    const content = JSON.parse(rawText);
    const creatomateRenderScript = buildCreatomateRenderScript(content);

    const enrichedPayload = {
      topik: content.topik,
      judul_pendek: content.judul_pendek,
      hook: content.scene_1_narasi,
      penjelasan: content.scene_3_narasi,
      kesimpulan: content.scene_5_narasi,
      macro_labels: content.macro_labels,
      micro_molecules: content.micro_molecules,
      mechanism_steps: content.mechanism_steps,
      summary_points: content.summary_points,
      caption: content.caption,
      creatomate_render_script: creatomateRenderScript,
      creatomate_json_string: JSON.stringify(creatomateRenderScript),
    };

    // Run webhook deliveries and topic history recording in parallel to stay well within Vercel's timeout limit.
    const tasks = [
      saveTopic(
        UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN,
        content.topik
      ),
    ];

    if (MAKE_WEBHOOK_URL) {
      tasks.push(
        fetch(MAKE_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand: "Kimia Sehari",
            date: dateStr,
            palette: ["Cokelat", "Hijau", "Putih"],
            payload: enrichedPayload,
          }),
          signal: AbortSignal.timeout(15000),
        })
          .catch((err) => {
            throw new Error(`Make.com Webhook timeout/error: ${err.message}`);
          })
          .then((makeRes) => {
            if (!makeRes.ok) {
              throw new Error(`Make.com Webhook gagal (${makeRes.status})`);
            }
          })
      );
    }

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const telegramMessage = [
        `🌿 KIMIA SEHARI (${dateStr}) 🌿`,
        "",
        `📌 Topik: ${content.topik || "-"}`,
        `1️⃣ Hook: ${content.scene_1_narasi || "-"}`,
        `2️⃣ Zoom: ${content.scene_2_narasi || "-"}`,
        `3️⃣ Mikroskop: ${content.scene_3_narasi || "-"}`,
        `4️⃣ Reaksi: ${content.scene_4_narasi || "-"}`,
        `5️⃣ Penutup: ${content.scene_5_narasi || "-"}`,
        "",
        "📝 Caption:",
        content.caption || "-",
      ].join("\n");

      // Plain text avoids Telegram HTTP 400 errors caused by unescaped underscores in hashtags.
      tasks.push(
        fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text: telegramMessage,
            }),
            signal: AbortSignal.timeout(15000),
          }
        )
          .catch((err) => {
            throw new Error(`Telegram API timeout/error: ${err.message}`);
          })
          .then(async (tgRes) => {
            if (!tgRes.ok) {
              const tgErr = await tgRes.text();
              throw new Error(`Telegram API gagal (${tgRes.status}): ${tgErr}`);
            }
          })
      );
    }

    await Promise.all(tasks);

    return res.status(200).json({
      success: true,
      message: "Pipeline Kimia Sehari berhasil dieksekusi!",
      theme: { date: dateStr, category, angle, model: usedModel },
      data: enrichedPayload,
    });
  } catch (error) {
    console.error("Pipeline Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
