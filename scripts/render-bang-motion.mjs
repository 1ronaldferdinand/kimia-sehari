import { execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import puppeteer from "puppeteer";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".mp3": "audio/mpeg",
};

function startStaticServer(rootDir) {
  const localGsap = path.resolve("node_modules/gsap/dist/gsap.min.js");
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const reqPath = (req.url || "/").split("?")[0];
      if (reqPath === "/gsap.min.js" && fs.existsSync(localGsap)) {
        res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
        fs.createReadStream(localGsap).pipe(res);
        return;
      }
      const safePath = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, "");
      const filePath = path.join(rootDir, safePath === "/" ? "scene.html" : safePath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      resolve({ server, port: addr.port });
    });
  });
}

function concatAudioWithCoverSilence(audioPaths, outAudioPath, coverSilenceSec = 0.45) {
  const silencePath = path.join(path.dirname(outAudioPath), "silence-cover.mp3");
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-f", "lavfi",
      "-i", "anullsrc=r=24000:cl=mono",
      "-t", String(coverSilenceSec),
      "-c:a", "libmp3lame",
      "-b:a", "48k",
      silencePath,
    ],
    { stdio: "pipe" }
  );

  const listPath = path.join(path.dirname(outAudioPath), "concat.txt");
  const entries = [silencePath, ...audioPaths].map(
    (p) => `file '${path.resolve(p).replace(/'/g, "'\\''")}'`
  );
  fs.writeFileSync(listPath, entries.join("\n"), "utf8");

  execFileSync(
    "ffmpeg",
    ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outAudioPath],
    { stdio: "pipe" }
  );
}

/** Validate scene.html in headless Chrome; throws if window.OPENER fails to initialize. */
export async function validateBangMotionHtml(outDir) {
  const { server, port } = await startStaticServer(outDir);
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${port}/scene.html?clean=1`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    await page.waitForFunction(
      "window.OPENER && window.OPENER.ready && window.OPENER.tl && window.OPENER.DURATION > 1",
      { timeout: 15000, polling: 200 }
    );
    if (errors.length > 0) {
      throw new Error(`Page JS error: ${errors.join("; ")}`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

/** Render Bang Motion HTML + audio tracks to MP4 and Frame-0 JPEG thumbnail. */
export async function renderBangMotion({
  outDir,
  audioPaths,
  outMp4Path,
  outThumbPath,
  fps = 30,
  coverSilenceSec = 0.45,
}) {
  const framesDir = path.join(outDir, "frames");
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const fullAudioPath = path.join(outDir, "audio", "full.mp3");
  concatAudioWithCoverSilence(audioPaths, fullAudioPath, coverSilenceSec);

  const { server, port } = await startStaticServer(outDir);
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.warn("[PageError]", e.message));
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${port}/scene.html?clean=1`, {
      waitUntil: "load",
      timeout: 60000,
    });
    await page.waitForFunction(
      "window.OPENER && window.OPENER.ready && window.OPENER.tl",
      { timeout: 60000, polling: 200 }
    );
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      window.OPENER.tl.pause(0);
    });

    const duration = await page.evaluate(() => Number(window.OPENER.DURATION));
    const totalFrames = Math.ceil(duration * fps);
    console.log(`[Render] ${totalFrames} frames @ ${fps}fps (${duration.toFixed(2)}s)...`);

    for (let i = 0; i < totalFrames; i++) {
      const t = i / fps;
      await page.evaluate(async (time) => {
        window.OPENER.tl.time(time);
        if (window.__syncOverlay) window.__syncOverlay(time);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }, t);

      const framePath = path.join(framesDir, `f${String(i).padStart(5, "0")}.png`);
      await page.screenshot({
        path: framePath,
        clip: { x: 0, y: 0, width: 1080, height: 1920 },
        optimizeForSpeed: true,
      });

      if (i === 0 && outThumbPath) {
        await page.screenshot({
          path: outThumbPath,
          type: "jpeg",
          quality: 90,
          clip: { x: 0, y: 0, width: 1080, height: 1920 },
        });
      }

      if (i > 0 && i % 300 === 0) {
        console.log(`  - Progress: ${i}/${totalFrames} frames`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log("[FFmpeg] Menggabungkan frame PNG + audio -> MP4...");
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-framerate", String(fps),
      "-i", path.join(framesDir, "f%05d.png"),
      "-i", fullAudioPath,
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-crf", "18",
      "-preset", "veryfast",
      "-c:a", "aac",
      "-b:a", "128k",
      "-shortest",
      "-movflags", "+faststart",
      outMp4Path,
    ],
    { stdio: "inherit" }
  );

  fs.rmSync(framesDir, { recursive: true, force: true });
}
