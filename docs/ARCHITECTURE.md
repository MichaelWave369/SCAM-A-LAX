# SCAM-A-LAX architecture

## Purpose

SCAM-A-LAX is a local-first defensive workstation for scam triage and evidence organization. It is deliberately not a remote-access, counter-intrusion, or retaliation platform.

## Trust model

The browser is the initial trust boundary. Case records are stored in `localStorage` and exported only when the operator deliberately downloads a case packet. File evidence is read locally to calculate SHA-256 metadata; the MVP does not upload or persist the original file bytes.

## Evidence semantics

Every evidence item carries one of six states:

- `OBSERVED` — directly supplied or directly seen artifact.
- `SUPPORTED` — backed by multiple observations or independent support.
- `CORRELATED` — associated by a shared indicator; association is not identity.
- `INFERRED` — analytical conclusion or heuristic output, not direct evidence.
- `DISPUTED` — conflicting evidence or contested interpretation.
- `UNKNOWN` — insufficient basis to classify.

Automated analysis must not silently promote `INFERRED` or `CORRELATED` data to `OBSERVED` or `SUPPORTED`.

## MVP modules

### Case Desk
Creates and selects local cases.

### Scam Ledger
Adds immutable evidence records with timestamps, source type, state, notes, and SHA-256 receipts. Original file bytes are not stored by the app.

### ScamCheck
Runs deterministic phrase/pattern checks over user-supplied text. Findings are explainable and can be recorded in a case only as `INFERRED` analysis.

### Victim Rescue
Provides a short containment checklist focused on stopping loss, ending remote access, contacting institutions through trusted channels, securing accounts, and preserving evidence.

### Case Packet
Exports the local record as JSON or Markdown for review and lawful handoff.

## Future directions

- IndexedDB evidence metadata and optional encrypted local vault.
- Signed export manifests.
- Schema-versioned import/export.
- Browser extension warnings built around the same explainable rule engine.
- Synthetic Scam Academy training scenarios.
- Optional user-controlled integrations for reporting workflows.
