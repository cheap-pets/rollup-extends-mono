/* eslint-disable security/detect-object-injection */

import {
  green, greenBright,
  cyan, cyanBright,
  // yellow, yellowBright,
  magenta, magentaBright,
  red, redBright,
  gray
} from 'colorette'

import { constantCase } from 'change-case'

const IGNORE_CODES = [
  'UNUSED_EXTERNAL_IMPORT',
  'UNKNOWN_OPTION'
]

const badges = {
  debug: '[>]',
  info: '[i]',
  warn: '[!]',
  error: '[x]',
  success: '[√]'
}

const colors = {
  info: [cyan, cyanBright],
  warn: [magenta, magentaBright],
  success: [green, greenBright],
  error: [red, redBright],
  debug: [v => v, v => v]
}

const timeHolder = gray('..:..:..:...')

function formatTime (date) {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0')

  return hours + ':' + minutes + ':' + seconds + ':' + milliseconds
}

function splitMultiLines (str = '', prefix = '') {
  const lines = str.split('\n').map(el => el.trim()).filter(el => !!el)

  return prefix
    ? lines.map(el => prefix + ' ' + el)
    : lines
}

function resolveLocationLines (loc = {}) {
  const lines = []

  if (loc.file) lines.push(`location.file: ${loc.file}`)
  if (loc.line) lines.push(`location.line: ${loc.line}`)
  if (loc.column) lines.push(`location.column: ${loc.column}`)

  return lines
}

function resolveIdLines (id, ids = []) {
  if (id && !ids.includes(id)) ids.unshift(id)

  return ids.map(el => `id: ${el}`)
}

function resolveMessageLines (level, log) {
  const message = log.plugin
    ? log.message.replace(/^\[plugin .*?\]/, '')
    : log.message

  const lines = [...splitMultiLines(message.trim())]

  if (lines.length > 1) lines.unshift('')

  if (['warn', 'error'].includes(level)) {
    lines.push(...resolveIdLines(log.id, log.ids))
    lines.push(...resolveLocationLines(log.loc))
    lines.push(...splitMultiLines(log.stack, '[Stack]'))
  }

  return lines
}

function resolveLevelType (level, log) {
  return (
    (level === 'warn' && log.error === true && 'error') ||
    (level === 'info' && log.success === true && 'success') ||
    (badges[level] && level) ||
    'info'
  )
}

function resolveCodes (level, { plugin, pluginAction, pluginCode, code = 'UNKNOWN' }) {
  const codes = []

  if (pluginAction) {
    codes.push(pluginAction.toUpperCase())
  } else {
    if (plugin) codes.push(constantCase(plugin))
    if (pluginCode) codes.push(constantCase(pluginCode))
  }

  if (['warn', 'error'].includes(level) && !codes.length) codes.push(code)

  return codes
}

function onLog (level, log) {
  if (!log.message || IGNORE_CODES.includes(log.code)) return

  const time = gray(formatTime(new Date()))
  const type = resolveLevelType(level, log)

  const [priColor, secColor] = colors[type]

  const badge = priColor(badges[type])
  const badgeHolder = priColor('...')

  const codes = resolveCodes(level, log).map(el => secColor(`[${el}]`))
  const messages = resolveMessageLines(level, log)

  messages
    .forEach((message, idx) => console.log(
      ...(
        idx
          ? [timeHolder, badgeHolder, message]
          : [time, badge, ...codes, message]
      )
    ))
}

export {
  onLog
}
