/* eslint-disable security/detect-unsafe-regex */
/* eslint-disable security/detect-non-literal-regexp */

export function parseQueries (query) {
  return query && Object.fromEntries(
    query
      .split('&')
      .map(el => [...el.split('='), true].slice(0, 2))
  )
}

export function idMatcherBuild (extensions = []) {
  const extensionsPattern = extensions
    .filter(el => el[0] === '.')
    .map(el => el.substr(1))
    .join('|')

  const matcher = extensionsPattern
    ? new RegExp(`((?:.*?)(?:\\.(?:${extensionsPattern})))(\\?.*?)?$`, 'i')
    : /([^?]+)(?:\?(.*))?$/

  return (id, outputQueries) => {
    const matched = matcher.exec(id)
    const result = matched && { id: matched[1], query: matched[2] }

    if (result && outputQueries) {
      result.queries = parseQueries(result.query)
    }

    return result
  }
}
