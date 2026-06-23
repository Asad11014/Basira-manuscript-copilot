// The legacy build is the Node-friendly entry; reuse the package's own types.
declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export * from 'pdfjs-dist';
}
