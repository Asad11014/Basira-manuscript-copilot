import path from 'node:path';

/** Centralised object-storage key scheme so layout is consistent and greppable. */
export const storageKeys = {
  manuscriptSource: (manuscriptId: string, filename: string) =>
    `manuscripts/${manuscriptId}/source/${path.basename(filename)}`,
  pageOriginal: (manuscriptId: string, index: number) =>
    `manuscripts/${manuscriptId}/pages/${index}/original.png`,
  pageProcessed: (manuscriptId: string, index: number) =>
    `manuscripts/${manuscriptId}/pages/${index}/processed.png`,
  pageThumbnail: (manuscriptId: string, index: number) =>
    `manuscripts/${manuscriptId}/pages/${index}/thumb.png`,
  export: (id: string, format: string) => `exports/${id}.${format}`,
};
