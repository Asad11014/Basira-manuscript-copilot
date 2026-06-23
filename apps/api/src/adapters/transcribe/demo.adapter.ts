import { registerAdapter } from "../registry.js";
import type { TranscribeAdapter } from "../types.js";
import {
  DEMO_MODEL,
  DEMO_SOURCE_LINES,
  DEMO_SOURCE_TEXT,
  DEMO_TRANSCRIPTION_CONFIDENCE,
} from "../../demo/sample-manuscript.js";

/**
 * Local deterministic adapter for demos and UI walkthroughs.
 * It does not inspect the image; it returns a polished successful result.
 */
export const demoTranscribeAdapter: TranscribeAdapter = {
  key: "demo",
  capability: "transcribe",
  capabilities: {
    scripts: ["arabic"],
    handlesHandwriting: true,
  },

  async transcribe() {
    return {
      text: DEMO_SOURCE_TEXT,
      lines: DEMO_SOURCE_LINES.map((text) => ({
        text,
        confidence: DEMO_TRANSCRIPTION_CONFIDENCE,
      })),
      confidence: DEMO_TRANSCRIPTION_CONFIDENCE,
      modelName: DEMO_MODEL.name,
      modelVersion: DEMO_MODEL.transcribeVersion,
    };
  },
};

registerAdapter(demoTranscribeAdapter);
