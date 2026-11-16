import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseBuffer } from "music-metadata";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

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
  return { dateStr: date.toISOString().slice(0, 10), category, angle };
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

async function callClaude(apiKey, model, messages) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      temperature: 0.7,
      messages,
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API gagal (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || "";
}

async function callGemini(apiKey, model, promptText) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.75,
        },
      }),
      signal: AbortSignal.timeout(180000),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API gagal (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function generateWithAI(env, messages) {
  const {
    ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929",
    GEMINI_API_KEY,
    GEMINI_MODEL = "gemini-flash-latest",
  } = env;

  if (ANTHROPIC_API_KEY) {
    try {
      return await callClaude(ANTHROPIC_API_KEY, ANTHROPIC_MODEL, messages);
    } catch (err) {
      if (!GEMINI_API_KEY) throw err;
      console.warn(`[AI] Claude gagal (${err.message.slice(0, 120)}), fallback ke Gemini (${GEMINI_MODEL})...`);
    }
  }

  if (!GEMINI_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY atau GEMINI_API_KEY belum disetel.");
  }

  const combinedPrompt = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
  const candidates = env.GEMINI_MODEL
    ? [env.GEMINI_MODEL, "gemini-3.8-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-flash-lite-latest"]
    : ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-flash-lite-latest"];

  let lastErr;
  for (const model of [...new Set(candidates)]) {
    try {
      return await callGemini(GEMINI_API_KEY, model, combinedPrompt);
    } catch (err) {
      lastErr = err;
      if (err.name !== "TimeoutError" && !/\((404|429|503)\)/.test(err.message)) throw err;
      console.warn(`[AI] ${model} sibuk/tidak tersedia, mencoba model berikutnya...`);
    }
  }
  throw lastErr;
}

function extractJson(raw) {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function runTypecheck() {
  const tscBin = path.resolve("node_modules/.bin/tsc");
  try {
    execFileSync(tscBin, ["--noEmit"], { stdio: "pipe" });
    return { ok: true, error: "" };
  } catch (err) {
    return {
      ok: false,
      error: (err.stdout?.toString() || "") + (err.stderr?.toString() || ""),
    };
  }
}

async function synthesizeWithEdgeTts(text, outPath) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(
    "id-ID-ArdiNeural",
    OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
  );
  const { audioStream } = tts.toStream(text);
  const chunks = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  const buf = Buffer.concat(chunks);
  tts.close();
  fs.writeFileSync(outPath, buf);
  const meta = await parseBuffer(buf, "audio/mpeg");
  return meta.format.duration || 5;
}

async function synthesizeVoice(apiKey, voiceId, text, outPath) {
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.75, similarity_boost: 0.75 },
          }),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`ElevenLabs API gagal (${res.status}): ${errText}`);
      }

      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      const meta = await parseBuffer(buf, "audio/mpeg");
      return meta.format.duration || 5;
    } catch (err) {
      console.warn(`[TTS] ElevenLabs gagal (${err.message.slice(0, 120)}), fallback ke Edge TTS (id-ID-ArdiNeural)...`);
    }
  }

  return synthesizeWithEdgeTts(text, outPath);
}

async function main() {
  const {
    ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929",
    ELEVENLABS_API_KEY,
    ELEVENLABS_VOICE_ID = "XrExE9yKIg1WjnnlVkGX",
    UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN,
  } = process.env;

  if (!ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY atau GEMINI_API_KEY belum disetel.");
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

  const prompt = `Tanggal edisi: ${dateStr}.
Buatkan satu topik riset kimia sehari-hari di alam dengan fokus tema "${category}" dari sudut pandang "${angle}".${exclusionLine}
Gunakan gaya bahasa "Kimia Sehari": ramah, santai, edukatif.
Total durasi narasi suara harus sekitar 50-60 detik (sekitar 125-145 kata total, dibagi ke 5 adegan berurutan).

Kamu juga harus menulis kode React + Remotion TSX yang lengkap di key "tsx_code" untuk merender motion graphic unik yang relevan dengan topik tersebut!

Aturan ketat untuk "tsx_code" (akan disimpan ke remotion/GeneratedScenes.tsx):
1. Import HANYA dari "react", "remotion" (AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Easing), dan "./types" (import type { SceneRendererProps } from "./types"). JANGAN import library lain.
2. Export bernama persis: \`export const GeneratedScene: React.FC<SceneRendererProps> = ({ sceneIndex, totalScenes, scene, judulPendek }) => { ... }\`
3. WAJIB pakai tata letak 3 zona anti-tumpang-tindih (canvas 1080x1920, 30fps):
   - Zona Header: \`position: "absolute", top: 96, left: 56, right: 56, display: "flex", justifyContent: "space-between", alignItems: "center"\` (kiri: pill \`scene.badge\`, kanan: \`judulPendek\` maxWidth 460).
   - Zona Konten Utama: \`position: "absolute", top: 200, bottom: 340, left: 56, right: 56, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28\` — ruang \`bottom: 340\` HARUS kosong untuk subtitle.
   - Di dalam Zona Konten Utama: taruh ilustrasi SVG animasi (ukuran maksimal \`width: 860, height: 680\` dengan \`viewBox\` yang pas dan TANPA teks panjang di dalam SVG agar tidak bertabrakan), lalu di BAWAH SVG taruh \`scene.callouts\` dalam flex row (\`display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center"\`).
   - DILARANG menaruh teks \`position: "absolute"\` sembarangan di atas elemen lain!
4. Animasi HARUS halus dan sinematik: gunakan \`spring({ frame, fps, config: { damping: 16, stiffness: 100 } })\` untuk animasi masuk, \`interpolate\` dengan \`extrapolateLeft: "clamp", extrapolateRight: "clamp"\`, serta \`Math.sin(frame * 0.05)\` untuk gerakan mengambang/berdenyut yang lembut.
5. Pastikan TypeScript strict mode valid (semua tipe jelas, tidak ada unused variable, tidak ada \`any\` implisit).

Kembalikan HANYA JSON murni (tanpa markdown fence) dengan struktur:
{
  "topik": "Judul lengkap konten",
  "judul_pendek": "Judul singkat maks 6 kata",
  "caption": "Caption Instagram & TikTok lengkap dengan hashtag",
  "scenes": [
    { "id": 1, "badge": "Fakta Alam", "narration": "24-28 kata...", "callouts": ["LABEL 1", "LABEL 2"] },
    { "id": 2, "badge": "Mengamati Lebih Dekat", "narration": "24-28 kata...", "callouts": ["LABEL 1", "LABEL 2"] },
    { "id": 3, "badge": "Zoom Mikroskop", "narration": "26-30 kata...", "callouts": ["MOLEKUL A", "MOLEKUL B"] },
    { "id": 4, "badge": "Mekanisme Reaksi", "narration": "26-30 kata...", "callouts": ["PROSES", "HASIL"] },
    { "id": 5, "badge": "Ringkasan", "narration": "24-28 kata...", "callouts": ["POIN 1", "POIN 2"] }
  ],
  "tsx_code": "...kode TypeScript lengkap..."
}`;

  console.log(`[1/4] Meminta naskah & kode motion graphic ke AI (${ANTHROPIC_API_KEY ? ANTHROPIC_MODEL : "Gemini"})...`);
  const raw = await generateWithAI(process.env, [
    { role: "user", content: prompt },
  ]);
  const generated = extractJson(raw);

  const generatedPath = path.resolve("remotion/GeneratedScenes.tsx");
  const fallbackPath = path.resolve("remotion/FallbackScenes.tsx");

  fs.writeFileSync(generatedPath, generated.tsx_code, "utf8");
  let tc = runTypecheck();

  if (!tc.ok) {
    console.warn("[Typecheck] Gagal pada percobaan pertama, meminta AI memperbaiki error TS...");
    const fixRaw = await generateWithAI(process.env, [
      { role: "user", content: prompt },
      { role: "assistant", content: raw },
      {
        role: "user",
        content: `Kode TSX kamu gagal TypeScript check:\n${tc.error}\n\nPerbaiki ONLY "tsx_code" dan kembalikan JSON murni: { "tsx_code": "..." }`,
      },
    ]);
    try {
      const fixed = extractJson(fixRaw);
      if (fixed.tsx_code) {
        fs.writeFileSync(generatedPath, fixed.tsx_code, "utf8");
        tc = runTypecheck();
      }
    } catch {
      // Fall through to fallback below.
    }
  }

  if (!tc.ok) {
    console.warn("[Typecheck] Masih gagal, menggunakan FallbackScenes.tsx agar render tetap berjalan.");
    fs.copyFileSync(fallbackPath, generatedPath);
  } else {
    console.log("[Typecheck] GeneratedScenes.tsx valid!");
  }

  console.log("[2/4] Generate voiceover ElevenLabs untuk 5 adegan...");
  fs.mkdirSync(path.resolve("public/audio"), { recursive: true });
  fs.mkdirSync(path.resolve("out"), { recursive: true });

  const scenesWithAudio = [];
  for (let i = 0; i < generated.scenes.length; i++) {
    const sc = generated.scenes[i];
    const relAudio = `audio/scene-${i + 1}.mp3`;
    const absAudio = path.resolve("public", relAudio);
    const durSec = await synthesizeVoice(
      ELEVENLABS_API_KEY,
      ELEVENLABS_VOICE_ID,
      sc.narration,
      absAudio
    );
    const durationInFrames = Math.ceil((durSec + 0.45) * 30);
    console.log(`  - Scene ${i + 1}: ${durSec.toFixed(2)}s (${durationInFrames} frames)`);
    scenesWithAudio.push({
      ...sc,
      audioFile: relAudio,
      durationInFrames,
    });
  }

  const videoProps = {
    topik: generated.topik,
    judul_pendek: generated.judul_pendek,
    scenes: scenesWithAudio,
  };
  const propsPath = path.resolve("remotion/props.json");
  fs.writeFileSync(propsPath, JSON.stringify(videoProps, null, 2), "utf8");

  console.log("[3/4] Merender video Remotion -> out/video.mp4...");
  const remotionBin = path.resolve("node_modules/.bin/remotion");
  execFileSync(
    remotionBin,
    ["render", "remotion/index.ts", "KimiaSehari", "out/video.mp4", `--props=${propsPath}`],
    { stdio: "inherit" }
  );

  await saveTopic(UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, generated.topik);

  fs.writeFileSync(
    path.resolve("out/metadata.json"),
    JSON.stringify(
      {
        date: dateStr,
        topik: generated.topik,
        judul_pendek: generated.judul_pendek,
        caption: generated.caption,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`[4/4] Selesai! Video: out/video.mp4 | Topik: ${generated.topik}`);
}

main().catch((err) => {
  console.error("Generate Video Error:", err);
  process.exit(1);
});
