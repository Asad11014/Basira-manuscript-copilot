export const DEMO_MODEL = {
  name: "Basira local demo fixture",
  transcribeVersion: "demo-transcribe-v1",
  translateVersion: "demo-translate-v1",
} as const;

export const DEMO_TRANSCRIPTION_CONFIDENCE = 0.92;

export const DEMO_SOURCE_LINES = [
  "بسم الله الرحمن الرحيم",
  "قال المصنف رحمه الله تعالى:",
  "إن العلم نور يهدي صاحبه إلى حسن النظر والعمل.",
  "ومن طلب الحكمة بالصبر والرفق انفتح له باب الفهم.",
  "وعلى الطالب أن يقيد الفوائد ويعرضها على أهل الدراية.",
  "تمت الورقة بعون الله وحسن توفيقه.",
] as const;

export const DEMO_SOURCE_TEXT = DEMO_SOURCE_LINES.join("\n");

export const DEMO_TRANSLATION_LINES = {
  en: [
    "In the name of God, the Most Compassionate, the Most Merciful.",
    "The author, may God have mercy on him, said:",
    "Knowledge is a light that guides its bearer toward sound judgment and action.",
    "Whoever seeks wisdom with patience and gentleness will have the door of understanding opened.",
    "The student should record useful points and present them to people of discernment.",
    "The folio is completed with God's help and gracious success.",
  ],
  fr: [
    "Au nom de Dieu, le Tout Misericordieux, le Tres Misericordieux.",
    "L'auteur, que Dieu lui fasse misericorde, a dit:",
    "La science est une lumiere qui guide son porteur vers le bon jugement et l'action juste.",
    "Celui qui cherche la sagesse avec patience et douceur verra s'ouvrir la porte de la comprehension.",
    "L'etudiant doit noter les enseignements utiles et les soumettre aux gens de discernement.",
    "Le feuillet est acheve avec l'aide de Dieu et Sa bienveillante reussite.",
  ],
  de: [
    "Im Namen Gottes, des Allerbarmers, des Barmherzigen.",
    "Der Verfasser, Gott erbarme sich seiner, sagte:",
    "Wissen ist ein Licht, das seinen Trager zu klarem Urteil und rechtem Handeln fuhrt.",
    "Wer Weisheit mit Geduld und Sanftmut sucht, dem offnet sich die Tur des Verstehens.",
    "Der Lernende soll nutzliche Hinweise festhalten und sie kundigen Menschen vorlegen.",
    "Das Blatt ist mit Gottes Hilfe und gutem Gelingen vollendet.",
  ],
} as const;

export const DEMO_GLOSSES = [
  { term: "نور", gloss: "Light, used here as a metaphor for guidance." },
  {
    term: "حكمة",
    gloss: "Wisdom, practical understanding joined to right action.",
  },
  {
    term: "أهل الدراية",
    gloss: "People of discernment or specialist knowledge.",
  },
] as const;

export const DEMO_PROJECT_GLOSSARY = [
  { term: "نور", gloss: "light, guidance" },
  { term: "حكمة", gloss: "wisdom" },
  { term: "أهل الدراية", gloss: "specialists; people of discernment" },
] as const;

export const DEMO_PAGE_REGIONS = [
  {
    id: "demo-region-textblock",
    type: "textblock",
    order: 0,
    bbox: { x: 0.13, y: 0.18, w: 0.74, h: 0.46 },
  },
  ...DEMO_SOURCE_LINES.map((_, index) => ({
    id: `demo-region-line-${index + 1}`,
    type: "line",
    order: index + 1,
    bbox: { x: 0.17, y: 0.205 + index * 0.066, w: 0.66, h: 0.04 },
  })),
] as const;

export function demoTranslationTextFor(targetLang: string): string {
  const key = targetLang.toLowerCase() as keyof typeof DEMO_TRANSLATION_LINES;
  return (DEMO_TRANSLATION_LINES[key] ?? DEMO_TRANSLATION_LINES.en).join("\n");
}

export function demoAlignmentFor(targetLang: string) {
  const key = targetLang.toLowerCase() as keyof typeof DEMO_TRANSLATION_LINES;
  const targetLines = DEMO_TRANSLATION_LINES[key] ?? DEMO_TRANSLATION_LINES.en;
  return DEMO_SOURCE_LINES.map((source, index) => ({
    source,
    target: targetLines[index] ?? "",
  }));
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildDemoPageSvg(): Buffer {
  const lines = DEMO_SOURCE_LINES.map(
    (line, index) =>
      `<text x="450" y="${270 + index * 78}">${escapeXml(line)}</text>`,
  ).join("\n        ");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
  <rect width="900" height="1200" fill="#efe3c8"/>
  <rect x="54" y="54" width="792" height="1092" rx="18" fill="#f9f2df" stroke="#8f6b3d" stroke-width="3"/>
  <rect x="92" y="96" width="716" height="1010" rx="12" fill="#fffaf0" stroke="#d5bd87" stroke-width="1.5"/>
  <path d="M138 184 C270 154 617 154 762 184" fill="none" stroke="#b58a45" stroke-width="4"/>
  <text x="450" y="158" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#8f5f2a">Basira local demo leaf</text>
  <g direction="rtl" unicode-bidi="plaintext" text-anchor="middle"
     font-family="'Noto Naskh Arabic', 'Amiri', 'Geeza Pro', serif"
     font-size="42" fill="#2d241a">
        ${lines}
  </g>
  <g direction="rtl" unicode-bidi="plaintext" text-anchor="end"
     font-family="'Noto Naskh Arabic', 'Amiri', 'Geeza Pro', serif"
     font-size="25" fill="#76562e">
    <text x="776" y="752">حاشية: يراجع لفظ الدراية</text>
    <text x="776" y="796">في النسخة الثانية.</text>
  </g>
  <line x1="170" y1="868" x2="730" y2="868" stroke="#c6aa70" stroke-width="2"/>
  <text x="450" y="930" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#8f5f2a">
    Synthetic manuscript image for local product demos
  </text>
</svg>`;

  return Buffer.from(svg, "utf8");
}
