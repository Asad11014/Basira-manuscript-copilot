import { registerAdapter } from "../registry.js";
import type { TranslateAdapter } from "../types.js";
import {
  DEMO_GLOSSES,
  DEMO_MODEL,
  demoAlignmentFor,
  demoTranslationTextFor,
} from "../../demo/sample-manuscript.js";

function mergeGlosses(
  projectGlossary: Array<{ term: string; gloss: string }> | undefined,
) {
  const seen = new Set<string>();
  return [...DEMO_GLOSSES, ...(projectGlossary ?? [])].filter((entry) => {
    const key = `${entry.term}:${entry.gloss}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Local deterministic adapter for demos and UI walkthroughs.
 * It returns aligned, glossary-bearing translations without a model API key.
 */
export const demoTranslateAdapter: TranslateAdapter = {
  key: "demo",
  capability: "translate",

  async translate(input) {
    return {
      text: demoTranslationTextFor(input.targetLang),
      alignment: demoAlignmentFor(input.targetLang),
      glosses: input.wantGlosses ? mergeGlosses(input.glossary) : undefined,
      modelName: DEMO_MODEL.name,
      modelVersion: DEMO_MODEL.translateVersion,
    };
  },
};

registerAdapter(demoTranslateAdapter);
