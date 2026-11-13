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

function sanitizeSvg(rawSvg, fallbackLabel) {
  if (typeof rawSvg === "string" && rawSvg.includes("<svg")) {
    return rawSvg.replace(/<script[\s\S]*?<\/script>/gi, "").trim();
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1320">
    <rect width="1080" height="1320" rx="36" fill="#F5F2EB"/>
    <circle cx="540" cy="600" r="240" fill="#2E6F40" opacity="0.15"/>
    <circle cx="540" cy="600" r="160" fill="#5C4033" opacity="0.25"/>
    <rect x="240" y="555" width="600" height="90" rx="45" fill="#2E6F40"/>
    <text x="540" y="612" font-family="sans-serif" font-size="34" font-weight="700" fill="#FFFFFF" text-anchor="middle">${fallbackLabel}</text>
  </svg>`;
}

function buildSceneHtml(svgMarkup, topicTitle, sceneBadge, zoomType) {
  const animCss =
    zoomType === "microscope"
      ? "@keyframes camMove { 0% { transform: scale(1) translateY(0); } 100% { transform: scale(1.14) translateY(-16px); } }"
      : zoomType === "outro"
        ? "@keyframes camMove { 0% { transform: scale(1.1); } 100% { transform: scale(1); } }"
        : "@keyframes camMove { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px;
    height: 1920px;
    background: linear-gradient(180deg, #EAF4F8 0%, #F7F4EC 48%, #EFE9DC 100%);
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .header {
    width: 960px;
    margin-top: 90px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    z-index: 2;
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
    margin-top: 32px;
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
    <div class="badge">${sceneBadge}</div>
    <div class="title">${topicTitle}</div>
  </div>
  <div class="stage">
    <div class="cam">${svgMarkup}</div>
  </div>
</body>
</html>`;
}

function buildJson2VideoMovie(content) {
  const shortTitle = content.judul_pendek || content.topik;
  const svg1 = sanitizeSvg(content.scene_1_svg, "ADEGAN 1: FENOMENA NYATA");
  const svg2 = sanitizeSvg(content.scene_2_svg, "ADEGAN 2: ZOOM MIKROSKOP");
  const svg3 = sanitizeSvg(content.scene_3_svg, "ADEGAN 3: KESIMPULAN");

  return {
    resolution: "instagram-story",
    quality: "high",
    scenes: [
      {
        comment: "Scene 1 - 2D Vector Macro Diagram",
        elements: [
          {
            type: "html",
            html: buildSceneHtml(svg1, shortTitle, "Kimia Sehari • Fakta Alam", "macro"),
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
            html: buildSceneHtml(svg2, shortTitle, "Zoom Mikroskop & Molekul", "microscope"),
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
            html: buildSceneHtml(svg3, shortTitle, "Kesimpulan Sains", "outro"),
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

Selain naskah, buatkan 3 ilustrasi infografis vektor 2D (SVG) bergaya diagram edukasi penampang (2D flat vector cross-section infographic):
- Gunakan viewBox="0 0 1080 1320" pada setiap <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1320">.
- Gunakan palet warna bumi yang rapi: Cokelat tanah/kayu (#6D4C41, #4E342E), Hijau alam/enzim (#2E6F40, #4CAF50), Biru air/langit (#E0F2FE, #0284C7), Putih bersih (#FFFFFF), dan aksen Kuning/Merah (#F59E0B, #DC2626) untuk kotak highlight atau panah.
- Wajib sertakan label pil membulat (<rect rx="18"> + <text font-family="sans-serif" font-weight="700" font-size="24" fill="#FFFFFF">) berbahasa Indonesia langsung di atas komponen diagramnya (contoh: "BATU KARANG", "MOLEKUL AIR", "IKATAN HIDROGEN", "LAPISAN PELINDUNG").
- Adegan 1 (scene_1_svg): Diagram penampang objek/kejadian nyata sehari-hari dari dekat + kotak highlight kuning/oranye putus-putus di bagian yang akan dizoom.
- Adegan 2 (scene_2_svg): Tampilan lingkaran kaca pembesar/mikroskop besar di tengah yang memperlihatkan molekul, atom, bakteri, atau ikatan kimia secara jelas + panah reaksi + label pil.
- Adegan 3 (scene_3_svg): Diagram ringkasan sistem utuh atau hasil manfaatnya di kehidupan sehari-hari dengan label pil.
- Pastikan semua elemen SVG rapi, tidak keluar dari batas 0..1080 dan 0..1320, dan tanpa tag <script>.

Format output dalam JSON murni dengan key:
- "topik": Judul lengkap konten
- "judul_pendek": Judul singkat maksimal 6 kata untuk header video
- "hook": Kalimat pembuka narasi suara (3-4 detik pertama) yang memancing rasa penasaran
- "penjelasan": Penjelasan singkat sains mikroskopis/molekulernya untuk narasi suara (maksimal 2-3 kalimat)
- "kesimpulan": 1 kalimat penutup singkat untuk narasi suara akhir video
- "konsep_visual": Ringkasan Bahasa Indonesia alur diagram dari Adegan 1 ke Adegan 3
- "scene_1_svg": Kode string SVG lengkap untuk Adegan 1
- "scene_2_svg": Kode string SVG lengkap untuk Adegan 2 (Zoom Mikroskop)
- "scene_3_svg": Kode string SVG lengkap untuk Adegan 3 (Kesimpulan)
- "caption": Caption Instagram & TikTok lengkap dengan hashtag sains`;

    const modelCandidates = process.env.GEMINI_MODEL
      ? [
          process.env.GEMINI_MODEL,
          "gemini-flash-latest",
          "gemini-flash-lite-latest",
        ]
      : [
          "gemini-flash-lite-latest",
          "gemini-flash-latest",
          "gemini-pro-latest",
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
            signal: AbortSignal.timeout(30000),
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
      konsep_visual: content.konsep_visual,
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
          signal: AbortSignal.timeout(25000),
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
        `🎨 Alur Diagram: ${content.konsep_visual || "-"}`,
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
            signal: AbortSignal.timeout(25000),
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
