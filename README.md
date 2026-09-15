# SCAM-A-LAX

**Scam Intelligence & Evidence Workstation**

> Flush scams. Preserve evidence.

SCAM-A-LAX is a free, open-source, local-first toolkit for organizing scam reports, preserving evidence metadata, triaging suspicious messages, and producing clean case packets for victims, banks, platforms, investigators, and law-enforcement handoff.

## Core principles

- **Defensive only.** No credential theft, malware, unauthorized access, retaliation, or destructive tooling.
- **Evidence before inference.** Observations, correlations, and hypotheses remain visibly distinct.
- **Local first.** Case data stays in the browser unless the user deliberately exports it.
- **Human authority.** Automated analysis can flag indicators; it cannot declare guilt.
- **Original evidence stays original.** File evidence is hashed in-browser and recorded without altering the source file.

## Planned / current modules

- **Scam Ledger** — case timeline, evidence records, confidence states, SHA-256 receipts.
- **ScamCheck** — local heuristic screening for common scam indicators.
- **Victim Rescue** — immediate-response checklist for active scam situations.
- **ScamWatch** — future browser-side warning layer.
- **Scam Academy** — future safe scam-awareness simulations.
- **Case Packet Export** — portable JSON and Markdown reports.

## Evidence states

`OBSERVED` · `SUPPORTED` · `CORRELATED` · `INFERRED` · `DISPUTED` · `UNKNOWN`

These labels are intentionally conservative. A correlation is not proof, an inference is not evidence, and software is not a judge.

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## GitHub Pages

The repository includes a GitHub Actions workflow that builds and deploys the Vite site to GitHub Pages.

## License

MIT. Build useful things. Protect people. Don't become the problem you're trying to solve.
