const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options
  })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = await res.json()
      if (data?.msg) message = data.msg
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  return res.json()
}

export function createQuestion({ title, body, tags }) {
  return request('/api/questions', {
    method: 'POST',
    body: JSON.stringify({ title, body, tags })
  })
}

export function listQuestions({ status } = {}) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  return request(`/api/questions${qs}`)
}

export function getQuestion(id) {
  return request(`/api/questions/${encodeURIComponent(id)}`)
}

export function addComment(id, { body }) {
  return request(`/api/questions/${encodeURIComponent(id)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body })
  })
}

export function updateQuestion(id, { status, tags }) {
  return request(`/api/questions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, tags })
  })
}

export function starQuestion(id) {
  return request(`/api/questions/${encodeURIComponent(id)}/star`, {
    method: 'POST'
  })
}

export function unstarQuestion(id) {
  return request(`/api/questions/${encodeURIComponent(id)}/unstar`, {
    method: 'POST'
  })
}
