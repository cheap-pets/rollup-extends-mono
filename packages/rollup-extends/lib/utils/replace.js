/* eslint-disable security/detect-non-literal-regexp */
/* eslint-disable security/detect-object-injection */
/* eslint-disable security/detect-unsafe-regex */

/*
 * These codes are adapted from [@rollup/plugin-replace],
 * created by [Rich Harris <richard.a.harris@gmail.com>],
 * available at [https://github.com/rollup/plugins/tree/master/packages/replace].
 */

import MagicString from 'magic-string'

import { ensureFunction } from './type.js'

const OBJECT_KEY_PATTERN =
  /^([_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*)(\.([_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*))+$/

function assignTypeofReplacements (replacements) {
  Object.keys(replacements).forEach((key) => {
    const matched = key.match(OBJECT_KEY_PATTERN)

    if (!matched) return

    let idx = 0
    let dotIdx = matched[1].length

    do {
      const t = key.slice(idx, dotIdx)

      Object.assign(replacements, {
        [`typeof ${t} ===`]: '"object" ===',
        [`typeof ${t} !==`]: '"object" !==',
        [`typeof ${t}===`]: '"object"===',
        [`typeof ${t}!==`]: '"object"!==',
        [`typeof ${t} ==`]: '"object" ===',
        [`typeof ${t} !=`]: '"object" !==',
        [`typeof ${t}==`]: '"object"===',
        [`typeof ${t}!=`]: '"object"!=='
      })

      idx = dotIdx + 1
      dotIdx = key.indexOf('.', idx)
    } while (dotIdx !== -1)
  })
}

function mapToFunctions (replacements) {
  return Object
    .entries(replacements)
    .reduce(
      (result, [key, value]) => (result[key] = ensureFunction(value)) && result,
      {}
    )
}

function escape (str) {
  return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
}

export function createCodeReplacer (options) {
  const {
    objectGuards,
    preventAssignment = true,
    delimiters = ['\\b', '\\b(?!\\.)']
  } = options

  const replacements = { ...options.replacements }

  if (objectGuards) {
    assignTypeofReplacements(replacements)
  }

  const functions = mapToFunctions(replacements)
  const keys = Object.keys(functions).sort((a, b) => b.length - a.length).map(escape)
  const lookahead = preventAssignment ? '(?!\\s*(=[^=]|:[^:]))' : ''

  const pattern = keys.length && new RegExp(
    `${delimiters[0]}(${keys.join('|')})${delimiters[1]}${lookahead}`,
    'g'
  )

  return (code, ctx) => {
    if (!pattern) return code

    const magicString = new MagicString(code)

    let matched
    let replaced

    while ((matched = pattern.exec(code))) {
      replaced = true

      const start = matched.index
      const end = start + matched[0].length
      const replacement = String(functions[matched[1]](matched[0], ctx))

      magicString.overwrite(start, end, replacement)
    }

    return replaced
      ? magicString.toString()
      : code
  }
}

function escapeSepChars (s) {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
}

function buildPlaceholdersRegExp (sep = '{{}}') {
  if (!sep || sep.length < 2) return

  const half = Math.floor(sep.length / 2)
  const sepL = escapeSepChars(sep.slice(0, half).trim())
  const sepR = escapeSepChars(sep.slice(half).trim())

  return sepL && sepR && new RegExp(`${sepL}\\s*([a-zA-Z0-9_-]+)\\s*${sepR}`, 'g')
}

export function findPlaceholders (str, sep) {
  const regExp = buildPlaceholdersRegExp(sep)
  const result = {}

  if (regExp) {
    let match

    while ((match = regExp.exec(str))) result[match[1]] = true
  }

  return Object.keys(result)
}

export function replacePlaceholders (str, replacements, sep) {
  const regExp = buildPlaceholdersRegExp(sep)

  return regExp
    ? str.replaceAll(regExp, (match, placeholder) => {
      const key = placeholder.trim()
      return (key && replacements[key]) || match
    })
    : str
}
