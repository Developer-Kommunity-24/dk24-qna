export function setCookie(name, value, { days = 30, path = '/' } = {}) {
  const encodedName = encodeURIComponent(name)
  const encodedValue = encodeURIComponent(value)

  const maxAge = days * 24 * 60 * 60
  document.cookie = `${encodedName}=${encodedValue}; Max-Age=${maxAge}; Path=${path}`
}

export function getCookie(name) {
  const encodedName = encodeURIComponent(name) + '='
  const parts = document.cookie.split(';')

  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith(encodedName)) {
      return decodeURIComponent(trimmed.slice(encodedName.length))
    }
  }

  return ''
}
