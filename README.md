# SCAM-A-LAX

**Scam Intelligence & Evidence Workstation**

> Flush scams. Preserve evidence. Map the mess.

SCAM-A-LAX is a free, open-source, local-first toolkit for organizing scam reports, preserving evidence metadata, triaging suspicious messages, mapping identifiers, correlating local cases, and producing clean case packets for victims, banks, platforms, investigators, and law-enforcement handoff.

Current build: **v0.5.0-alpha — Intelligence Graph**

## Core principles

- **Defensive only.** No credential theft, malware, unauthorized access, retaliation, doxxing, or destructive tooling.
- **Evidence before inference.** Observations, correlations, and hypotheses remain visibly distinct.
- **Local first.** Case data stays in the browser unless the user deliberately exports it.
- **Human authority.** Automated analysis can flag indicators; it cannot declare guilt.
- **Derived intelligence has no authority of its own.** Entity extraction and graph edges remain traceable to evidence or explicit analyst hypotheses.
- **Original evidence stays original.** File evidence is hashed in-browser and recorded without altering or uploading the source file.

## Current modules

- **Scam Ledger** — case timeline, evidence records, confidence states, SHA-256 receipts.
- **Intelligence Graph** — deterministic local extraction of phones, emails, URLs, domains, IPs, crypto wallets, payment handles, and remote-access IDs.
- **Cross-Case Correlation** — highlights repeated useful identifiers across local cases while suppressing generic service domains.
- **Analyst Links** — explicit, state-labeled hypotheses between extracted entities.
- **ScamCheck** — local heuristic screening for common scam indicators.
- **Victim Rescue** — immediate-response checklist for active scam situations.
- **Case Packet v2** — Markdown and JSON exports containing evidence plus clearly marked non-authoritative derived intelligence.
- **Workspace Backup** — portable JSON backup of local cases.

Future modules include **ScamWatch** and **Scam Academy**.

## Evidence states

`OBSERVED` · `SUPPORTED` · `CORRELATED` · `INFERRED` · `DISPUTED` · `UNKNOWN`

These labels are intentionally conservative. A correlation is not proof, an inference is not evidence, and software is not a judge.

## Intelligence semantics

The Intelligence Graph is a **derived view**. Extracted entities are recomputed from case evidence rather than silently becoming new evidence records. Cross-case matches mean only that the same normalized identifier occurs in more than one local case. Analyst-authored links carry an explicit evidence state and remain visibly distinct from extraction edges.

Generic providers such as Gmail, Outlook, Yahoo, iCloud, and similar common domains are suppressed from cross-case matching to reduce meaningless correlations.

## Development

```bash
npm install
npm test
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## GitHub Pages

The repository includes GitHub Actions workflows for tests/build validation and Vite deployment to GitHub Pages.

## Safety boundary

SCAM-A-LAX is intended for defensive evidence organization, victim support, authorized investigation, and scam-awareness work. Do not use it for unauthorized access, credential collection, malware delivery, retaliation, doxxing, or harassment.

## License

MIT. Build useful things. Protect people. Don't become the problem you're trying to solve.
