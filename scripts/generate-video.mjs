import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseBuffer } from "music-metadata";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { renderBangMotion, validateBangMotionHtml } from "./render-bang-motion.mjs";

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
  const slotOffset = date.getUTCHours() >= 7 ? 1 : 0;
  const category =
    DAILY_CATEGORIES[(dayOfYear * 2 + slotOffset) % DAILY_CATEGORIES.length];
  const angle =
    DAILY_ANGLES[
      (Math.floor(dayOfYear / DAILY_CATEGORIES.length) +
        date.getUTCDate() +
        slotOffset * 3) %
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
    signal: AbortSignal.timeout(120000),
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
  } = env;

  if (ANTHROPIC_API_KEY) {
    try {
      return await callClaude(ANTHROPIC_API_KEY, ANTHROPIC_MODEL, messages);
    } catch (err) {
      if (!GEMINI_API_KEY) throw err;
      console.warn(`[AI] Claude gagal (${err.message.slice(0, 120)}), fallback ke Gemini...`);
    }
  }

  if (!GEMINI_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY atau GEMINI_API_KEY belum disetel.");
  }

  const combinedPrompt = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
  const candidates = env.GEMINI_MODEL
    ? [env.GEMINI_MODEL, "gemini-4-neon", "gemini-4-argon", "gemini-4-hydrogen", "gemini-3.8-flash"]
    : ["gemini-4-neon", "gemini-4-argon", "gemini-4-hydrogen", "gemini-3.8-flash"];

  let lastErr;
  for (const model of [...new Set(candidates)]) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await callGemini(GEMINI_API_KEY, model, combinedPrompt);
      } catch (err) {
        lastErr = err;
        if (err.name !== "TimeoutError" && !/\((404|429|503)\)/.test(err.message)) {
          throw err;
        }
        if (attempt < 2 && /\((429|503)\)/.test(err.message)) {
          console.warn(`[AI] ${model} sibuk (percobaan ${attempt}), menunggu 5 detik...`);
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        console.warn(`[AI] ${model} sibuk/tidak tersedia, mencoba model berikutnya...`);
      }
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

async function synthesizeOneWithGeminiTts(apiKey, model, text, outPath, voiceName = "Puck") {
  const styledPrompt = `Bacakan naskah edukasi sains berikut dalam Bahasa Indonesia dengan gaya ramah, hangat, antusias, artikulasi jelas, dan tempo pas untuk video edukasi Reels:\n${text}`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: styledPrompt }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName } },
            },
          },
        }),
        signal: AbortSignal.timeout(45000),
      }
    );

    if (res.status === 429 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 6000));
      continue;
    }
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${model} (${res.status}): ${errText.slice(0, 140)}`);
    }

    const data = await res.json();
    const inline = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inline?.data) {
      throw new Error(`${model} tidak mengembalikan audio.`);
    }

    const rawBuf = Buffer.from(inline.data, "base64");
    const mime = String(inline.mimeType || "").toLowerCase();
    const tmpIn = `${outPath}.raw`;
    fs.writeFileSync(tmpIn, rawBuf);

    const ffArgs =
      mime.includes("pcm") || mime.includes("l16")
        ? ["-y", "-f", "s16le", "-ar", "24000", "-ac", "1", "-i", tmpIn]
        : ["-y", "-i", tmpIn];
    execFileSync(
      "ffmpeg",
      [...ffArgs, "-ar", "24000", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "128k", outPath],
      { stdio: "pipe" }
    );
    fs.rmSync(tmpIn, { force: true });

    const mp3Buf = fs.readFileSync(outPath);
    const meta = await parseBuffer(mp3Buf, "audio/mpeg");
    return meta.format.duration || 5;
  }
  throw new Error(`${model} gagal setelah retry.`);
}

/** Synthesize all scenes using a single consistent TTS engine/model so voice never changes mid-video. */
async function synthesizeAllScenes(geminiApiKey, voiceName, scenes, audioDir) {
  if (geminiApiKey) {
    for (const model of ["gemini-2.5-flash-preview-tts", "gemini-3.8-flash-tts"]) {
      try {
        const durations = [];
        for (let i = 0; i < scenes.length; i++) {
          if (i > 0) await new Promise((r) => setTimeout(r, 1200));
          const absAudio = path.join(audioDir, `scene-${i + 1}.mp3`);
          const dur = await synthesizeOneWithGeminiTts(
            geminiApiKey,
            model,
            scenes[i].narration,
            absAudio,
            voiceName
          );
          durations.push(dur);
        }
        console.log(`[TTS] Semua ${scenes.length} adegan konsisten memakai ${model} (${voiceName}).`);
        return durations;
      } catch (err) {
        console.warn(`[TTS] ${model} gagal (${err.message.slice(0, 120)}), beralih penuh ke engine berikutnya...`);
      }
    }
  }

  console.log(`[TTS] Semua ${scenes.length} adegan konsisten memakai Edge TTS (id-ID-ArdiNeural).`);
  const durations = [];
  for (let i = 0; i < scenes.length; i++) {
    const absAudio = path.join(audioDir, `scene-${i + 1}.mp3`);
    durations.push(await synthesizeWithEdgeTts(scenes[i].narration, absAudio));
  }
  return durations;
}

/** Inject __SCENE_DATA__, top progress bar, and synced subtitle overlay into Bang Motion HTML. */
function injectSceneDataAndOverlay(html, sceneData) {
  const dataScript = `<script>window.__SCENE_DATA__ = ${JSON.stringify(sceneData)};</script>`;
  const overlayHtml = `
<div id="bm-prog" style="position:fixed;top:44px;left:64px;right:64px;height:10px;border-radius:999px;background:rgba(59,40,30,0.16);overflow:hidden;z-index:35;pointer-events:none">
  <div id="bm-prog-fill" style="width:0%;height:100%;background:#2E6F40;border-radius:999px"></div>
</div>
<div id="bm-sub" style="position:fixed;bottom:110px;left:64px;right:64px;display:flex;justify-content:center;z-index:35;pointer-events:none;opacity:0">
  <div id="bm-sub-box" style="background:rgba(15,23,42,0.86);padding:18px 30px;border-radius:24px;display:flex;flex-wrap:wrap;justify-content:center;gap:8px 14px;box-shadow:0 12px 32px rgba(0,0,0,0.22)"></div>
</div>
<script>
(function(){
  const d = window.__SCENE_DATA__;
  if (!d) return;
  const fill = document.getElementById("bm-prog-fill");
  const subWrap = document.getElementById("bm-sub");
  const subBox = document.getElementById("bm-sub-box");
  window.__syncOverlay = function(t) {
    const pct = Math.min(100, Math.max(0, (t / Math.max(1, d.totalDuration)) * 100));
    if (fill) fill.style.width = pct.toFixed(2) + "%";
    const sc = (d.scenes || []).find((s) => t >= s.start && t < s.start + s.duration);
    if (!sc || !sc.narration) {
      if (subWrap) subWrap.style.opacity = "0";
      return;
    }
    if (subWrap) subWrap.style.opacity = "1";
    const words = sc.narration.trim().split(/\\s+/).filter(Boolean);
    const chunks = [];
    for (let i = 0; i < words.length; i += 4) chunks.push(words.slice(i, i + 4));
    const localProgress = Math.min(0.999, Math.max(0, (t - sc.start) / Math.max(0.1, sc.duration)));
    const chunkIdx = Math.min(chunks.length - 1, Math.floor(localProgress * chunks.length));
    const activeWords = chunks[chunkIdx] || [];
    const wordProgress = (localProgress * chunks.length) - chunkIdx;
    const activeWordIdx = Math.min(activeWords.length - 1, Math.floor(wordProgress * activeWords.length));
    if (subBox) {
      subBox.innerHTML = activeWords.map((w, idx) =>
        '<span style="font-family:Montserrat,Plus Jakarta Sans,sans-serif;font-size:42px;font-weight:800;line-height:1.25;color:' +
        (idx === activeWordIdx ? '#FDE047' : '#FFFFFF') + '">' + w.replace(/</g, '&lt;') + '</span>'
      ).join('');
    }
  };
})();
</script>`;

  let out = html
    .replace(/https?:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\/[^"']+\/gsap\.min\.js/gi, "/gsap.min.js")
    .replace(/<head([^>]*)>/i, `<head$1>\n${dataScript}`);
  if (!out.includes("__SCENE_DATA__")) {
    out = `${dataScript}\n${out}`;
  }
  if (/<\/body>/i.test(out)) {
    out = out.replace(/<\/body>/i, `${overlayHtml}\n</body>`);
  } else {
    out += overlayHtml;
  }
  return out;
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
Total durasi narasi suara harus sekitar 50-65 detik (sekitar 125-150 kata total), dibagi ke **6 sampai 7 adegan** berurutan (15-22 kata per adegan).

Sistem visual kita memakai **Bang Motion Engine** yang merender tiap adegan secara presisi & konsisten. Pilih \`visual_type\` yang paling tepat untuk tiap adegan:
- \`"hook"\`: Adegan pembuka fenomena nyata (isi \`callouts\` dengan 2 kata kunci).
- \`"zoom"\`: Transisi zoom mendekat ke zona reaksi (isi \`callouts\` dengan 2 label singkat).
- \`"molecule"\`: Struktur molekul simetris (WAJIB isi \`atoms\`, contoh: \`["C", "H", "O", "H"]\` atau \`["Fe", "O₂", "H₂O"]\`, maksimal 5 atom).
- \`"reaction"\`: Diagram mekanisme reaksi A + B -> C (WAJIB isi \`reactants\` array 2 string, \`catalyst\` string singkat, dan \`product\` string singkat).
- \`"summary"\`: Kartu ringkasan 3 poin (isi \`callouts\` dengan 3 poin singkat maks 4 kata per poin; adegan terakhir WAJIB diakhiri kalimat: Selanjutnya kita bahas apa lagi?).

Kembalikan HANYA JSON murni (tanpa markdown fence) dengan struktur:
{
  "topik": "Judul lengkap konten",
  "judul_pendek": "Judul singkat maks 6 kata (dipakai di Thumbnail Cover)",
  "caption": "Caption Instagram & TikTok lengkap dengan hashtag",
  "scenes": [
    { "id": 1, "badge": "Fakta Alam", "visual_type": "hook", "headline": "3-5 kata singkat", "narration": "15-22 kata hook penasaran...", "callouts": ["LABEL 1", "LABEL 2"] },
    { "id": 2, "badge": "Mengamati Dekat", "visual_type": "zoom", "headline": "3-5 kata singkat", "narration": "15-22 kata...", "callouts": ["ZONA REAKSI", "PERMUKAAN"] },
    { "id": 3, "badge": "Level Molekul", "visual_type": "molecule", "headline": "3-5 kata singkat", "narration": "15-22 kata...", "atoms": ["ATOM PUSAT", "ATOM 1", "ATOM 2", "ATOM 3"], "callouts": ["IKATAN KIMIA", "STABILITAS"] },
    { "id": 4, "badge": "Mekanisme Reaksi", "visual_type": "reaction", "headline": "3-5 kata singkat", "narration": "15-22 kata...", "reactants": ["Zat A", "Zat B"], "catalyst": "Enzim/Suhu", "product": "Hasil Reaksi", "callouts": ["REAKSI ALAMI", "HASIL BARU"] },
    { "id": 5, "badge": "Dampak Nyata", "visual_type": "reaction", "headline": "3-5 kata singkat", "narration": "15-22 kata...", "reactants": ["Hasil Awal", "Lingkungan"], "catalyst": "Proses Lanjut", "product": "Efek Terlihat", "callouts": ["PERUBAHAN", "MANFAAT"] },
    { "id": 6, "badge": "Ringkasan", "visual_type": "summary", "headline": "3-5 kata singkat", "narration": "15-22 kata dan WAJIB diakhiri kalimat persis: Selanjutnya kita bahas apa lagi?", "callouts": ["Poin 1 singkat", "Poin 2 singkat", "Poin 3 singkat"] }
  ]
}`;

  console.log(`[1/4] Meminta naskah & struktur visual Bang Motion ke AI...`);
  const raw = await generateWithAI(process.env, [
    { role: "user", content: prompt },
  ]);
  const generated = extractJson(raw);

  const outDir = path.resolve("out");
  const audioDir = path.join(outDir, "audio");
  fs.mkdirSync(audioDir, { recursive: true });

  console.log(`[2/4] Generate voiceover untuk ${generated.scenes.length} adegan...`);
  const coverSilenceSec = 0.45;
  let cursorSec = coverSilenceSec;
  const audioPaths = [];
  const timedScenes = [];

  for (let i = 0; i < generated.scenes.length; i++) {
    const sc = generated.scenes[i];
    if (
      i === generated.scenes.length - 1 &&
      !/selanjutnya kita bahas apa lagi/i.test(sc.narration || "")
    ) {
      sc.narration = `${String(sc.narration || "").trim()} Selanjutnya kita bahas apa lagi?`.trim();
    }
  }

  const durations = await synthesizeAllScenes(
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_TTS_VOICE || "Puck",
    generated.scenes,
    audioDir
  );

  for (let i = 0; i < generated.scenes.length; i++) {
    const sc = generated.scenes[i];
    const absAudio = path.join(audioDir, `scene-${i + 1}.mp3`);
    const durSec = durations[i];
    console.log(`  - Scene ${i + 1}: ${durSec.toFixed(2)}s (start ${cursorSec.toFixed(2)}s)`);
    audioPaths.push(absAudio);
    timedScenes.push({
      id: sc.id || i + 1,
      badge: sc.badge || "Kimia Sehari",
      visual_type: sc.visual_type || "hook",
      headline: sc.headline || generated.judul_pendek,
      atoms: sc.atoms || [],
      reactants: sc.reactants || [],
      catalyst: sc.catalyst || "",
      product: sc.product || "",
      narration: sc.narration,
      callouts: sc.callouts || [],
      start: Number(cursorSec.toFixed(3)),
      duration: Number(durSec.toFixed(3)),
    });
    cursorSec += durSec;
  }

  const sceneData = {
    topik: generated.topik,
    judul_pendek: generated.judul_pendek,
    totalDuration: Number((cursorSec + 0.4).toFixed(3)),
    scenes: timedScenes,
  };

  const sceneHtmlPath = path.join(outDir, "scene.html");
  const engineHtml = fs.readFileSync(
    path.resolve("templates/bang-motion-fallback.html"),
    "utf8"
  );
  fs.writeFileSync(
    sceneHtmlPath,
    injectSceneDataAndOverlay(engineHtml, sceneData),
    "utf8"
  );

  await validateBangMotionHtml(outDir);
  console.log("[Validate] Bang Motion Engine HTML+GSAP valid!");

  console.log("[3/4] Merender video & thumbnail Bang Motion -> out/video.mp4 & out/thumb.jpg...");
  await renderBangMotion({
    outDir,
    audioPaths,
    outMp4Path: path.join(outDir, "video.mp4"),
    outThumbPath: path.join(outDir, "thumb.jpg"),
    fps: 30,
    coverSilenceSec,
  });

  await saveTopic(UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, generated.topik);

  fs.writeFileSync(
    path.join(outDir, "metadata.json"),
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

  console.log(`[4/4] Selesai! Video: out/video.mp4 | Thumbnail: out/thumb.jpg | Topik: ${generated.topik}`);
}

main().catch((err) => {
  console.error("Generate Video Error:", err);
  process.exit(1);
});
