import { describe, expect, it } from "vitest";
import "./index.js"; // self-register the built-in adapters
import {
  resolveTranscribeAdapter,
  resolveTranslateAdapter,
  registerAdapter,
} from "./registry.js";
import { NotImplementedError } from "../http/errors.js";
import type { TranscribeAdapter } from "./types.js";

describe("adapter registry", () => {
  it("resolves the default llm-vision transcribe adapter by key", () => {
    const adapter = resolveTranscribeAdapter("llm-vision");
    expect(adapter.key).toBe("llm-vision");
    expect(adapter.capabilities.handlesHandwriting).toBe(true);
  });

  it("throws for an unknown adapter key", () => {
    expect(() => resolveTranscribeAdapter("does-not-exist")).toThrow(
      /No "transcribe" adapter/,
    );
  });

  it("exposes the transkribus seam that throws NotImplemented", () => {
    const adapter = resolveTranscribeAdapter("transkribus");
    expect(() => adapter.transcribe({ imageBuffer: Buffer.from("") })).toThrow(
      NotImplementedError,
    );
  });

  it("resolves the local demo adapters by key", async () => {
    const transcribe = resolveTranscribeAdapter("demo");
    const translate = resolveTranslateAdapter("demo");

    const transcription = await transcribe.transcribe({
      imageBuffer: Buffer.from("demo"),
    });
    const translation = await translate.translate({
      sourceText: transcription.text,
      sourceLang: "ar",
      targetLang: "en",
      wantGlosses: true,
    });

    expect(transcription.text).toContain("بسم الله");
    expect(translation.text).toContain("Knowledge is a light");
    expect(translation.glosses?.length).toBeGreaterThan(0);
  });

  it("lets a new backend register with one call (no switch statements)", () => {
    const fake: TranscribeAdapter = {
      key: "unit-fake",
      capability: "transcribe",
      capabilities: { scripts: ["arabic"], handlesHandwriting: false },
      transcribe: async () => ({
        text: "x",
        modelName: "fake",
        modelVersion: "0",
      }),
    };
    registerAdapter(fake);
    expect(resolveTranscribeAdapter("unit-fake").key).toBe("unit-fake");
  });
});
