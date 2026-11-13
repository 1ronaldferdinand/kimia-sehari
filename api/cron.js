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
Tentukan juga konsep visual dengan palet warna: Cokelat (tanah/bumi), Hijau (alam/tumbuhan), dan Putih (bersih/laboratorium).
Format output dalam JSON dengan key:
- "topik": Judul konten yang spesifik
- "hook": Kalimat pembuka 3 detik pertama reels
- "penjelasan": Penjelasan singkat sainsnya (maksimal 3 kalimat)
- "konsep_visual": Deskripsi singkat adegan visual dengan palet Cokelat, Hijau, Putih
- "caption": Caption Instagram & TikTok lengkap dengan hashtag sains`;

    const primaryModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const callGemini = (model) =>
      fetch(
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
          signal: AbortSignal.timeout(25000),
        }
      );

    // Fall back to the rolling alias if a pinned model version is retired for new API keys.
    let aiResponse = await callGemini(primaryModel);
    if (aiResponse.status === 404 && primaryModel !== "gemini-flash-latest") {
      aiResponse = await callGemini("gemini-flash-latest");
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`Gemini API gagal (${aiResponse.status}): ${errText}`);
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Gemini API tidak mengembalikan teks konten.");
    }

    const content = JSON.parse(rawText);

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
            payload: content,
          }),
          signal: AbortSignal.timeout(15000),
        }).then((makeRes) => {
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
        `🎯 Hook: ${content.hook || "-"}`,
        `🧪 Penjelasan: ${content.penjelasan || "-"}`,
        `🎨 Visual: ${content.konsep_visual || "-"}`,
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
        ).then(async (tgRes) => {
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
      theme: { date: dateStr, category, angle },
      data: content,
    });
  } catch (error) {
    console.error("Pipeline Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
