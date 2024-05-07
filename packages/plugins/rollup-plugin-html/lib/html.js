/* eslint-disable security/detect-object-injection */

import { dirname, extname, relative } from 'node:path'
import { utils } from '@cheap-pets/rollup-extends'

import beautify from 'js-beautify'

const InjectableTypes = {
  js: {
    bucket: 'scripts',
    attributes: (src, outputFormat) => ({
      src,
      type: outputFormat === 'es' ? 'module' : 'text/javascript'
    })
  },
  css: {
    bucket: 'links',
    attributes: href => ({
      href,
      type: 'text/css',
      rel: 'stylesheet'
    })
  }
}

export function getInjectableFiles (files, outputFormat) {
  const result = {}

  for (const file of files) {
    const name = file.fileName
    const extName = extname(name).substr(1).toLowerCase()
    const resType = InjectableTypes[extName]

    if (resType) {
      (result[resType.bucket] ??= []).push({ ...resType.attributes(name, outputFormat) })
    }
  }

  return result
}

export function createHtmlReplacer ({ replacements }) {
  return replacements
    ? utils.createCodeReplacer({
      delimiters: ['', ''],
      objectGuards: false,
      preventAssignment: true,
      replacements
    })
    : code => code
}

function getRelativePath (src, htmlFileName) {
  const dir = dirname(htmlFileName)
  const relativePath = relative(dir, src)

  return relativePath.replaceAll('\\', '/')
}

function attributesToString (attributes) {
  return Object
    .entries(attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ')
}

function getScriptsReplacement (scripts, htmlFileName) {
  return scripts
    ?.map(el => {
      const attrs = attributesToString({
        ...el,
        src: getRelativePath(el.src, htmlFileName)
      })

      return `<script ${attrs}></script>`
    })
    .join('\n')
}

function getLinksReplacement (links, htmlFileName) {
  return links
    ?.map(el => {
      const attrs = attributesToString({
        ...el,
        href: getRelativePath(el.href, htmlFileName)
      })

      return `<link ${attrs}></link>`
    })
    .join('\n')
}

function basicReplacement (key, values) {
  return values[key] ?? ''
}

const injectToTemplate = createHtmlReplacer({
  replacements: {
    '{{ title }}': basicReplacement,
    '{{ links }}': basicReplacement,
    '{{ scripts }}': basicReplacement
  }
})

export function generateHTML (options) {
  const { template, fileName, title, scripts, links } = options

  return injectToTemplate(template, {
    '{{ title }}': title,
    '{{ links }}': getLinksReplacement(links, fileName),
    '{{ scripts }}': getScriptsReplacement(scripts, fileName)
  })
}

export function beautifyHTML (code, options) {
  return options === false
    ? code
    : beautify.html_beautify(code, { indent_size: 2, ...options })
}
