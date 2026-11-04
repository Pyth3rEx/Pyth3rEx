// AnNIXion-themed terminal cards for the Pyth3rEx profile.
//
// Uses github-readme-insight-terminal-ascii as a library. The hosted service
// only ships mac / windows / ubuntu, so this script repaints the "mac" theme
// in memory with the AnNIXion chrome palette, renders every card, then remaps
// any colour the library hard-codes outside the theme table (the dashboard
// keeps a private palette) so nothing off-palette reaches the SVG.
//
// Usage:  GITHUB_TOKEN=... node render.mjs <github-user> <out-dir>

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

// The dashboard's profile pane draws a cat. It is not exported, so swap it in
// the installed copy for the AnNIXion X before the library is loaded.
{
  const pkgDir = path.dirname(createRequire(import.meta.url).resolve("github-readme-insight-terminal-ascii/package.json"));
  const file = path.join(pkgDir, "src", "dashboard.js");
  const src = await readFile(file, "utf8");
  const patched = src
    .replace(/const CAT = \[[\s\S]*?\];/, [
      "const CAT = [",
      "  String.raw`  \\   /  `,",
      "  String.raw`   \\ /   `,",
      "  \"    X    \",",
      "  String.raw`   / \\   `,",
      "  String.raw`  /   \\  `",
      "];",
    ].join("\n"))
    .replace('"~ meow ~"', '"pyth3rex"');
  if (patched !== src) await writeFile(file, patched);
  else if (!src.includes('"pyth3rex"')) console.log("warn: dashboard art not patched (library changed?)");
}

const { THEMES, generateSvg } = await import("github-readme-insight-terminal-ascii");

const USER = process.argv[2] ?? "Pyth3rEx";
const OUT = process.argv[3] ?? "out";

// --- AnNIXion chrome (docs/visual-identity.md) -----------------------------
const A = {
  void: "#0E0F13",    // deepest ground
  raised: "#1A1D24",  // raised surface
  segment: "#2E323D", // segment, divider
  red: "#FF0033",     // signature accent
  text: "#DFE4EA",    // primary text
  utility: "#7A8494", // muted / utility class
  dim: "#4B515E",
  passive: "#33E62B",
  probe: "#FFD000",
  forensic: "#4A90FF",
  reverse: "#F213A0",
  nix: "#7EBAE4",
};
// Contribution ramp: void -> signature red.
const RAMP = [A.raised, "#3D0A16", "#7A0620", "#BD0328", A.red];

const FONT = "'JetBrains Mono', 'JetBrainsMono Nerd Font', Consolas, Menlo, monospace";

// --- Repaint the mac theme in place -----------------------------------------
const mac = THEMES.mac;
Object.assign(mac.palette, {
  fg: A.text, mute: A.utility, border: A.segment, accent: A.red,
  green: A.red, blue: A.nix, yellow: A.probe, purple: A.reverse,
  cyan: A.forensic, red: A.red, orange: A.probe,
  graph: [A.raised, RAMP[1], RAMP[3], A.red],
});
mac.palette.states = { open: A.passive, draft: A.utility, merged: A.reverse, closed: A.red };
Object.assign(mac, {
  title: (u) => `${u}@annixion — zsh`,
  frameBg: A.void,
  bodyBg: A.void,
  headerBg: A.raised,
  text: A.text,
  accentSuccess: A.red,
  prompt: (u) => [
    { text: `${u.toLowerCase()}@annixion`, fill: A.red },
    { text: " ", fill: A.text },
    { text: "~/ops", fill: A.nix },
    { text: " ❯ ", fill: A.text },
  ],
  command: (u) => `github-cli --user ${u}`,
  // The X: the system's recurring device, in place of traffic lights.
  controlsSvg: (x, y, s = 1) => `
    <rect x="${x - 6 * s}" y="${y - 1 * s}" width="${10 * s}" height="${2 * s}" fill="${A.utility}" />
    <rect x="${x + 14 * s}" y="${y - 5 * s}" width="${10 * s}" height="${10 * s}" fill="none" stroke="${A.utility}" stroke-width="${1.5 * s}" />
    <path d="M${x + 34 * s} ${y - 5 * s} L${x + 44 * s} ${y + 5 * s} M${x + 44 * s} ${y - 5 * s} L${x + 34 * s} ${y + 5 * s}" stroke="${A.red}" stroke-width="${2 * s}" stroke-linecap="round" />
  `,
});

// --- Colours the library hard-codes outside THEMES --------------------------
const REMAP = {
  // old mac frame
  "#292929": A.void, "#1e1e1e": A.void, "#3a3a3a": A.raised,
  // One Dark / dashboard private palette
  "#c5c8c6": A.text, "#5c6370": A.dim, "#8b949e": A.utility,
  "#98c379": A.red, "#61afef": A.nix, "#56b6c2": A.forensic,
  "#e5c07b": A.probe, "#c678dd": A.reverse, "#d19a66": A.probe,
  "#e06c75": A.red, "#f0883e": A.probe, "#4b5263": A.segment,
  "#3fb950": A.red, "#0d1117": A.void, "#30363d": A.segment,
  // GitHub green contribution levels
  "#2d333b": RAMP[0], "#0e4429": RAMP[1], "#006d32": RAMP[2],
  "#26a641": RAMP[3], "#39d353": RAMP[4],
  // Nord blocks used by the dashboard language bar
  "#3b4252": A.segment, "#bf616a": A.red, "#a3be8c": A.passive,
  "#ebcb8b": A.probe, "#81a1c1": A.forensic, "#b48ead": A.reverse,
  "#88c0d0": A.nix, "#e5e9f0": A.text,
  // mac traffic lights, if any renderer draws its own
  "#ff5f56": A.red, "#ffbd2e": A.utility, "#27c93f": A.utility,
  "#ffffff": A.text, "#a8a8a8": A.utility,
};

// Anything not in the table (GitHub's per-language colours, mostly) snaps to
// the nearest accent so no off-palette colour reaches the profile.
const ACCENTS = [A.red, A.passive, A.probe, A.forensic, A.reverse, A.nix, A.utility, A.text];
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function nearest(hex) {
  const [r, g, b] = rgb(hex);
  let best = A.utility, bestD = Infinity;
  for (const a of ACCENTS) {
    const [r2, g2, b2] = rgb(a);
    const d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (d < bestD) { bestD = d; best = a; }
  }
  return best;
}
const PALETTE_SET = new Set([...Object.values(A), A.void, "#3d0a16", "#7a0620", "#bd0328"].map((h) => h.toLowerCase()));

function repaint(svg) {
  let out = svg.replace(/#[0-9a-fA-F]{6}\b/g, (hex) => {
    const k = hex.toLowerCase();
    if (REMAP[k]) return REMAP[k];
    return PALETTE_SET.has(k) ? hex : nearest(k);
  });
  out = out
    .replace(/font-family="Consolas, Menlo, monospace"/g, `font-family="${FONT}"`)
    .replace(/font-family="Segoe UI, Arial, sans-serif"/g, `font-family="${FONT}"`)
    .replace(/@MacBook(-Pro)?/g, "@annixion")
    .replace(/github-cli dash --user/g, "github-cli dash --user");
  return out;
}

// --- What to render ---------------------------------------------------------
// Skills: the stack an operator would ask about. Simple Icons slugs.
// Each icon is recoloured to one AnNIXion class colour: the mark system
// forbids upstream logo colours ("colour classifies, silhouette identifies").
const SKILL_CLASS = {
  c: A.reverse, python: A.text, gnubash: A.text, nixos: A.nix,
  linux: A.text, kalilinux: A.red, wireshark: A.forensic,
  docker: A.utility, proxmox: A.utility, terraform: A.utility,
  ansible: A.utility, git: A.utility,
};
const SKILLS = Object.keys(SKILL_CLASS);
const PALETTE = new Set(Object.values(A).concat(RAMP).map((h) => h.toLowerCase()));

// Icon groups appear in SKILLS order. Keep ground and label colours, recolour
// everything else in the group to the icon's class.
const KEEP = new Set([A.void, A.raised, A.segment, A.utility].map((h) => h.toLowerCase()));
function classifySkills(svg) {
  let i = 0;
  return svg.replace(/<g class="list-row"[\s\S]*?<\/g>/g, (group) => {
    const colour = SKILL_CLASS[SKILLS[i++]] ?? A.utility;
    return group.replace(/#[0-9a-fA-F]{6}\b/g, (hex) => (KEEP.has(hex.toLowerCase()) ? hex : colour));
  });
}

const CARDS = [
  { file: "dashboard.svg", opts: { type: "dashboard", scale: 1 } },
  { file: "graph.svg", opts: { type: "graph" } },
  { file: "streak.svg", opts: { type: "streak" } },
  { file: "top-lang.svg", opts: { type: "top-lang", topN: 6 } },
  { file: "skills.svg", opts: { type: "skills", icons: SKILLS.join(","), perline: 6 } },
  { file: "repo-annixion.svg", opts: { type: "repo", repo: `${USER}/AnNIXion` } },
];

await mkdir(OUT, { recursive: true });
const unmapped = new Set();
let failures = 0;

for (const { file, opts } of CARDS) {
  try {
    const raw = await generateSvg({ themeName: "mac", githubId: USER, ...opts });
    // Skills are classed before the generic repaint, so brand colours never
    // get snapped to a neighbouring accent first.
    const svg = repaint(opts.type === "skills" ? classifySkills(raw) : raw);
    for (const hex of svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []) {
      if (!PALETTE.has(hex.toLowerCase())) {
        unmapped.add(hex.toLowerCase());
      }
    }
    await writeFile(path.join(OUT, file), svg);
    console.log(`ok   ${file}`);
  } catch (err) {
    failures++;
    console.error(`FAIL ${file}: ${err?.message ?? err}`);
  }
}

// Off-palette colours are reported, not fatal. Review when the library updates.
if (unmapped.size) console.log(`off-palette colours left: ${[...unmapped].join(" ")}`);
if (failures === CARDS.length) process.exit(1);
