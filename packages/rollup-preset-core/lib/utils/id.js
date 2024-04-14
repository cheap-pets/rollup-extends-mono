/* eslint-disable security/detect-unsafe-regex */
/* eslint-disable security/detect-non-literal-regexp */

export function parseQuery (queryString) {
  return queryString && Object.fromEntries(
    queryString
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
    ? new RegExp(`((?:.*?)(?:\\.(?:${extensionsPattern})))(?:\\?(.*?))?$`, 'i')
    : /([^?]+)(?:\?(.*))?$/

  return (id, query = true) => {
    const matched = matcher.exec(id)
    const result = matched && { id: matched[1] }

    if (result && query) {
      result.query = parseQuery(matched[2])
    }

    return result
  }
}
