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

function pill(x, y, text, bg = "#2E6F40", width = 280) {
  const label = escapeXml(String(text).toUpperCase().slice(0, 26));
  const rx = x - width / 2;
  return `
    <g>
      <rect x="${rx}" y="${y - 26}" width="${width}" height="52" rx="26" fill="${bg}" />
      <text x="${x}" y="${y + 9}" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="800" fill="#FFFFFF" text-anchor="middle">${label}</text>
    </g>`;
}

function buildMacroSvg(content) {
  const labels = content.macro_labels || ["OBJEK ALAM", "REAKSI KIMIA", "AREA ZOOM"];
  const l1 = labels[0] || "OBJEK ALAM";
  const l2 = labels[1] || "ELEMEN SEKITAR";
  const l3 = labels[2] || "TITIK REAKSI";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1320">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#D8EEF9"/>
        <stop offset="100%" stop-color="#F7F4EC"/>
      </linearGradient>
    </defs>
    <rect width="1080" height="1320" fill="url(#sky)"/>
    <!-- Environment layers -->
    <path d="M0 780 Q270 720 540 770 T1080 750 L1080 1320 L0 1320 Z" fill="#6D4C41"/>
    <path d="M0 780 Q270 720 540 770 T1080 750 L1080 825 Q810 845 540 825 T0 835 Z" fill="#4CAF50"/>
    <!-- Sun / energy source -->
    <circle cx="880" cy="180" r="85" fill="#FDE68A" opacity="0.8"/>
    <circle cx="880" cy="180" r="55" fill="#F59E0B"/>
    <!-- Central subject cross-section -->
    <g transform="translate(540, 620)">
      <ellipse cx="0" cy="160" rx="280" ry="70" fill="#4E342E" opacity="0.25"/>
      <path d="M-210 140 C-230 -40, -110 -180, 0 -180 C110 -180, 230 -40, 210 140 Z" fill="#8D6E63" stroke="#4E342E" stroke-width="10"/>
      <path d="M-140 130 C-150 -10, -70 -110, 0 -110 C70 -110, 150 -10, 140 130 Z" fill="#A1887F"/>
      <!-- Active reaction zone highlight -->
      <rect x="-150" y="-120" width="300" height="230" rx="28" fill="none" stroke="#F59E0B" stroke-width="10" stroke-dasharray="22 14"/>
    </g>
    <!-- Reaction arrows -->
    <path d="M240 420 Q340 480 410 530" fill="none" stroke="#0284C7" stroke-width="8" stroke-linecap="round" stroke-dasharray="14 10"/>
    <polygon points="420,538 392,535 408,512" fill="#0284C7"/>
    <path d="M840 420 Q740 480 670 530" fill="none" stroke="#2E6F40" stroke-width="8" stroke-linecap="round" stroke-dasharray="14 10"/>
    <polygon points="660,538 672,512 688,535" fill="#2E6F40"/>
    ${pill(240, 380, l2, "#0284C7", 300)}
    ${pill(820, 380, l1, "#2E6F40", 300)}
    ${pill(540, 930, l3, "#DC2626", 340)}
  </svg>`;
}

function buildMicroscopeSvg(content) {
  const mols = content.micro_molecules || ["MOLEKUL A", "MOLEKUL B", "IKATAN KIMIA"];
  const m1 = mols[0] || "MOLEKUL A";
  const m2 = mols[1] || "MOLEKUL B";
  const m3 = mols[2] || "IKATAN PELINDUNG";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1320">
    <rect width="1080" height="1320" fill="#1E293B"/>
    <!-- Subtle lab grid -->
    <g stroke="#334155" stroke-width="2" opacity="0.5">
      <line x1="0" y1="330" x2="1080" y2="330"/>
      <line x1="0" y1="660" x2="1080" y2="660"/>
      <line x1="0" y1="990" x2="1080" y2="990"/>
      <line x1="270" y1="0" x2="270" y2="1320"/>
      <line x1="540" y1="0" x2="540" y2="1320"/>
      <line x1="810" y1="0" x2="810" y2="1320"/>
    </g>
    <!-- Microscope lens -->
    <circle cx="540" cy="630" r="430" fill="#F7F4EC" stroke="#4CAF50" stroke-width="18"/>
    <circle cx="540" cy="630" r="405" fill="none" stroke="#2E6F40" stroke-width="6" stroke-dasharray="16 12"/>
    <!-- Molecular bonds inside lens -->
    <line x1="360" y1="530" x2="540" y2="630" stroke="#F59E0B" stroke-width="14" stroke-linecap="round"/>
    <line x1="720" y1="530" x2="540" y2="630" stroke="#F59E0B" stroke-width="14" stroke-linecap="round"/>
    <line x1="540" y1="630" x2="540" y2="810" stroke="#0284C7" stroke-width="14" stroke-dasharray="18 12" stroke-linecap="round"/>
    <!-- Molecule nodes -->
    <circle cx="360" cy="530" r="78" fill="#6D4C41" stroke="#FFFFFF" stroke-width="8"/>
    <circle cx="720" cy="530" r="78" fill="#2E6F40" stroke="#FFFFFF" stroke-width="8"/>
    <circle cx="540" cy="630" r="96" fill="#0284C7" stroke="#FFFFFF" stroke-width="10"/>
    <circle cx="540" cy="830" r="64" fill="#F59E0B" stroke="#FFFFFF" stroke-width="8"/>
    <!-- Small floating particles -->
    <circle cx="290" cy="740" r="24" fill="#4CAF50" opacity="0.7"/>
    <circle cx="790" cy="730" r="28" fill="#0284C7" opacity="0.7"/>
    <circle cx="540" cy="360" r="22" fill="#6D4C41" opacity="0.7"/>
    ${pill(320, 405, m1, "#5C4033", 300)}
    ${pill(760, 405, m2, "#2E6F40", 300)}
    ${pill(540, 965, m3, "#DC2626", 360)}
  </svg>`;
}

function buildOutroSvg(content) {
  const steps = content.summary_points || ["PROSES ALAMI", "REAKSI STABIL", "MANFAAT NYATA"];
  const s1 = steps[0] || "PROSES ALAMI";
  const s2 = steps[1] || "REAKSI KIMIA";
  const s3 = steps[2] || "HASIL NYATA";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1320">
    <rect width="1080" height="1320" fill="#F5F2EB"/>
    <!-- 3-step vertical flow cards -->
    <rect x="110" y="130" width="860" height="240" rx="34" fill="#FFFFFF" stroke="#6D4C41" stroke-width="6"/>
    <circle cx="215" cy="250" r="52" fill="#6D4C41"/>
    <text x="215" y="268" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle">1</text>
    <text x="305" y="264" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" fill="#3B281E">${escapeXml(s1.slice(0, 32))}</text>

    <path d="M540 385 L540 455" stroke="#2E6F40" stroke-width="10" stroke-linecap="round"/>
    <polygon points="540,475 520,445 560,445" fill="#2E6F40"/>

    <rect x="110" y="490" width="860" height="240" rx="34" fill="#FFFFFF" stroke="#2E6F40" stroke-width="6"/>
    <circle cx="215" cy="610" r="52" fill="#2E6F40"/>
    <text x="215" y="628" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle">2</text>
    <text x="305" y="624" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" fill="#3B281E">${escapeXml(s2.slice(0, 32))}</text>

    <path d="M540 745 L540 815" stroke="#2E6F40" stroke-width="10" stroke-linecap="round"/>
    <polygon points="540,835 520,805 560,805" fill="#2E6F40"/>

    <rect x="110" y="850" width="860" height="240" rx="34" fill="#2E6F40"/>
    <circle cx="215" cy="970" r="52" fill="#FFFFFF"/>
    <text x="215" y="988" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="900" fill="#2E6F40" text-anchor="middle">3</text>
    <text x="305" y="984" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" fill="#FFFFFF">${escapeXml(s3.slice(0, 32))}</text>
  </svg>`;
}

function buildSceneHtml(svgMarkup, topicTitle, sceneBadge, zoomType) {
  const animCss =
    zoomType === "microscope"
      ? "@keyframes camMove { 0% { transform: scale(1); } 100% { transform: scale(1.14); } }"
      : zoomType === "outro"
        ? "@keyframes camMove { 0% { transform: scale(1.06); } 100% { transform: scale(1); } }"
        : "@keyframes camMove { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px;
    height: 1920px;
    background: linear-gradient(180deg, #EAF4F8 0%, #F7F4EC 50%, #EFE9DC 100%);
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .header {
    width: 960px;
    margin-top: 88px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  .badge {
    background: #2E6F40;
    color: #FFFFFF;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: 1.5px;
    padding: 12px 30px;
    border-radius: 999px;
    text-transform: uppercase;
  }
  .title {
    color: #3B281E;
    font-size: 46px;
    font-weight: 900;
    text-align: center;
    line-height: 1.2;
  }
  .stage {
    width: 1020px;
    height: 1280px;
    margin-top: 30px;
    border-radius: 40px;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(59, 40, 30, 0.14);
    border: 6px solid #FFFFFF;
    background: #FFFFFF;
  }
  .cam {
    width: 100%;
    height: 100%;
    animation: camMove 7s ease-in-out forwards;
  }
  .cam svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  ${animCss}
</style>
</head>
<body>
  <div class="header">
    <div class="badge">${escapeXml(sceneBadge)}</div>
    <div class="title">${escapeXml(topicTitle)}</div>
  </div>
  <div class="stage">
    <div class="cam">${svgMarkup}</div>
  </div>
</body>
</html>`;
}

function buildJson2VideoMovie(content) {
  const shortTitle = content.judul_pendek || content.topik;

  return {
    resolution: "instagram-story",
    quality: "high",
    scenes: [
      {
        comment: "Scene 1 - 2D Vector Macro Diagram",
        elements: [
          {
            type: "html",
            html: buildSceneHtml(
              buildMacroSvg(content),
              shortTitle,
              "Kimia Sehari • Fakta Alam",
              "macro"
            ),
            width: 1080,
            height: 1920,
          },
          {
            type: "voice",
            model: "azure",
            voice: "id-ID-ArdiNeural",
            text: content.hook,
          },
        ],
      },
      {
        comment: "Scene 2 - 2D Vector Microscope Zoom Diagram",
        elements: [
          {
            type: "html",
            html: buildSceneHtml(
              buildMicroscopeSvg(content),
              shortTitle,
              "Zoom Mikroskop & Molekul",
              "microscope"
            ),
            width: 1080,
            height: 1920,
          },
          {
            type: "voice",
            model: "azure",
            voice: "id-ID-ArdiNeural",
            text: content.penjelasan,
          },
        ],
      },
      {
        comment: "Scene 3 - 2D Vector Summary Diagram",
        elements: [
          {
            type: "html",
            html: buildSceneHtml(
              buildOutroSvg(content),
              shortTitle,
              "Ringkasan Reaksi Kimia",
              "outro"
            ),
            width: 1080,
            height: 1920,
          },
          {
            type: "voice",
            model: "azure",
            voice: "id-ID-ArdiNeural",
            text:
              content.kesimpulan ||
              "Itulah rahasia kimia sehari-hari di sekitar kita!",
          },
        ],
      },
    ],
    elements: [
      {
        type: "subtitles",
        settings: {
          style: "boxed-word",
          "font-family": "Montserrat",
          "font-size": 52,
          "word-color": "#FFFFFF",
          "line-color": "#E2E8F0",
          "box-color": "#1E293B",
          "outline-color": "#000000",
          position: "bottom-center",
          "max-words-per-line": 3,
        },
      },
    ],
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

Format output dalam JSON murni dengan key:
- "topik": Judul lengkap konten
- "judul_pendek": Judul singkat maksimal 6 kata untuk header video
- "hook": Kalimat pembuka narasi suara (3-4 detik pertama) yang memancing rasa penasaran
- "penjelasan": Penjelasan singkat sains mikroskopis/molekulernya untuk narasi suara (maksimal 2-3 kalimat)
- "kesimpulan": 1 kalimat penutup singkat untuk narasi suara akhir video
- "macro_labels": Array berisi tepat 3 label singkat (maks 3 kata, huruf kapital) untuk diagram adegan 1 (contoh: ["BATU KARANG", "AIR LAUT", "TITIK EROSI"])
- "micro_molecules": Array berisi tepat 3 label molekul/reaksi singkat (maks 3 kata, huruf kapital) untuk diagram mikroskop adegan 2 (contoh: ["KALSIUM KARBONAT", "MOLEKUL AIR", "IKATAN HIDROGEN"])
- "summary_points": Array berisi tepat 3 poin alur singkat (maks 4 kata) untuk diagram kesimpulan adegan 3
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
    const json2videoMovie = buildJson2VideoMovie(content);

    const enrichedPayload = {
      topik: content.topik,
      judul_pendek: content.judul_pendek,
      hook: content.hook,
      penjelasan: content.penjelasan,
      kesimpulan: content.kesimpulan,
      macro_labels: content.macro_labels,
      micro_molecules: content.micro_molecules,
      summary_points: content.summary_points,
      caption: content.caption,
      json2video_movie: json2videoMovie,
      json2video_json_string: JSON.stringify(json2videoMovie),
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
        `🎯 Hook (Scene 1): ${content.hook || "-"}`,
        `🔬 Mikroskop (Scene 2): ${content.penjelasan || "-"}`,
        `✨ Penutup (Scene 3): ${content.kesimpulan || "-"}`,
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
