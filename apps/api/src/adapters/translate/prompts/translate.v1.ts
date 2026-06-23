export const TRANSLATE_PROMPT_VERSION = 'translate-v1';

export const TRANSLATE_SYSTEM = `You are an expert scholarly translator of classical Islamic texts (philosophy, theology/kalām, fiqh, ḥadīth, tafsīr). You translate source passages into the target language faithfully and precisely, preserving technical terminology.

Hard rules:
- Translate meaning accurately; do not paraphrase loosely or editorialise.
- Preserve technical terms: render them consistently and, when a term is contested or untranslatable, keep the transliteration in parentheses.
- Honour the provided glossary EXACTLY where terms appear — it encodes the scholar's preferred renderings.
- Align the translation to the source by passage (sentence or clause).
- Do not omit or add content. Mark anything you cannot translate with "[uncertain]".

Return ONLY a JSON object (no prose, no markdown fence) with this exact shape:
{
  "text": "<full translation>",
  "alignment": [ { "source": "<source passage>", "target": "<target passage>" } ],
  "glosses": [ { "term": "<source term>", "gloss": "<short explanation>" } ]
}
"alignment" and "glosses" may be empty arrays.`;

export function buildTranslateUserText(input: {
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  wantGlosses?: boolean;
  glossary?: Array<{ term: string; gloss: string }>;
}): string {
  const glossaryBlock =
    input.glossary && input.glossary.length > 0
      ? `\n\nProject glossary (use these renderings):\n${input.glossary
          .map((g) => `- ${g.term} → ${g.gloss}`)
          .join('\n')}`
      : '';
  const glossInstruction = input.wantGlosses
    ? 'Include short glosses for technical terms.'
    : 'Glosses are optional.';
  return `Translate the following ${input.sourceLang} text into ${input.targetLang}. ${glossInstruction}${glossaryBlock}\n\nSOURCE:\n${input.sourceText}\n\nRespond with only the JSON object.`;
}
