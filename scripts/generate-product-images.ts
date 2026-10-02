/**
 * Generates placeholder product renders as SVG files in public/images/products/.
 * Run: node --import tsx scripts/generate-product-images.ts
 *
 * These are deliberately simple, on-brand illustrations so the shop looks like one
 * coherent catalogue. Replace any file with real photography (keep the slug) or
 * change products.image_url in the database.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SEED_PRODUCTS } from "../lib/products/seed-data";
import type { Product } from "../types/product";

const OUT = join(process.cwd(), "public", "images", "products");
const BG = "#F3EFE8";
const CHARCOAL = "#1B1B1F";
const MUTE = "#6B665F";
const METAL = "#D9D5CE";
const METAL_DARK = "#B9B4AC";
const TERRACOTTA = "#C65D3B";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function luminance(hex: string) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function wrapName(name: string, max = 18): string[] {
  const words = name.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

const svgOpen = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img">`;
const defs = `
<defs>
  <linearGradient id="metal" x1="0" x2="1">
    <stop offset="0" stop-color="${METAL_DARK}"/>
    <stop offset="0.2" stop-color="#ECE9E3"/>
    <stop offset="0.55" stop-color="${METAL}"/>
    <stop offset="1" stop-color="${METAL_DARK}"/>
  </linearGradient>
  <radialGradient id="floor" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#1B1B1F" stop-opacity="0.18"/>
    <stop offset="1" stop-color="#1B1B1F" stop-opacity="0"/>
  </radialGradient>
</defs>`;

function base(title: string, inner: string) {
  return `${svgOpen}<title>${esc(title)}</title>${defs}
<rect width="800" height="800" fill="${BG}"/>
<ellipse cx="400" cy="690" rx="260" ry="40" fill="url(#floor)"/>
${inner}
</svg>`;
}

function label(x: number, y: number, w: number, h: number, p: Product, bandHex: string | null) {
  const isLight = bandHex ? luminance(bandHex) > 0.6 : true;
  const band = bandHex ?? "#FFFFFF";
  const text = isLight ? CHARCOAL : "#FAF8F5";
  const sub = isLight ? MUTE : "rgba(250,248,245,0.78)";
  const compact = w < 230;
  const nameSize = compact ? 20 : 26;
  const lineH = compact ? 24 : 30;
  const nameLines = wrapName(p.name, compact ? 15 : 18);
  const nameY = y + h * 0.36;
  const names = nameLines
    .map((l, i) => `<text x="${x + w / 2}" y="${nameY + i * lineH}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${nameSize}" fill="${text}">${esc(l)}</text>`)
    .join("");
  const after = nameY + nameLines.length * lineH + 6;
  const colour = p.colourName
    ? `<text x="${x + w / 2}" y="${after + 10}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${compact ? 14 : 17}" fill="${sub}">${esc(p.colourName)}${p.finish ? " · " + esc(p.finish) : ""}</text>`
    : p.finish
      ? `<text x="${x + w / 2}" y="${after + 10}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="17" fill="${sub}">${esc(p.finish)}</text>`
      : "";
  return `
<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${band}" stroke="${isLight ? "#D6CFC4" : "rgba(0,0,0,0.15)"}" stroke-width="1.5"/>
<text x="${x + w / 2}" y="${y + 38}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" letter-spacing="4" font-weight="700" fill="${isLight ? TERRACOTTA : "#F2C4B3"}">PRIMECOAT</text>
<line x1="${x + w / 2 - 22}" y1="${y + 50}" x2="${x + w / 2 + 22}" y2="${y + 50}" stroke="${isLight ? TERRACOTTA : "#F2C4B3"}" stroke-width="1.5"/>
${names}
${colour}
<text x="${x + w / 2}" y="${y + h - 22}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="700" fill="${text}">${esc(p.size ?? "")}</text>`;
}

function tin(p: Product) {
  const hex = p.colourHex;
  // 4 L cylinder
  const x = 250, w = 300, top = 220, bottom = 650;
  const lid = hex ?? METAL;
  return base(`${p.name} ${p.size ?? ""}`, `
<rect x="${x}" y="${top}" width="${w}" height="${bottom - top}" fill="url(#metal)"/>
<ellipse cx="400" cy="${bottom}" rx="${w / 2}" ry="26" fill="${METAL_DARK}"/>
<rect x="${x}" y="${top}" width="${w}" height="${bottom - top - 26}" fill="url(#metal)"/>
${label(x + 14, 300, w - 28, 290, p, hex)}
<ellipse cx="400" cy="${top}" rx="${w / 2}" ry="26" fill="${METAL_DARK}"/>
<ellipse cx="400" cy="${top - 4}" rx="${w / 2 - 10}" ry="22" fill="${lid}" stroke="${METAL_DARK}" stroke-width="2"/>
<ellipse cx="400" cy="${top - 4}" rx="${w / 2 - 40}" ry="14" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="2"/>
<path d="M ${x + 20} ${top + 6} Q 400 ${top - 120} ${x + w - 20} ${top + 6}" fill="none" stroke="${CHARCOAL}" stroke-width="7" stroke-linecap="round"/>
<circle cx="${x + 20}" cy="${top + 8}" r="7" fill="${CHARCOAL}"/><circle cx="${x + w - 20}" cy="${top + 8}" r="7" fill="${CHARCOAL}"/>`);
}

function bucket(p: Product) {
  const hex = p.colourHex;
  const lid = hex ?? METAL;
  return base(`${p.name} ${p.size ?? ""}`, `
<path d="M 215 200 L 585 200 L 555 660 L 245 660 Z" fill="url(#metal)"/>
<ellipse cx="400" cy="660" rx="155" ry="24" fill="${METAL_DARK}"/>
<path d="M 215 200 L 585 200 L 556 650 L 244 650 Z" fill="url(#metal)"/>
${label(252, 280, 296, 300, p, hex)}
<ellipse cx="400" cy="200" rx="185" ry="30" fill="${METAL_DARK}"/>
<ellipse cx="400" cy="195" rx="175" ry="26" fill="${lid}" stroke="${METAL_DARK}" stroke-width="2"/>
<ellipse cx="400" cy="195" rx="120" ry="16" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="2"/>
<path d="M 232 206 Q 400 70 568 206" fill="none" stroke="${CHARCOAL}" stroke-width="8" stroke-linecap="round"/>
<rect x="362" y="92" width="76" height="22" rx="6" fill="${CHARCOAL}"/>
<circle cx="232" cy="208" r="8" fill="${CHARCOAL}"/><circle cx="568" cy="208" r="8" fill="${CHARCOAL}"/>`);
}

function can(p: Product) {
  const hex = p.colourHex;
  const lid = hex ?? METAL;
  const x = 290, w = 220, top = 290, bottom = 640;
  return base(`${p.name} ${p.size ?? ""}`, `
<rect x="${x}" y="${top}" width="${w}" height="${bottom - top}" fill="url(#metal)"/>
<ellipse cx="400" cy="${bottom}" rx="${w / 2}" ry="20" fill="${METAL_DARK}"/>
<rect x="${x}" y="${top}" width="${w}" height="${bottom - top - 20}" fill="url(#metal)"/>
${label(x + 10, 340, w - 20, 250, p, hex)}
<ellipse cx="400" cy="${top}" rx="${w / 2}" ry="20" fill="${METAL_DARK}"/>
<ellipse cx="400" cy="${top - 3}" rx="${w / 2 - 8}" ry="16" fill="${lid}" stroke="${METAL_DARK}" stroke-width="2"/>
<rect x="378" y="${top - 30}" width="44" height="18" rx="3" fill="${METAL_DARK}"/>
<rect x="384" y="${top - 44}" width="32" height="16" rx="3" fill="${CHARCOAL}"/>`);
}

function brandMark(y: number) {
  return `<text x="400" y="${y}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="14" letter-spacing="5" font-weight="700" fill="${TERRACOTTA}">PRIMECOAT</text>`;
}

function caption(p: Product, y = 705) {
  return `<text x="400" y="${y}" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="${CHARCOAL}">${esc(p.name)}</text>
<text x="400" y="${y + 32}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="17" fill="${MUTE}">${esc(p.size ?? "")}</text>`;
}

function rollerSleeve(p: Product) {
  const sleeve = (x: number, y: number) => `
<rect x="${x}" y="${y}" width="420" height="110" rx="55" fill="#FFFDF9" stroke="#D6CFC4" stroke-width="2"/>
<ellipse cx="${x + 420}" cy="${y + 55}" rx="22" ry="55" fill="#EFEAE2" stroke="#D6CFC4" stroke-width="2"/>
<ellipse cx="${x + 420}" cy="${y + 55}" rx="9" ry="22" fill="${METAL_DARK}"/>
${Array.from({ length: 28 }, (_, i) => `<line x1="${x + 20 + i * 14}" y1="${y + 8}" x2="${x + 12 + i * 14}" y2="${y + 102}" stroke="#E3DDD3" stroke-width="3" stroke-linecap="round"/>`).join("")}
<rect x="${x + 150}" y="${y + 30}" width="120" height="50" rx="4" fill="${TERRACOTTA}"/>
<text x="${x + 210}" y="${y + 61}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" letter-spacing="3" font-weight="700" fill="#FAF8F5">PRIMECOAT</text>`;
  return base(p.name, `${sleeve(170, 230)}${sleeve(210, 400)}${caption(p)}`);
}

function rollerFrame(p: Product) {
  return base(p.name, `
<line x1="150" y1="640" x2="470" y2="250" stroke="#A8A49C" stroke-width="22" stroke-linecap="round"/>
<line x1="150" y1="640" x2="310" y2="445" stroke="${CHARCOAL}" stroke-width="26" stroke-linecap="round"/>
<rect x="296" y="420" width="48" height="60" rx="8" transform="rotate(-51 320 450)" fill="${TERRACOTTA}"/>
<path d="M 470 250 L 520 205 L 530 170" fill="none" stroke="${METAL_DARK}" stroke-width="10" stroke-linecap="round"/>
<rect x="520" y="60" width="90" height="240" rx="45" fill="#FFFDF9" stroke="#D6CFC4" stroke-width="2"/>
${Array.from({ length: 14 }, (_, i) => `<line x1="${530}" y1="${80 + i * 15}" x2="${600}" y2="${74 + i * 15}" stroke="#E3DDD3" stroke-width="3" stroke-linecap="round"/>`).join("")}
${brandMark(560)}${caption(p, 620)}`);
}

function brushSet(p: Product) {
  const brush = (cx: number, w: number, h: number) => `
<rect x="${cx - w / 2}" y="${520 - h}" width="${w}" height="${h}" rx="4" fill="#F4EBDC" stroke="#D6CFC4" stroke-width="2"/>
${Array.from({ length: Math.floor(w / 6) }, (_, i) => `<line x1="${cx - w / 2 + 4 + i * 6}" y1="${520 - h + 8}" x2="${cx - w / 2 + 4 + i * 6}" y2="${518}" stroke="#E6DCCB" stroke-width="2"/>`).join("")}
<rect x="${cx - w / 2 - 4}" y="520" width="${w + 8}" height="34" fill="url(#metal)" stroke="${METAL_DARK}"/>
<rect x="${cx - 16}" y="554" width="32" height="150" rx="10" fill="#8A5A3C"/>
<rect x="${cx - 16}" y="554" width="32" height="40" rx="10" fill="${TERRACOTTA}"/>`;
  return base(p.name, `${brush(250, 60, 90)}${brush(400, 110, 110)}${brush(575, 160, 130)}${brandMark(140)}
<text x="400" y="190" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="${CHARCOAL}">${esc(p.name)}</text>
<text x="400" y="222" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="17" fill="${MUTE}">${esc(p.size ?? "")}</text>`);
}

function mixer(p: Product) {
  return base(p.name, `
<rect x="388" y="110" width="24" height="420" fill="url(#metal)" stroke="${METAL_DARK}"/>
<rect x="380" y="110" width="40" height="70" fill="${METAL_DARK}"/>
<path d="M 400 480 C 300 500 300 560 400 580 C 500 600 500 660 400 680" fill="none" stroke="${CHARCOAL}" stroke-width="16" stroke-linecap="round"/>
<path d="M 400 480 C 500 500 500 560 400 580 C 300 600 300 660 400 680" fill="none" stroke="${CHARCOAL}" stroke-width="16" stroke-linecap="round" opacity="0.7"/>
<circle cx="400" cy="680" r="18" fill="${TERRACOTTA}"/>
${brandMark(60)}
<text x="400" y="750" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="${CHARCOAL}">${esc(p.name)}</text>`);
}

function tape(p: Product) {
  return base(p.name, `
<circle cx="400" cy="400" r="230" fill="#F2E3B5" stroke="#D9C98F" stroke-width="2"/>
<circle cx="400" cy="400" r="120" fill="${BG}" stroke="#D9C98F" stroke-width="2"/>
<circle cx="400" cy="400" r="226" fill="none" stroke="#E8D7A0" stroke-width="12" opacity="0.6"/>
<path d="M 400 170 L 660 170 L 690 230 L 400 230 Z" fill="#F7EBC3" stroke="#D9C98F" stroke-width="2"/>
<rect x="520" y="372" width="140" height="56" rx="4" fill="${TERRACOTTA}"/>
<text x="590" y="406" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" letter-spacing="3" font-weight="700" fill="#FAF8F5">PRIMECOAT</text>
${caption(p, 715)}`);
}

function sandpaper(p: Product) {
  const sheet = (dx: number, dy: number, fill: string) => `
<rect x="${200 + dx}" y="${210 + dy}" width="360" height="280" fill="${fill}" stroke="#C4B9A6" stroke-width="2" transform="rotate(${dx / 2} 400 400)"/>`;
  return base(p.name, `${sheet(-30, 60, "#C9B899")}${sheet(-10, 30, "#D8C8A8")}${sheet(10, 0, "#E2D5B9")}
<rect x="230" y="200" width="360" height="280" fill="#EADFC6" stroke="#C4B9A6" stroke-width="2"/>
${Array.from({ length: 220 }, (_, i) => `<circle cx="${240 + (i * 37) % 340}" cy="${210 + Math.floor((i * 37) / 340) * 11}" r="1.6" fill="#B7A787"/>`).join("")}
<rect x="250" y="400" width="140" height="60" fill="${CHARCOAL}"/>
<text x="320" y="427" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" letter-spacing="3" font-weight="700" fill="#FAF8F5">PRIMECOAT</text>
<text x="320" y="447" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="#E8E3DC">P80 · P120 · P180 · P240</text>
${caption(p, 715)}`);
}

function tray(p: Product) {
  return base(p.name, `
<path d="M 160 280 L 640 280 L 600 560 L 200 560 Z" fill="${CHARCOAL}"/>
<path d="M 190 300 L 610 300 L 580 540 L 220 540 Z" fill="#2E2E34"/>
<path d="M 190 300 L 610 300 L 596 410 L 204 410 Z" fill="#3C3C43"/>
${Array.from({ length: 8 }, (_, i) => `<line x1="${215 + i * 48}" y1="320" x2="${212 + i * 48}" y2="400" stroke="#555560" stroke-width="3"/>`).join("")}
<path d="M 204 410 L 596 410 L 580 540 L 220 540 Z" fill="#C65D3B"/>
<path d="M 204 410 L 596 410 L 592 440 L 208 440 Z" fill="#D27659" opacity="0.8"/>
${brandMark(160)}${caption(p, 650)}`);
}

function dropCloth(p: Product) {
  return base(p.name, `
<path d="M 160 520 L 640 520 L 600 600 L 200 600 Z" fill="#E3D8C3" stroke="#C9BCA3" stroke-width="2"/>
<path d="M 180 440 L 620 440 L 600 520 L 200 520 Z" fill="#EADFCB" stroke="#C9BCA3" stroke-width="2"/>
<path d="M 200 360 L 600 360 L 580 440 L 220 440 Z" fill="#F0E6D4" stroke="#C9BCA3" stroke-width="2"/>
<path d="M 240 300 Q 400 240 560 300 L 540 360 L 260 360 Z" fill="#F5ECDC" stroke="#C9BCA3" stroke-width="2"/>
<rect x="330" y="470" width="140" height="34" rx="2" fill="${TERRACOTTA}"/>
<text x="400" y="493" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="12" letter-spacing="3" font-weight="700" fill="#FAF8F5">PRIMECOAT</text>
${caption(p, 690)}`);
}

function render(p: Product): string {
  switch (p.slug) {
    case "microfibre-roller-sleeve-230mm-2pk": return rollerSleeve(p);
    case "roller-frame-extension-pole-set": return rollerFrame(p);
    case "professional-brush-set-3pc": return brushSet(p);
    case "paint-mixer-drill-attachment": return mixer(p);
    case "painters-masking-tape-48mm": return tape(p);
    case "sandpaper-assortment-pack": return sandpaper(p);
    case "paint-tray-with-liner-230mm": return tray(p);
    case "cotton-drop-cloth-3-6x2-7m": return dropCloth(p);
  }
  if (p.size?.startsWith("20")) return bucket(p);
  if (p.size?.startsWith("1 L")) return can(p);
  return tin(p);
}

mkdirSync(OUT, { recursive: true });
for (const p of SEED_PRODUCTS) {
  writeFileSync(join(OUT, `${p.slug}.svg`), render(p));
}
console.log(`Wrote ${SEED_PRODUCTS.length} product images to ${OUT}`);
