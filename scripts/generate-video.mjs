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
    ? [env.GEMINI_MODEL, "gemini-4-hydrogen", "gemini-3.8-flash"]
    : ["gemini-4-hydrogen", "gemini-3.8-flash"];

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
Total durasi narasi suara harus sekitar 50-65 detik (sekitar 125-150 kata total), dibagi ke **6 sampai 8 adegan** berurutan (15-22 kata per adegan).

Kamu juga harus menulis file HTML tunggal yang lengkap di key "html_code" mengikuti arsitektur **Bang Motion (HTML + CSS + GSAP 3.12.5)**!

Aturan ketat untuk "html_code" (disimpan ke out/scene.html, dirender Puppeteer di viewport 1080x1920):
1. Muat GSAP dari \`https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js\` dan Google Font \`Plus Jakarta Sans\`.
2. Baca data timing & judul dari \`window.__SCENE_DATA__\` (berisi \`{ judul_pendek, topik, totalDuration, scenes: [{ badge, start, duration, callouts }] }\`).
3. **WAJIB ADA COVER THUMBNAIL DI FRAME 0 (\`t = 0.0s .. 0.45s\`)**:
   - Elemen \`#cover\` menutupi layar penuh pada \`t = 0\` dengan latar **Cream / White Bone (\`#F7F4EC\`)**, badge \`KIMIA SEHARI\` (\`#2E6F40\`), dan **\`judul_pendek\`** berukuran besar (70–78px, tebal 900, warna \`#3B281E\`) di tengah layar — agar frame 0 menjadi thumbnail video yang rapi & terbaca jelas.
   - Pada \`t = 0.35s\`, animasikan \`#cover\` keluar mulus (\`opacity: 0, scale: 1.06, duration: 0.45, ease: "power3.inOut"\`) menuju Adegan 1!
4. **Hukum Bang Motion Anti-PPT**:
   - Latar belakang hangat **Cream / White Bone (\`#F7F4EC\` / \`#FAF8F3\`)** dengan 2 glow orb lembut yang bergerak perlahan sepanjang \`totalDuration\`.
   - Tata letak 3 zona anti-tumpang-tindih: Header di \`top: 96px\` (\`left: 56px, right: 56px\`), panggung visual di \`top: 200px; bottom: 340px\` (ruang \`bottom: 340px\` HARUS kosong untuk subtitle), callout pills \`#FFFFFF\` berteks \`#3B281E\` di bawah SVG.
   - Satu dunia/kamera GSAP yang hidup (kamera bernapas/zoom ke zona reaksi, SVG \`strokeDashoffset\` panah menggambar diri, partikel/molekul bergerak, pergantian adegan memakai \`tl.call(...)\` atau \`tl.to(...)\` di waktu \`sc.start\`).
   - DILARANG menaruh teks panjang di dalam SVG.
5. **Kontrak Timeline WAJIB**:
   - Buat \`const tl = gsap.timeline({ paused: true });\` dengan \`tl.to({}, { duration: 0.01 }, data.totalDuration);\` di akhir.
   - Set \`window.OPENER = { tl, DURATION: data.totalDuration, ready: true };\`
   - Jika \`!location.search.includes("clean=1")\`, jalankan \`tl.repeat(-1).play(0);\`.

Kembalikan HANYA JSON murni (tanpa markdown fence) dengan struktur:
{
  "topik": "Judul lengkap konten",
  "judul_pendek": "Judul singkat maks 6 kata",
  "caption": "Caption Instagram & TikTok lengkap dengan hashtag",
  "scenes": [
    { "id": 1, "badge": "Fakta Alam", "narration": "15-22 kata hook penasaran...", "callouts": ["LABEL 1", "LABEL 2"] },
    { "id": 2, "badge": "Pengamatan Awal", "narration": "15-22 kata...", "callouts": ["LABEL 1", "LABEL 2"] },
    { "id": 3, "badge": "Zoom Lebih Dekat", "narration": "15-22 kata...", "callouts": ["LABEL 1", "LABEL 2"] },
    { "id": 4, "badge": "Level Molekul", "narration": "15-22 kata...", "callouts": ["MOLEKUL A", "MOLEKUL B"] },
    { "id": 5, "badge": "Proses Reaksi", "narration": "15-22 kata...", "callouts": ["PROSES", "KATALIS"] },
    { "id": 6, "badge": "Hasil Reaksi", "narration": "15-22 kata...", "callouts": ["HASIL", "EFEK NYATA"] },
    { "id": 7, "badge": "Ringkasan", "narration": "15-22 kata dan WAJIB diakhiri dengan kalimat persis: Selanjutnya kita bahas apa lagi?", "callouts": ["POIN 1", "POIN 2"] }
  ],
  "html_code": "<!doctype html>..."
}`;

  console.log(`[1/4] Meminta naskah & kode Bang Motion HTML+GSAP ke AI...`);
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
    const absAudio = path.join(audioDir, `scene-${i + 1}.mp3`);
    const durSec = await synthesizeVoice(
      ELEVENLABS_API_KEY,
      ELEVENLABS_VOICE_ID,
      sc.narration,
      absAudio
    );
    console.log(`  - Scene ${i + 1}: ${durSec.toFixed(2)}s (start ${cursorSec.toFixed(2)}s)`);
    audioPaths.push(absAudio);
    timedScenes.push({
      id: sc.id || i + 1,
      badge: sc.badge || "Kimia Sehari",
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
  const fallbackHtmlPath = path.resolve("templates/bang-motion-fallback.html");

  fs.writeFileSync(
    sceneHtmlPath,
    injectSceneDataAndOverlay(generated.html_code || "", sceneData),
    "utf8"
  );

  try {
    await validateBangMotionHtml(outDir);
    console.log("[Validate] Bang Motion HTML+GSAP valid!");
  } catch (err) {
    console.warn(`[Validate] Gagal percobaan pertama (${err.message}), meminta AI memperbaiki...`);
    let ok = false;
    try {
      const fixRaw = await generateWithAI(process.env, [
        { role: "user", content: prompt },
        { role: "assistant", content: raw },
        {
          role: "user",
          content: `HTML/GSAP kamu gagal validasi di Puppeteer:\n${err.message}\n\nPerbaiki ONLY "html_code" dan kembalikan JSON murni: { "html_code": "..." }`,
        },
      ]);
      const fixed = extractJson(fixRaw);
      if (fixed.html_code) {
        fs.writeFileSync(
          sceneHtmlPath,
          injectSceneDataAndOverlay(fixed.html_code, sceneData),
          "utf8"
        );
        await validateBangMotionHtml(outDir);
        console.log("[Validate] Bang Motion HTML+GSAP valid setelah perbaikan!");
        ok = true;
      }
    } catch {
      ok = false;
    }

    if (!ok) {
      console.warn("[Validate] Masih gagal, menggunakan templates/bang-motion-fallback.html.");
      const fallbackHtml = fs.readFileSync(fallbackHtmlPath, "utf8");
      fs.writeFileSync(
        sceneHtmlPath,
        injectSceneDataAndOverlay(fallbackHtml, sceneData),
        "utf8"
      );
    }
  }

  console.log("[3/4] Merender video & thumbnail Bang Motion -> out/video.mp4 & out/thumb.jpg...");
  try {
    await renderBangMotion({
      outDir,
      audioPaths,
      outMp4Path: path.join(outDir, "video.mp4"),
      outThumbPath: path.join(outDir, "thumb.jpg"),
      fps: 30,
      coverSilenceSec,
    });
  } catch (renderErr) {
    console.warn(`[Render] Gagal pada HTML AI (${renderErr.message}), fallback ke templates/bang-motion-fallback.html...`);
    const fallbackHtml = fs.readFileSync(fallbackHtmlPath, "utf8");
    fs.writeFileSync(
      sceneHtmlPath,
      injectSceneDataAndOverlay(fallbackHtml, sceneData),
      "utf8"
    );
    await renderBangMotion({
      outDir,
      audioPaths,
      outMp4Path: path.join(outDir, "video.mp4"),
      outThumbPath: path.join(outDir, "thumb.jpg"),
      fps: 30,
      coverSilenceSec,
    });
  }

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
