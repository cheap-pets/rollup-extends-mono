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

function getRelativePath (src, htmlFileName) {
  const htmlDir = dirname(htmlFileName)
  const related = relative(htmlDir, src)

  return related.replaceAll('\\', '/')
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

function buildReplacements ({ replacements: getExternalReplacements, ...options }) {
  const {
    asset,
    links,
    scripts,
    params,
    placeholders
  } = options

  if (!placeholders.length) return

  return {
    ...params,
    links: getLinksReplacement(links, asset.fileName) || '',
    scripts: getScriptsReplacement(scripts, asset.fileName) || '',
    ...getExternalReplacements(options)
  }
}

export function generateHTML (options, beautifyOptions) {
  const replacements = buildReplacements(options)

  const code = replacements
    ? utils.replacePlaceholders(options.template, replacements)
    : options.template

  return beautifyOptions !== false
    ? beautify.html_beautify(code, { indent_size: 2, preserve_newlines: false, ...beautifyOptions })
    : code
}
