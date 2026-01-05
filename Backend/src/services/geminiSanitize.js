function extractJson(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  const candidate = text.slice(start, end + 1)
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

function redactUsingBlocklist(input) {
  const blocklist = (process.env.EXPLICIT_WORDS_BLOCKLIST || '')
    .split(',')
    .map(w => w.trim())
    .filter(Boolean)

  if (blocklist.length === 0) return input

  let output = input
  for (const word of blocklist) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    output = output.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '[redacted]')
  }
  return output
}

function isGeminiDebugEnabled() {
  return String(process.env.GEMINI_DEBUG || '').toLowerCase() === 'true'
}

function normalizeModelName(model) {
  const m = String(model || '').trim()
  if (!m) return ''
  return m.startsWith('models/') ? m.slice('models/'.length) : m
}

async function fetchGeminiGenerateContent({ apiKey, model, payload, debug }) {
  const normalizedModel = normalizeModelName(model)

  const versions = ['v1beta', 'v1']
  const errors = []

  for (const v of versions) {
    const url = `https://generativelanguage.googleapis.com/${v}/models/${encodeURIComponent(normalizedModel)}:generateContent?key=${encodeURIComponent(apiKey)}`

    const payloadForVersion = structuredClone(payload)
    if (v === 'v1' && payloadForVersion?.generationConfig?.responseMimeType) {
      delete payloadForVersion.generationConfig.responseMimeType
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadForVersion)
    })

    if (res.ok) {
      const data = await res.json()
      return { ok: true, data, version: v }
    }

    let bodyText = ''
    try {
      bodyText = await res.text()
    } catch {
      bodyText = ''
    }

    errors.push({ version: v, status: res.status, statusText: res.statusText, bodyText })

    if (debug) {
      const snippet = String(bodyText || '').slice(0, 300).replace(/\s+/g, ' ')
      console.log(`[gemini] http_error version=${v} status=${res.status} statusText=${res.statusText} body="${snippet}"`)
    }

    if (res.status === 404) continue

    break
  }

  return { ok: false, errors }
}

export async function sanitizeQuestionDraft({ title, body }) {
  const safeTitle = redactUsingBlocklist(String(title || ''))
  const safeBody = redactUsingBlocklist(String(body || ''))

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      title: safeTitle,
      body: safeBody,
      action: 'allow',
      flagged: false,
      reason: '',
      provider: 'none'
    }
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const debug = isGeminiDebugEnabled()

  const prompt =
    'You are a strict moderator + editor for an anonymous Q&A platform.\n' +
    'Goals:\n' +
    '1) Fix grammar and improve clarity while preserving meaning.\n' +
    '2) Keep it respectful and non-abusive; rewrite rude/harassing language into a neutral tone when possible.\n' +
    '3) If content contains explicit sexual content, hate/harassment, or violent threats, you MUST block it.\n' +
    '4) For profanity/explicit words, replace offending words with "[redacted]".\n\n' +
    'Return ONLY valid JSON with keys:\n' +
    '- action: "allow" | "redact" | "block"\n' +
    '- title: string (empty if not applicable)\n' +
    '- body: string\n' +
    '- flagged: boolean\n' +
    '- reason: short string\n\n' +
    `TITLE:\n${safeTitle}\n\nBODY:\n${safeBody}`

  if (debug) console.log(`[gemini] model=${normalizeModelName(model)} request=generateContent`)

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 512,
      responseMimeType: 'application/json'
    }
  }

  const geminiResult = await fetchGeminiGenerateContent({ apiKey, model, payload, debug })

  if (!geminiResult.ok) {
    const strict = String(process.env.GEMINI_STRICT || '').toLowerCase() === 'true'
    if (strict) {
      return {
        title: '',
        body: '',
        action: 'block',
        flagged: true,
        reason: 'Moderation unavailable',
        provider: 'gemini_failed'
      }
    }

    return {
      title: safeTitle,
      body: safeBody,
      action: 'allow',
      flagged: false,
      reason: '',
      provider: 'gemini_failed'
    }
  }

  const data = geminiResult.data
  if (debug) {
    const blockReason = data?.promptFeedback?.blockReason
    if (blockReason) console.log(`[gemini] promptFeedback.blockReason=${String(blockReason)}`)

    const safetyRatings = data?.candidates?.[0]?.safetyRatings
    if (Array.isArray(safetyRatings)) {
      const simplified = safetyRatings
        .map(r => `${String(r?.category || '')}:${String(r?.probability || '')}`)
        .join(',')
      console.log(`[gemini] safetyRatings=${simplified}`)
    }
  }

  if (data?.promptFeedback?.blockReason) {
    return {
      title: '',
      body: '',
      action: 'block',
      flagged: true,
      reason: String(data.promptFeedback.blockReason),
      provider: 'gemini'
    }
  }

  const safetyRatings = data?.candidates?.[0]?.safetyRatings
  if (Array.isArray(safetyRatings)) {
    const risky = safetyRatings.some(r => {
      const probability = String(r?.probability || '').toUpperCase()
      const category = String(r?.category || '').toUpperCase()
      const watched =
        category.includes('HARASS') ||
        category.includes('HATE') ||
        category.includes('SEXUALLY') ||
        category.includes('DANGEROUS')

      return watched && (probability === 'MEDIUM' || probability === 'HIGH')
    })

    if (risky) {
      return {
        title: '',
        body: '',
        action: 'block',
        flagged: true,
        reason: 'Safety rating triggered',
        provider: 'gemini'
      }
    }
  }

  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
  const json = extractJson(text)

  if (!json || typeof json.body !== 'string') {
    if (debug) {
      const snippet = String(text || '').slice(0, 200).replace(/\s+/g, ' ')
      console.log(`[gemini] unparseable_response snippet="${snippet}"`)
    }
    const strict = String(process.env.GEMINI_STRICT || '').toLowerCase() === 'true'
    if (strict) {
      return {
        title: '',
        body: '',
        action: 'block',
        flagged: true,
        reason: 'Moderation unavailable',
        provider: 'gemini_unparseable'
      }
    }

    return {
      title: safeTitle,
      body: safeBody,
      action: 'allow',
      flagged: false,
      reason: '',
      provider: 'gemini_unparseable'
    }
  }

  const action = json.action === 'block' || json.action === 'redact' || json.action === 'allow' ? json.action : 'allow'
  const outTitle = typeof json.title === 'string' ? json.title : safeTitle

  if (debug) {
    console.log(`[gemini] action=${action} flagged=${String(action !== 'allow' || Boolean(json.flagged))} reason=${String(json.reason || '')}`)
  }

  return {
    title: redactUsingBlocklist(outTitle),
    body: redactUsingBlocklist(json.body),
    action,
    flagged: action !== 'allow' || Boolean(json.flagged),
    reason: typeof json.reason === 'string' ? json.reason : '',
    provider: 'gemini'
  }
}

export async function sanitizeCommentDraft({ body }) {
  const result = await sanitizeQuestionDraft({ title: '', body })
  return {
    body: result.body,
    action: result.action,
    flagged: result.flagged,
    reason: result.reason,
    provider: result.provider
  }
}

export async function generateCreativeUsername() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return `User${Math.floor(Math.random() * 10000)}`

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const debug = isGeminiDebugEnabled()

  const prompt = 'Generate a single creative, cool, anonymous username for a developer Q&A platform. It should be 1-3 words, no spaces (use CamelCase or underscores), and sound techy or sci-fi. Return ONLY the username string, nothing else.'

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 20,
      responseMimeType: 'text/plain'
    }
  }

  const geminiResult = await fetchGeminiGenerateContent({ apiKey, model, payload, debug })
  
  if (!geminiResult.ok) {
     return `User${Math.floor(Math.random() * 10000)}`
  }
  
  const text = geminiResult.data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const username = text.trim().replace(/\s+/g, '')
  return username || `User${Math.floor(Math.random() * 10000)}`
}

