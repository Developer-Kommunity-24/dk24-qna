const STORAGE_KEY = 'dk24_starred_question_ids'

export function getStarredQuestionIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.map(String))
  } catch {
    return new Set()
  }
}

export function hasStarredQuestion(id) {
  return getStarredQuestionIds().has(String(id))
}

export function markQuestionStarred(id) {
  const set = getStarredQuestionIds()
  set.add(String(id))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)))
}

export function unmarkQuestionStarred(id) {
  const set = getStarredQuestionIds()
  set.delete(String(id))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)))
}
