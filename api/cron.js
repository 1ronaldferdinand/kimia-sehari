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
    dayOfYear,
    category,
    angle,
  };
}

// Curated 1080x1920 Unsplash visual pools (Macro -> Microscope/Lab -> Outro) that never trigger datacenter 402 blocks on JSON2Video.
const MACRO_IMAGES = [
  "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1080&h=1920&q=85",
  "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1080&h=1920&q=85",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1080&h=1920&q=85",
  "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1080&h=1920&q=85",
  "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1080&h=1920&q=85",
  "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1080&h=1920&q=85",
];

const MICROSCOPE_IMAGES = [
  "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1080&h=1920&q=85",
  "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1080&h=1920&q=85",
  "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1080&h=1920&q=85",
  "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1080&h=1920&q=85",
  "https://images.unsplash.com/photo-1614935151651-0bea6508db6b?auto=format&fit=crop&w=1080&h=1920&q=85",
  "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1080&h=1920&q=85",
];

const OUTRO_IMAGES = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1080&h=1920&q=85",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1080&h=1920&q=85",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1080&h=1920&q=85",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1080&h=1920&q=85",
  "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1080&h=1920&q=85",
  "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1080&h=1920&q=85",
];

function selectSceneImages(dayOfYear) {
  return {
    scene_1_macro: MACRO_IMAGES[dayOfYear % MACRO_IMAGES.length],
    scene_2_microscope: MICROSCOPE_IMAGES[dayOfYear % MICROSCOPE_IMAGES.length],
    scene_3_outro: OUTRO_IMAGES[dayOfYear % OUTRO_IMAGES.length],
  };
}

function buildJson2VideoMovie(content, images) {
  return {
    resolution: "instagram-story",
    quality: "high",
    scenes: [
      {
        comment: "Scene 1 - Macro Hook",
        elements: [
          {
            type: "image",
            src: images.scene_1_macro,
            zoom: 5,
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
        comment: "Scene 2 - Microscope / Molecular Zoom",
        elements: [
          {
            type: "image",
            src: images.scene_2_microscope,
            zoom: 8,
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
        comment: "Scene 3 - Everyday Conclusion",
        elements: [
          {
            type: "image",
            src: images.scene_3_outro,
            zoom: 4,
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
          style: "classic",
          "font-size": 42,
          "word-color": "#4CAF50",
          "line-color": "#FFFFFF",
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

    const { dateStr, dayOfYear, category, angle } = getDailyFocus();
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
Konsep visual wajib terdiri dari 3 adegan berurutan (Makro -> Zoom Mikroskop/Molekuler -> Kesimpulan) dengan palet warna Cokelat, Hijau, dan Putih.
Format output dalam JSON dengan key:
- "topik": Judul konten yang spesifik
- "hook": Kalimat pembuka narasi suara (3-4 detik pertama) yang memancing rasa penasaran
- "penjelasan": Penjelasan singkat sains mikroskopis/molekulernya untuk narasi suara (maksimal 2-3 kalimat)
- "kesimpulan": 1 kalimat penutup singkat untuk narasi suara akhir video
- "konsep_visual": Ringkasan Bahasa Indonesia alur visual dari adegan nyata lalu zoom masuk ke mikroskop
- "scene_1_prompt_en": Prompt gambar Bahasa Inggris (15-20 kata) untuk Adegan 1 (aktivitas/objek nyata sehari-hari dari dekat)
- "scene_2_prompt_en": Prompt gambar Bahasa Inggris (15-20 kata) untuk Adegan 2 (tampilan zoom mikroskop/ikatan molekul di dalam objek Adegan 1)
- "scene_3_prompt_en": Prompt gambar Bahasa Inggris (15-20 kata) untuk Adegan 3 (hasil akhir fenomena alam/keseharian yang indah)
- "caption": Caption Instagram & TikTok lengkap dengan hashtag sains`;

    const modelCandidates = process.env.GEMINI_MODEL
      ? [
          process.env.GEMINI_MODEL,
          "gemini-flash-lite-latest",
          "gemini-flash-latest",
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
                temperature: 0.9,
              },
            }),
            signal: AbortSignal.timeout(20000),
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

    const images = selectSceneImages(dayOfYear);

    const json2videoMovie = buildJson2VideoMovie(content, images);
    const enrichedPayload = {
      ...content,
      images,
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
        `🎨 Alur Visual: ${content.konsep_visual || "-"}`,
        `🖼️ Gambar 1 (Makro): ${images.scene_1_macro}`,
        `🖼️ Gambar 2 (Mikroskop): ${images.scene_2_microscope}`,
        `🖼️ Gambar 3 (Outro): ${images.scene_3_outro}`,
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
