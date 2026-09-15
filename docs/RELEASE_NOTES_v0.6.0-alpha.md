# SCAM-A-LAX v0.6.0-alpha — Evidence Intake

## Added

- Preview-first intake workspace above the existing v0.5 workstation.
- Raw email parsing with repeated `Received` hop preservation and missing-header warnings.
- Transcript parsing for optional timestamps and speaker labels.
- Bulk text/indicator intake with conservative evidence-kind suggestions.
- Multi-file and screenshot staging with local SHA-256 receipts.
- Batch commit into an existing case with a single timeline receipt.
- Preview-time entity extraction before evidence enters the ledger.
- Victim, Bank/Fraud, Platform Abuse, and Law-Enforcement/Investigator handoff profiles.
- Markdown and JSON handoff exports.
- Intake regression tests and architecture documentation.

## Guardrails

- No automatic evidence commit from parser output.
- Raw email is canonical; extracted body is opt-in.
- URLs are excluded from transcript-speaker auto-detection.
- Missing email fields remain missing rather than being inferred.
- Original file bytes are not stored or uploaded.
- v0.6 does not claim OCR or image interpretation.
- Derived intelligence remains explicitly non-authoritative.
