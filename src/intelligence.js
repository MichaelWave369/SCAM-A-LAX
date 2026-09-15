export const ENTITY_TYPES = [
  'phone',
  'email',
  'url',
  'domain',
  'ip',
  'crypto-wallet',
  'payment-handle',
  'remote-access-id',
]

const patterns = [
  {
    type: 'email',
    re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    normalize: (value) => value.toLowerCase(),
  },
  {
    type: 'url',
    re: /\bhttps?:\/\/[^\s<>"')\]]+/gi,
    normalize: (value) => value.replace(/[.,;:!?]+$/, ''),
  },
  {
    type: 'ip',
    re: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g,
    normalize: (value) => value,
  },
  {
    type: 'crypto-wallet',
    re: /\b0x[a-fA-F0-9]{40}\b|\b(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}\b/g,
    normalize: (value) => value,
  },
  {
    type: 'payment-handle',
    re: /(?:\$|@)[A-Za-z0-9._-]{3,30}\b/g,
    normalize: (value) => value.toLowerCase(),
  },
  {
    type: 'remote-access-id',
    re: /\b(?:anydesk|teamviewer|ultraviewer|supremo|screenconnect)[\s:#-]*(?:id[\s:#-]*)?[0-9]{6,15}\b/gi,
    normalize: (value) => value.toLowerCase().replace(/\s+/g, ' ').trim(),
  },
]

function canonicalPhone(value) {
  const plus = value.trim().startsWith('+')
  const digits = value.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return null
  return `${plus ? '+' : ''}${digits}`
}

function canonicalDomain(value) {
  return value.toLowerCase().replace(/^www\./, '').replace(/\.$/, '')
}

function collectMatches(text, sourceId) {
  const found = []
  if (!text) return found

  patterns.forEach((pattern) => {
    const matches = text.match(pattern.re) || []
    matches.forEach((raw) => {
      const value = pattern.normalize(raw)
      found.push({ type: pattern.type, value, sourceId })

      if (pattern.type === 'url') {
        try {
          const domain = canonicalDomain(new URL(value).hostname)
          if (domain) found.push({ type: 'domain', value: domain, sourceId })
        } catch {
          // Bad URLs are ignored rather than promoted to entities.
        }
      }
    })
  })

  const phoneCandidates = text.match(/(?:\+?\d[\d\s().-]{8,}\d)/g) || []
  phoneCandidates.forEach((raw) => {
    const value = canonicalPhone(raw)
    if (value) found.push({ type: 'phone', value, sourceId })
  })

  const domainCandidates = text.match(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi) || []
  domainCandidates.forEach((raw) => {
    const value = canonicalDomain(raw)
    if (value && !value.includes('@')) found.push({ type: 'domain', value, sourceId })
  })

  return found
}

export function extractEntitiesFromEvidence(evidence = []) {
  const entityMap = new Map()

  evidence.forEach((item) => {
    const sourceId = item.id
    const text = [item.value, item.note, item.fileName].filter(Boolean).join('\n')
    collectMatches(text, sourceId).forEach((match) => {
      const key = `${match.type}:${match.value}`
      const existing = entityMap.get(key) || {
        id: key,
        type: match.type,
        value: match.value,
        sourceIds: [],
        occurrences: 0,
      }
      existing.occurrences += 1
      if (!existing.sourceIds.includes(sourceId)) existing.sourceIds.push(sourceId)
      entityMap.set(key, existing)
    })
  })

  return [...entityMap.values()].sort((a, b) => {
    if (b.sourceIds.length !== a.sourceIds.length) return b.sourceIds.length - a.sourceIds.length
    return a.type.localeCompare(b.type) || a.value.localeCompare(b.value)
  })
}

export function getCrossCaseMatches(cases = [], activeCaseId) {
  const index = new Map()

  cases.forEach((item) => {
    const entities = extractEntitiesFromEvidence(item.evidence || [])
    entities.forEach((entity) => {
      const key = `${entity.type}:${entity.value}`
      if (!index.has(key)) index.set(key, [])
      index.get(key).push({ caseId: item.id, title: item.title, entity })
    })
  })

  return [...index.entries()]
    .filter(([, hits]) => hits.length > 1 && hits.some((hit) => hit.caseId === activeCaseId))
    .map(([key, hits]) => ({
      key,
      type: hits[0].entity.type,
      value: hits[0].entity.value,
      cases: hits.map((hit) => ({ caseId: hit.caseId, title: hit.title })),
    }))
    .sort((a, b) => b.cases.length - a.cases.length || a.type.localeCompare(b.type))
}

export function buildEntityLinks(entities = []) {
  const links = []
  entities.forEach((entity) => {
    entity.sourceIds.forEach((sourceId) => {
      links.push({
        id: `${entity.id}:${sourceId}`,
        source: sourceId,
        target: entity.id,
        relation: 'EXTRACTED_FROM',
        state: 'SUPPORTED',
      })
    })
  })
  return links
}

export function entityLabel(type) {
  return {
    phone: 'Phone',
    email: 'Email',
    url: 'URL',
    domain: 'Domain',
    ip: 'IP address',
    'crypto-wallet': 'Crypto wallet',
    'payment-handle': 'Payment handle',
    'remote-access-id': 'Remote access ID',
  }[type] || type
}
