# SCAM-A-LAX

**Scam Intelligence & Evidence Workstation**

> Flush scams. Preserve evidence. Map the mess.

SCAM-A-LAX is a free, open-source, local-first toolkit for organizing scam reports, preserving evidence metadata, triaging suspicious messages, mapping identifiers, correlating local cases, and producing clean case packets for victims, banks, platforms, investigators, and law-enforcement handoff.

Current build: **v0.6.0-alpha — Evidence Intake**

## Core principles

- **Defensive only.** No credential theft, malware, unauthorized access, retaliation, doxxing, or destructive tooling.
- **Evidence before inference.** Observations, correlations, and hypotheses remain visibly distinct.
- **Preview before commit.** Bulk intake proposes records first; the analyst chooses what actually enters a case.
- **Local first.** Case data stays in the browser unless the user deliberately exports it.
- **Human authority.** Automated parsing can structure evidence; it cannot declare guilt or silently upgrade evidence state.
- **Derived intelligence has no authority of its own.** Entity extraction and graph edges remain traceable to evidence or explicit analyst hypotheses.
- **Original evidence stays original.** File evidence is hashed in-browser and recorded without altering or uploading the source file.

## Current modules

- **Evidence Intake** — preview-first intake for raw email, transcripts, bulk indicators, screenshots, and other files.
- **Email Header Parser** — preserves selected standard headers, repeated `Received` hops, message IDs, and the raw source for review.
- **Transcript Intake** — separates timestamped/speaker-labeled call or chat transcripts into reviewable records.
- **Batch File Hashing** — stages multiple files or screenshots and creates SHA-256 receipts without storing file bytes.
- **Handoff Profiles** — purpose-built Victim, Bank/Fraud, Platform Abuse, and Law-Enforcement/Investigator exports.
- **Scam Ledger** — case timeline, evidence records, confidence states, SHA-256 receipts.
- **Intelligence Graph** — deterministic local extraction of phones, emails, URLs, domains, IPs, crypto wallets, payment handles, and remote-access IDs.
- **Cross-Case Correlation** — highlights repeated useful identifiers across local cases while suppressing generic service domains.
- **Analyst Links** — explicit, state-labeled hypotheses between extracted entities.
- **ScamCheck** — local heuristic screening for common scam indicators.
- **Victim Rescue** — immediate-response checklist for active scam situations.
- **Case Packet v2** — Markdown and JSON exports containing evidence plus clearly marked non-authoritative derived intelligence.
- **Workspace Backup** — portable JSON backup of local cases.

Future modules include **ScamWatch** and **Scam Academy**.

## Evidence Intake semantics

Evidence Intake is a staging layer. Pasted material is parsed into **proposed records**, not automatically written to the case. The analyst can include/exclude each record and change its kind or evidence state before committing.

Files and screenshots are read locally to calculate SHA-256 receipts. SCAM-A-LAX stores the receipt plus file metadata, not the original bytes. v0.6 does **not** claim OCR or image interpretation.

Raw email intake preserves the submitted source as the canonical email evidence. Header parsing and body extraction are convenience views over that source and do not increase epistemic authority.

## Handoff profiles

Handoff profiles filter presentation for a particular audience without mutating the underlying case:

- **Victim Copy** — readable evidence/timeline summary for the victim or trusted helper.
- **Bank / Fraud Department** — payment-oriented records and relevant identifiers.
- **Platform Abuse Report** — account/contact/URL/domain/remote-access indicators and source references.
- **Law-Enforcement / Investigator Packet** — full evidence, derived entity index, cross-case correlations, and explicit analyst links.

Every handoff that includes extracted entities labels them **NON_AUTHORITATIVE**. A tailored export is not a verdict, legal filing, or independent verification.

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
