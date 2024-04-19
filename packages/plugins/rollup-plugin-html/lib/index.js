/* eslint-disable security/detect-object-injection */
/* eslint-disable security/detect-non-literal-fs-filename */

import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { utils } from '@cheap-pets/rollup-extends'
import { generateHTML, formatHTML, extractInjectableFiles, createHtmlReplacer } from './html.js'

const { isFunction, createIdMatcher, resolveOutputDir, relativeFromCwd } = utils

const pluginAction = 'HTM'

export default function plugin (pluginOptions = {}) {
  const {
    fileNames,
    replacements,
    // replaceOptions,
    format,
    extensions = ['.htm', '.html']
  } = pluginOptions

  const idMatcher = createIdMatcher(extensions)
  const replacer = createHtmlReplacer({ replacements })

  let codes, sources, loaded

  async function emitFile (sourceOption) {
    const { id, outputDir, chunk, queries = {}, scripts, links } = sourceOption

    const fileName =
      (
        queries.fileName ||
        (
          isFunction(fileNames)
            ? fileNames({ id, queries, chunk })
            : fileNames
        )
      )?.replaceAll('[name]', chunk.name) || `${chunk.name}.html`

    const title = queries.title
    const template = (codes[id] ??= (await readFile(id)).toString())
    const html = generateHTML({ title, template, fileName, scripts, links })

    this.emitFile({
      fileName,
      type: 'asset',
      source: formatHTML(replacer?.(html) || html, format)
    })

    const displayName = relativeFromCwd(resolve(outputDir, fileName))

    this.info({
      pluginAction,
      message: `"${displayName}" is generated.`
    })
  }

  return {
    name: 'html',

    buildStart () {
      codes = {}
      loaded = {}
      sources = []
    },

    async resolveId (source, importer) {
      const matched = idMatcher(source)

      return matched
        ? (await this.resolve(matched.id, importer)).id + (matched.query || '')
        : null
    },

    async load (id) {
      const matched = idMatcher(id, true)

      if (!matched) return null

      this.addWatchFile(matched.id)

      Array
        .from(this.getModuleIds(id))
        .forEach(moduleId => {
          if (this.getModuleInfo(moduleId).isEntry) {
            (sources[moduleId] ??= {})[id] = matched
          }
        })

      return ''
    },

    generateBundle (outputOptions, bundle) {
      const outputDir = resolveOutputDir(outputOptions)

      const chunks = Object.values(bundle)
      const chunkFiles = chunks.map(el => el.fileName)
      const injectableFiles = extractInjectableFiles(chunkFiles, outputOptions.format)

      const bundleSources = []

      chunks.forEach(chunk => {
        const entryId = (chunk.type === 'chunk') && chunk.facadeModuleId

        if (entryId && sources[entryId] && !loaded[entryId]) {
          loaded[entryId] = true

          bundleSources.push(
            ...Object
              .values(sources[entryId])
              .map(source => ({ outputDir, chunk, ...source, ...injectableFiles }))
          )
        }
      })

      return Promise.all(
        bundleSources.map(source => emitFile.call(this, source))
      )
    }
  }
}
