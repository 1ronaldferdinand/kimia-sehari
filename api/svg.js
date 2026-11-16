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

export function buildHookSvg(content) {
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

export function buildZoomInTransitionSvg(content) {
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

export function buildMicroscopeSvg(content) {
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

export function buildMechanismSvg(content) {
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

export function buildOutroSvg(content) {
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

const SCENE_BUILDERS = {
  "1": buildHookSvg,
  "2": buildZoomInTransitionSvg,
  "3": buildMicroscopeSvg,
  "4": buildMechanismSvg,
  "5": buildOutroSvg,
};

/** Serve rendered SVG illustrations over HTTPS so Creatomate can download them. */
export default function handler(req, res) {
  const { scene = "1", d = "" } = req.query || {};
  const builder = SCENE_BUILDERS[String(scene)];
  if (!builder) {
    return res.status(400).json({ error: "Invalid scene" });
  }

  let content = {};
  if (d) {
    try {
      content = JSON.parse(Buffer.from(String(d), "base64url").toString("utf8"));
    } catch {
      return res.status(400).json({ error: "Invalid payload" });
    }
  }

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  return res.status(200).send(builder(content));
}
