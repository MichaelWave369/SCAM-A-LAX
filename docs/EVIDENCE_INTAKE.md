# Evidence Intake Architecture

SCAM-A-LAX v0.6 adds a preview-first staging layer in front of the existing case ledger.

## Flow

`source material -> parser -> proposed records -> analyst review -> local hash -> case commit -> intelligence graph`

Nothing parsed from pasted text is committed automatically. The analyst can include/exclude proposed records and change their evidence kind or state before committing.

## Supported intake modes

### Raw email

- Detects common RFC-style headers.
- Preserves repeated `Received` hops.
- Keeps the submitted raw email as the selected canonical record.
- Shows the extracted body as an unselected convenience record.
- Missing `From`, `To`, or `Message-ID` fields produce warnings rather than invented values.

### Transcript

- Recognizes optional `[timestamp] Speaker: text` structure.
- Supports `Speaker: text` without a timestamp.
- Does not treat ordinary `http://` or `https://` URLs as speakers.
- Splits messages into reviewable records while retaining speaker/time context in notes.

### Bulk indicators

- Splits paragraph-separated or line-separated material into proposed records.
- Suggests conservative evidence kinds for isolated URLs, emails, phone numbers, wallets, remote-access references, and payment instructions.
- Suggestions are editable before commit.

### Files and screenshots

- Stages up to 30 files per batch, limited to 25 MB each in the current UI.
- SHA-256 is calculated from the original local bytes.
- The ledger stores the digest and file metadata, not the original file bytes.
- v0.6 makes no OCR or image-interpretation claim.

## Authority semantics

Parsing does not upgrade authority. Preview records default to `OBSERVED`, but the user remains responsible for selecting the appropriate evidence state before committing. Extracted entity views remain non-authoritative derived intelligence.

## Handoff profiles

Four export profiles reuse the same underlying case rather than creating divergent case copies:

- Victim Copy
- Bank / Fraud Department
- Platform Abuse Report
- Law-Enforcement / Investigator Packet

The profiles filter presentation. They do not mutate evidence, alter hashes, or turn a correlation into a fact.

## Local-first boundary

The v0.6 intake implementation does not require a backend. Text parsing, file hashing, case storage, and export generation all occur in the browser. Users should preserve original source files separately because SCAM-A-LAX stores only their receipts and metadata.
