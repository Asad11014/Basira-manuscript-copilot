export const NER_PROMPT_VERSION = 'ner-v1';

export const NER_SYSTEM = `You are an expert in classical Islamic texts performing named-entity recognition. Identify entities of exactly these types:
- "person": people (authors, transmitters, scholars, prophets, caliphs, etc.)
- "work": titles of books or treatises
- "place": geographic places (cities, regions, mosques, madrasas)
- "citation": Qurʾanic references or ḥadīth citations

Rules:
- Use the surface text EXACTLY as it appears in the source (do not translate it).
- Provide a normalized/transliterated name where helpful (e.g. "al-Ghazālī").
- Do not invent entities; only extract what is present.

Return ONLY a JSON object (no prose, no markdown fence):
{
  "entities": [
    { "type": "person|work|place|citation", "surfaceText": "<as written>", "normalizedName": "<optional>" }
  ]
}
"entities" may be an empty array.`;

export function buildNerUserText(lang: string, text: string): string {
  return `Extract named entities from the following ${lang} text. Respond with only the JSON object.\n\nTEXT:\n${text}`;
}
