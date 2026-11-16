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

function getPublicBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  }
  const host = req.headers?.["x-forwarded-host"] || req.headers?.host;
  if (host) {
    const proto =
      req.headers?.["x-forwarded-proto"] ||
      (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return vercelHost ? `https://${vercelHost}` : "https://kimiasehari.vercel.app";
}

function buildCreatomateRenderScript(content, baseUrl) {
  const shortTitle = content.judul_pendek || content.topik;
  const svgData = Buffer.from(
    JSON.stringify({
      macro_labels: content.macro_labels,
      micro_molecules: content.micro_molecules,
      mechanism_steps: content.mechanism_steps,
      summary_points: content.summary_points,
    })
  ).toString("base64url");

  const scenesSpec = [
    {
      comment: "Scene 1 - Hook & Macro Overview",
      badge: "Kimia Sehari • Fakta Alam",
      step: "1/5",
      zoom: "macro",
      text: content.scene_1_narasi || content.hook,
      fade: false,
    },
    {
      comment: "Scene 2 - Zoom Into Reaction Zone",
      badge: "Mengamati Lebih Dekat",
      step: "2/5",
      zoom: "macro",
      text: content.scene_2_narasi || content.penjelasan,
      fade: true,
    },
    {
      comment: "Scene 3 - Microscope & Molecular View",
      badge: "Zoom Mikroskop & Molekul",
      step: "3/5",
      zoom: "microscope",
      text: content.scene_3_narasi || content.penjelasan,
      fade: true,
    },
    {
      comment: "Scene 4 - Chemical Mechanism",
      badge: "Mekanisme Reaksi Kimia",
      step: "4/5",
      zoom: "macro",
      text: content.scene_4_narasi || content.kesimpulan,
      fade: true,
    },
    {
      comment: "Scene 5 - Everyday Takeaway",
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
    microscope: { start_scale: "100%", end_scale: "115%" },
    outro: { start_scale: "108%", end_scale: "100%" },
    macro: { start_scale: "100%", end_scale: "110%" },
  };

  const sceneCallouts = [
    content.macro_labels || ["OBJEK ALAM", "TITIK REAKSI"],
    content.macro_labels || ["PERMUKAAN", "INTERAKSI"],
    content.micro_molecules || ["MOLEKUL A", "IKATAN KIMIA"],
    content.mechanism_steps || ["ZAT AWAL", "HASIL REAKSI"],
    content.summary_points || ["PROSES ALAMI", "MANFAAT NYATA"],
  ];

  const moleculeParticles = [
    { x: "14%", y: "31%", size: "34 px", color: "rgba(46, 111, 64, 0.75)", delay: 0.25 },
    { x: "86%", y: "36%", size: "26 px", color: "rgba(2, 132, 199, 0.75)", delay: 0.45 },
    { x: "84%", y: "72%", size: "30 px", color: "rgba(245, 158, 11, 0.75)", delay: 0.65 },
  ];

  return {
    output_format: "mp4",
    width: 1080,
    height: 1920,
    elements: scenesSpec.map((s, idx) => {
      const voiceName = `voice_scene_${idx + 1}`;
      const scale = zoomScale[s.zoom] || zoomScale.macro;
      const callouts = sceneCallouts[idx] || [];
      const progressPct = `${((idx + 1) / scenesSpec.length) * 88}%`;

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
                  duration: 0.65,
                  easing: "quadratic-out",
                  transition: true,
                  type: "slide",
                  direction: "180°",
                  fade: true,
                },
              ],
            }
          : {}),
        elements: [
          {
            type: "shape",
            x: "50%",
            y: "2.8%",
            width: "88%",
            height: "10 px",
            border_radius: "5 px",
            fill_color: "#E2DDD0",
          },
          {
            type: "shape",
            x: "6%",
            x_anchor: "0%",
            y: "2.8%",
            width: progressPct,
            height: "10 px",
            border_radius: "5 px",
            fill_color: "#2E6F40",
            animations: [
              {
                time: 0,
                duration: 0.7,
                easing: "quadratic-out",
                type: "wipe",
                direction: "right",
              },
            ],
          },
          {
            type: "text",
            text: `${s.step} • ${s.badge}`,
            y: "6.8%",
            width: null,
            height: null,
            x_alignment: "50%",
            y_alignment: "50%",
            x_padding: "28 px",
            y_padding: "12 px",
            background_color: "#2E6F40",
            background_border_radius: "50%",
            font_family: "Inter",
            font_weight: "800",
            font_size: "2.3 vmin",
            fill_color: "#FFFFFF",
            text_transform: "uppercase",
            animations: [
              {
                time: 0.05,
                duration: 0.45,
                easing: "quadratic-out",
                type: "slide",
                direction: "270°",
                fade: true,
              },
            ],
          },
          {
            type: "text",
            text: shortTitle,
            y: "13.8%",
            width: "88%",
            height: null,
            x_alignment: "50%",
            y_alignment: "50%",
            font_family: "Inter",
            font_weight: "900",
            font_size: "4.1 vmin",
            line_height: "118%",
            fill_color: "#3B281E",
            animations: [
              {
                time: 0.15,
                duration: 0.6,
                easing: "quadratic-out",
                type: "text-slide",
                split: "line",
                distance: "120%",
                direction: "up",
              },
            ],
          },
          {
            type: "image",
            source: `${baseUrl}/api/svg?scene=${idx + 1}&d=${svgData}`,
            y: "50%",
            width: "92%",
            height: "62%",
            fit: "contain",
            clip: true,
            fill_color: "#FFFFFF",
            border_radius: "40 px",
            stroke_color: "#FFFFFF",
            stroke_width: "6 px",
            animations: [
              {
                time: 0,
                duration: 0.5,
                easing: "quadratic-out",
                type: "fade",
              },
              {
                easing: "linear",
                type: "scale",
                scope: "element",
                start_scale: scale.start_scale,
                end_scale: scale.end_scale,
              },
            ],
          },
          ...moleculeParticles.map((p) => ({
            type: "shape",
            x: p.x,
            y: p.y,
            width: p.size,
            height: p.size,
            border_radius: "20 px",
            fill_color: p.color,
            animations: [
              {
                time: p.delay,
                duration: 0.4,
                easing: "quadratic-out",
                type: "fade",
              },
              {
                type: "wiggle",
                scope: "element",
              },
            ],
          })),
          ...(callouts[0]
            ? [
                {
                  type: "text",
                  text: String(callouts[0]).toUpperCase().slice(0, 26),
                  x: "27%",
                  y: "76.5%",
                  width: null,
                  height: null,
                  x_alignment: "50%",
                  y_alignment: "50%",
                  x_padding: "22 px",
                  y_padding: "10 px",
                  background_color: "#0284C7",
                  background_border_radius: "50%",
                  font_family: "Inter",
                  font_weight: "800",
                  font_size: "2.0 vmin",
                  fill_color: "#FFFFFF",
                  animations: [
                    {
                      time: 0.45,
                      duration: 0.45,
                      easing: "quadratic-out",
                      type: "slide",
                      direction: "0°",
                      fade: true,
                    },
                  ],
                },
              ]
            : []),
          ...(callouts[1]
            ? [
                {
                  type: "text",
                  text: String(callouts[1]).toUpperCase().slice(0, 26),
                  x: "73%",
                  y: "76.5%",
                  width: null,
                  height: null,
                  x_alignment: "50%",
                  y_alignment: "50%",
                  x_padding: "22 px",
                  y_padding: "10 px",
                  background_color: "#2E6F40",
                  background_border_radius: "50%",
                  font_family: "Inter",
                  font_weight: "800",
                  font_size: "2.0 vmin",
                  fill_color: "#FFFFFF",
                  animations: [
                    {
                      time: 0.9,
                      duration: 0.45,
                      easing: "quadratic-out",
                      type: "slide",
                      direction: "180°",
                      fade: true,
                    },
                  ],
                },
              ]
            : []),
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
            y: "88%",
            width: "84%",
            height: "15%",
            x_alignment: "50%",
            y_alignment: "50%",
            font_family: "Montserrat",
            font_weight: "700",
            font_size: "4.6 vmin",
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
    const creatomateRenderScript = buildCreatomateRenderScript(
      content,
      getPublicBaseUrl(req)
    );

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
