import test from 'node:test'
import assert from 'node:assert/strict'
import { extractEntitiesFromEvidence, getCrossCaseMatches } from '../src/intelligence.js'

function evidence(id, value, note = '') {
  return { id, value, note }
}

test('extracts useful entities from evidence text', () => {
  const entities = extractEntitiesFromEvidence([
    evidence('ev-1', 'Call +1 (415) 555-0199 or email agent@refund-help.example. Visit https://refund-help.example/login.'),
    evidence('ev-2', 'Send ETH to 0x1111111111111111111111111111111111111111 and use AnyDesk 123456789.'),
  ])

  const values = new Set(entities.map((entity) => `${entity.type}:${entity.value}`))
  assert(values.has('phone:+14155550199'))
  assert(values.has('email:agent@refund-help.example'))
  assert(values.has('domain:refund-help.example'))
  assert(values.has('url:https://refund-help.example/login'))
  assert(values.has('crypto-wallet:0x1111111111111111111111111111111111111111'))
  assert(values.has('remote-access-id:anydesk 123456789'))
})

test('deduplicates an entity while preserving source references', () => {
  const entities = extractEntitiesFromEvidence([
    evidence('ev-a', 'Call +1 415 555 0199.'),
    evidence('ev-b', 'Same callback number: (415) 555-0199.'),
  ])

  const phone = entities.find((entity) => entity.type === 'phone')
  assert.equal(phone.value, '+14155550199')
  assert.equal(phone.sourceIds.length, 2)
  assert.equal(phone.occurrences, 2)
})

test('suppresses generic service domains from cross-case correlation', () => {
  const cases = [
    { id: 'case-a', title: 'A', evidence: [evidence('a1', 'firstperson@gmail.com')] },
    { id: 'case-b', title: 'B', evidence: [evidence('b1', 'secondperson@gmail.com')] },
  ]

  const matches = getCrossCaseMatches(cases, 'case-a')
  assert.equal(matches.length, 0)
})

test('surfaces shared useful identifiers across cases without asserting identity', () => {
  const cases = [
    { id: 'case-a', title: 'A', evidence: [evidence('a1', 'Callback +1 415 555 0199')] },
    { id: 'case-b', title: 'B', evidence: [evidence('b1', 'They used +1 (415) 555-0199')] },
  ]

  const matches = getCrossCaseMatches(cases, 'case-a')
  assert.equal(matches.length, 1)
  assert.equal(matches[0].type, 'phone')
  assert.equal(matches[0].value, '+14155550199')
  assert.deepEqual(matches[0].cases.map((entry) => entry.caseId), ['case-a', 'case-b'])
})
