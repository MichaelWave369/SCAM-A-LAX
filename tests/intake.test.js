import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildHandoffPacket,
  buildIntakePreview,
  detectIntakeMode,
  parseEmailHeaders,
  parseTranscript,
  splitBulkText,
  suggestEvidenceKind,
} from '../src/intake.js'

test('auto-detects a raw email from multiple standard headers', () => {
  const raw = [
    'From: Agent <agent@refund-help.example>',
    'To: victim@example.net',
    'Subject: Refund case',
    'Date: Tue, 15 Sep 2026 10:00:00 -0700',
    'Message-ID: <abc123@refund-help.example>',
    '',
    'Call +1 415 555 0199 immediately.',
  ].join('\n')
  assert.equal(detectIntakeMode(raw), 'email')
})

test('URL lists are not misclassified as speaker transcripts', () => {
  const raw = 'https://scam.example/login\nhttps://refund-help.example/pay'
  assert.equal(detectIntakeMode(raw), 'bulk')
})

test('parses selected email headers and preserves repeated Received hops', () => {
  const parsed = parseEmailHeaders([
    'Received: from first.example by second.example',
    'Received: from second.example by third.example',
    'From: agent@refund-help.example',
    'To: victim@example.net',
    'Subject: Important refund',
    'Message-ID: <m1@refund-help.example>',
    '',
    'Body text',
  ].join('\n'))

  assert.equal(parsed.headers.received.length, 2)
  assert.equal(parsed.headers.from[0], 'agent@refund-help.example')
  assert.equal(parsed.headers['message-id'][0], '<m1@refund-help.example>')
  assert.equal(parsed.body, 'Body text')
})

test('raw email remains canonical while body preview is opt-in', () => {
  const preview = buildIntakePreview({
    mode: 'email',
    sourceLabel: 'victim Gmail export',
    text: [
      'From: agent@refund-help.example',
      'To: victim@example.net',
      'Subject: Refund',
      'Message-ID: <m1@refund-help.example>',
      '',
      'Send payment to scam.example now.',
    ].join('\n'),
  })

  assert.equal(preview.records.length, 2)
  assert.equal(preview.records[0].kind, 'email')
  assert.equal(preview.records[0].selected, true)
  assert.equal(preview.records[1].kind, 'message')
  assert.equal(preview.records[1].selected, false)
  assert.match(preview.records[0].note, /victim Gmail export/)
})

test('transcript parser preserves speaker and optional timestamp', () => {
  const rows = parseTranscript([
    '[10:01] Support: Open AnyDesk.',
    '[10:02] Victim: Why do you need that?',
    'Support: Read me the number.',
  ].join('\n'))

  assert.equal(rows.length, 3)
  assert.deepEqual(rows[0], { timestamp: '10:01', speaker: 'Support', text: 'Open AnyDesk.' })
  assert.equal(rows[2].speaker, 'Support')
})

test('bulk splitter and kind suggestion remain conservative', () => {
  const blocks = splitBulkText('https://scam.example/login\n\n+1 415 555 0199\n\nNeeds human context')
  assert.equal(blocks.length, 3)
  assert.equal(suggestEvidenceKind(blocks[0]), 'url')
  assert.equal(suggestEvidenceKind(blocks[1]), 'phone')
  assert.equal(suggestEvidenceKind(blocks[2]), 'message')
})

test('handoff profiles filter presentation without changing evidence authority', () => {
  const item = {
    id: 'case-1',
    title: 'Refund scam',
    victimAlias: 'Victim A',
    type: 'refund',
    status: 'OPEN',
    createdAt: '2026-09-15T12:00:00.000Z',
    notes: 'Internal context',
    timeline: [],
    analystLinks: [{ id: 'link-1', state: 'CORRELATED', from: 'phone:a', relation: 'CONTACTED_VIA', to: 'email:b' }],
    evidence: [
      { id: 'e1', kind: 'payment', state: 'OBSERVED', value: 'Wire transfer instruction', recordedAt: 'x', sha256: 'a' },
      { id: 'e2', kind: 'remote-access', state: 'OBSERVED', value: 'AnyDesk session', recordedAt: 'x', sha256: 'b' },
    ],
  }
  const entities = [
    { id: 'crypto-wallet:x', type: 'crypto-wallet', value: 'x', sourceIds: ['e1'] },
    { id: 'remote-access-id:y', type: 'remote-access-id', value: 'y', sourceIds: ['e2'] },
  ]

  const bank = buildHandoffPacket({ item, profile: 'bank', entities, crossCaseMatches: [], appVersion: 'test' })
  const law = buildHandoffPacket({ item, profile: 'law', entities, crossCaseMatches: [], appVersion: 'test' })

  assert.equal(bank.derivedIntelligence.authority, 'NON_AUTHORITATIVE')
  assert.equal(bank.derivedIntelligence.analystLinks.length, 0)
  assert.equal(bank.evidence.length, 2)
  assert.equal(law.derivedIntelligence.analystLinks.length, 1)
  assert.equal(law.evidence.length, 2)
})
