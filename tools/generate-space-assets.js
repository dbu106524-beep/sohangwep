const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const outDir = path.join(process.cwd(), "assets", "img");

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function starField(count, width, height, seed = 1) {
  let x = seed * 9973;
  const stars = [];
  for (let i = 0; i < count; i += 1) {
    x = (x * 9301 + 49297) % 233280;
    const px = (x / 233280) * width;
    x = (x * 9301 + 49297) % 233280;
    const py = (x / 233280) * height;
    x = (x * 9301 + 49297) % 233280;
    const size = 0.7 + (x / 233280) * 2.6;
    x = (x * 9301 + 49297) % 233280;
    const opacity = 0.35 + (x / 233280) * 0.55;
    stars.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${size.toFixed(2)}" fill="#fff7d0" opacity="${opacity.toFixed(2)}"/>`);
  }
  return stars.join("\n");
}

function voxelExplorer(x, y, scale, suit = "#f6f0de", visor = "#7ee9ff", accent = "#f7b35b") {
  const s = scale;
  return `
    <g transform="translate(${x} ${y}) scale(${s})">
      <rect x="-23" y="-62" width="46" height="38" rx="8" fill="${suit}" stroke="#332b4b" stroke-width="3"/>
      <rect x="-15" y="-54" width="30" height="18" rx="5" fill="${visor}" opacity="0.95"/>
      <rect x="-10" y="-48" width="12" height="4" rx="2" fill="#ffffff" opacity="0.75"/>
      <rect x="-28" y="-27" width="56" height="58" rx="10" fill="${suit}" stroke="#332b4b" stroke-width="3"/>
      <rect x="-16" y="-18" width="32" height="18" rx="5" fill="${accent}" opacity="0.88"/>
      <rect x="-44" y="-20" width="18" height="50" rx="8" fill="${suit}" stroke="#332b4b" stroke-width="3" transform="rotate(14 -35 5)"/>
      <rect x="26" y="-20" width="18" height="50" rx="8" fill="${suit}" stroke="#332b4b" stroke-width="3" transform="rotate(-18 35 5)"/>
      <rect x="-24" y="27" width="18" height="45" rx="7" fill="${suit}" stroke="#332b4b" stroke-width="3"/>
      <rect x="6" y="27" width="18" height="45" rx="7" fill="${suit}" stroke="#332b4b" stroke-width="3"/>
      <rect x="-29" y="68" width="25" height="9" rx="4" fill="#332b4b"/>
      <rect x="3" y="68" width="25" height="9" rx="4" fill="#332b4b"/>
    </g>`;
}

function blockMonster(x, y, scale, body = "#78dfbf", horn = "#ffd06b") {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <rect x="-38" y="-36" width="76" height="68" rx="14" fill="${body}" stroke="#2d2845" stroke-width="4"/>
      <path d="M-24 -32 L-34 -58 L-8 -40 Z" fill="${horn}" stroke="#2d2845" stroke-width="4"/>
      <path d="M24 -32 L34 -58 L8 -40 Z" fill="${horn}" stroke="#2d2845" stroke-width="4"/>
      <rect x="-22" y="-16" width="16" height="16" rx="4" fill="#1d2238"/>
      <rect x="6" y="-16" width="16" height="16" rx="4" fill="#1d2238"/>
      <path d="M-17 14 Q0 27 18 14" fill="none" stroke="#1d2238" stroke-width="5" stroke-linecap="round"/>
      <rect x="-48" y="16" width="20" height="18" rx="8" fill="${body}" stroke="#2d2845" stroke-width="4"/>
      <rect x="28" y="16" width="20" height="18" rx="8" fill="${body}" stroke="#2d2845" stroke-width="4"/>
    </g>`;
}

function rocket(x, y, scale, angle = -12) {
  return `
    <g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">
      <path d="M0 -92 C42 -58 45 8 16 74 L-16 74 C-45 8 -42 -58 0 -92 Z" fill="#f9f1dc" stroke="#2c2948" stroke-width="5"/>
      <circle cx="0" cy="-24" r="19" fill="#83e8ff" stroke="#2c2948" stroke-width="5"/>
      <path d="M-18 45 L-62 86 L-28 78 Z" fill="#ff8d82" stroke="#2c2948" stroke-width="5"/>
      <path d="M18 45 L62 86 L28 78 Z" fill="#ff8d82" stroke="#2c2948" stroke-width="5"/>
      <path d="M-13 76 C-9 109 0 128 13 76 Z" fill="#ffd36f"/>
      <path d="M-22 84 C-15 126 0 151 22 84" fill="#ff9b63" opacity="0.82"/>
    </g>`;
}

function asteroid(x, y, scale, color = "#8c7460") {
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <path d="M-76 -26 C-58 -76 4 -88 55 -55 C94 -29 87 36 43 67 C-4 101 -76 76 -95 22 C-104 -4 -96 -17 -76 -26 Z" fill="${color}" stroke="#2a2942" stroke-width="5"/>
      <circle cx="-38" cy="-18" r="12" fill="#584f58" opacity="0.45"/>
      <circle cx="25" cy="-38" r="15" fill="#584f58" opacity="0.35"/>
      <circle cx="36" cy="23" r="18" fill="#584f58" opacity="0.38"/>
      <circle cx="-28" cy="42" r="10" fill="#584f58" opacity="0.3"/>
    </g>`;
}

function planet(x, y, r, c1, c2, ring = true) {
  return `
    <g transform="translate(${x} ${y})">
      ${ring ? `<ellipse cx="0" cy="6" rx="${r * 1.65}" ry="${r * 0.36}" fill="none" stroke="rgba(255,231,174,.58)" stroke-width="${Math.max(4, r * 0.08)}" transform="rotate(-10)"/>` : ""}
      <circle cx="0" cy="0" r="${r}" fill="url(#planet-${Math.round(x)}-${Math.round(y)})"/>
      <defs><radialGradient id="planet-${Math.round(x)}-${Math.round(y)}" cx="32%" cy="24%" r="82%"><stop offset="0%" stop-color="#fff1b9"/><stop offset="42%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></radialGradient></defs>
    </g>`;
}

function baseSvg(width, height, content, opts = {}) {
  const title = esc(opts.title || "warm asteroid expedition");
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="space" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0d1029"/>
        <stop offset="48%" stop-color="#171f49"/>
        <stop offset="100%" stop-color="#3a2349"/>
      </linearGradient>
      <radialGradient id="warmGlow" cx="72%" cy="36%" r="70%">
        <stop offset="0%" stop-color="#ffcf82" stop-opacity=".44"/>
        <stop offset="42%" stop-color="#c36d8d" stop-opacity=".18"/>
        <stop offset="100%" stop-color="#101733" stop-opacity="0"/>
      </radialGradient>
      <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#050713" flood-opacity=".36"/>
      </filter>
      <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <title>${title}</title>
    <rect width="${width}" height="${height}" fill="url(#space)"/>
    <rect width="${width}" height="${height}" fill="url(#warmGlow)"/>
    ${starField(width > 900 ? 190 : 70, width, height, opts.seed || 2)}
    ${content}
  </svg>`;
}

function heroSvg() {
  return baseSvg(1500, 900, `
    <path d="M1045 182 C1208 184 1332 293 1321 426 C1309 572 1151 688 970 671 C801 656 676 534 693 389 C711 245 862 180 1045 182 Z" fill="#ffb96e" opacity=".11"/>
    ${planet(1085, 358, 128, "#ffb06f", "#8759cc")}
    ${planet(1262, 198, 52, "#89f0d1", "#3f81bb", false)}
    ${asteroid(875, 635, 1.08, "#9c8064")}
    ${asteroid(1265, 615, 0.52, "#776b67")}
    ${rocket(1010, 255, 0.9, -22)}
    ${voxelExplorer(1092, 594, 1.28, "#f7edd7", "#81edff", "#ffc564")}
    ${voxelExplorer(1228, 519, 0.86, "#dee9ff", "#7df0c9", "#f49fb0")}
    ${blockMonster(898, 466, 0.82, "#7ee5c8", "#ffcd6c")}
    <path d="M772 760 C898 700 1126 706 1328 780" fill="none" stroke="#ffe4a5" stroke-opacity=".34" stroke-width="8" stroke-linecap="round"/>
    <path d="M720 312 C877 263 1094 283 1280 378" fill="none" stroke="#7bdfff" stroke-opacity=".25" stroke-width="5" stroke-linecap="round"/>
    <circle cx="823" cy="247" r="10" fill="#ffd36f" filter="url(#glow)"/>
    <circle cx="1380" cy="480" r="7" fill="#7dffca" filter="url(#glow)"/>
  `, { title: "warm cartoon asteroid expedition hero", seed: 7 });
}

function cardSvg(kind) {
  const maps = {
    starter: {
      title: "starter supply package",
      bg1: "#15234b",
      content: `${planet(398, 138, 78, "#ffd474", "#e36d86")}${rocket(164, 166, 0.58, -18)}${voxelExplorer(410, 292, 0.78)}${asteroid(205, 318, 0.52, "#8d7967")}`,
    },
    orbit: {
      title: "orbit decoration kit",
      bg1: "#192241",
      content: `${planet(318, 165, 112, "#8df2d1", "#6262d5")}${blockMonster(178, 295, 0.7, "#96e5ff", "#ffcf70")}${voxelExplorer(448, 316, 0.56, "#f8e7dc", "#82e8ff", "#ffc36d")}`,
    },
    crew: {
      title: "expedition crew",
      bg1: "#1e1b44",
      content: `${asteroid(176, 194, 0.7, "#92755d")}${voxelExplorer(292, 302, 0.68, "#f7edd7", "#7ee8ff", "#ffbd67")}${voxelExplorer(394, 270, 0.58, "#e6f0ff", "#7ff0c9", "#f9a1ba")}${blockMonster(175, 314, 0.58, "#80e3b8", "#ffd36f")}`,
    },
  };
  const selected = maps[kind] || maps.starter;
  return baseSvg(640, 420, `
    <rect x="24" y="28" width="592" height="364" rx="38" fill="${selected.bg1}" opacity=".48" stroke="#ffe3a0" stroke-opacity=".15"/>
    <path d="M40 318 C162 254 306 252 586 342" fill="none" stroke="#ffca76" stroke-opacity=".22" stroke-width="8" stroke-linecap="round"/>
    ${selected.content}
  `, { title: selected.title, seed: kind.length * 9 });
}

async function writePng(name, svg, width) {
  const target = path.join(outDir, name);
  await sharp(Buffer.from(svg)).resize({ width }).png({ quality: 92, compressionLevel: 8 }).toFile(target);
  return target;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const files = [
    await writePng("hero-expedition.png", heroSvg(), 1500),
    await writePng("product-starter.png", cardSvg("starter"), 900),
    await writePng("product-orbit.png", cardSvg("orbit"), 900),
    await writePng("scene-crew.png", cardSvg("crew"), 900),
  ];
  console.log(files.map((file) => path.relative(process.cwd(), file)).join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
