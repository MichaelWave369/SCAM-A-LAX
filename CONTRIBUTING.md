# Contributing

Thanks for helping build software that protects people.

## Ground rules

1. Keep features defensive and consent-based.
2. Never commit real victim PII, credentials, access tokens, or malicious payloads.
3. Preserve the distinction between evidence and inference.
4. Prefer deterministic, explainable checks over opaque declarations.
5. Keep the browser app useful without a backend.

## Local development

```bash
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run build
```

Useful contributions include accessibility, export formats, evidence schemas,
scam-awareness content, browser-side parsing, test fixtures using synthetic
data, and UI improvements.
