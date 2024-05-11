/* eslint-disable security/detect-unsafe-regex */
/* eslint-disable security/detect-non-literal-regexp */

export function parseQuery (query) {
  return query && Object.fromEntries(
    query
      .substr(1)
      .split('&')
      .map(el => [...el.split('='), true].slice(0, 2))
  )
}

export function createIdMatcher (extensions = []) {
  const extensionsPattern = extensions
    .filter(el => el[0] === '.')
    .map(el => el.substr(1))
    .join('|')

  const matcher = extensionsPattern
    ? new RegExp(`((?:.*?)(?:\\.(?:${extensionsPattern})))(\\?.*?)?$`, 'i')
    : /([^?]+)(?:\?(.*))?$/

  return (id, parseParams = false) => {
    const matched = matcher.exec(id)

    if (!matched) return false

    const result = { id: matched[1], query: matched[2] }
    const params = parseParams && parseQuery(matched[2])

    if (params) result.params = params

    return result
  }
}
