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
    const data = await res.json().catch(() => null)
    if (data?.msg) message = data.msg
    throw new Error(message)
  }

  return res.json()
}

export function generateUsername() {
  return request('/api/auth/generate-username')
}

export function createQuestion({ title, body, tags, author }) {
  return request('/api/questions', {
    method: 'POST',
    body: JSON.stringify({ title, body, tags, author })
  })
}

export function listQuestions({ status } = {}) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  return request(`/api/questions${qs}`)
}

export function getQuestion(id) {
  return request(`/api/questions/${encodeURIComponent(id)}`)
}

export function addComment(id, { body, author }) {
  return request(`/api/questions/${encodeURIComponent(id)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body, author })
  })
}

export function updateQuestion(id, { status, tags, title, body, author }) {
  return request(`/api/questions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, tags, title, body, author })
  })
}

export function deleteQuestion(id, { author }) {
  return request(`/api/questions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    body: JSON.stringify({ author })
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
