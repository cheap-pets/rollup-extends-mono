/* eslint-disable security/detect-object-injection */
/* eslint-disable security/detect-non-literal-fs-filename */

import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { utils } from '@cheap-pets/rollup-extends'
import { generateHTML, formatHTML, extractInjectableFiles, createHtmlReplacer } from './html.js'

const {
  ensureFunction,
  createIdMatcher,
  resolveOutputDir,
  relativeFromCwd,
  resolveEmitFileName
} = utils

const pluginAction = 'HTM'

export default function plugin (pluginOptions = {}) {
  const {
    replacements,
    // replaceOptions,
    format,
    extensions = ['.htm', '.html']
  } = pluginOptions

  const idMatcher = createIdMatcher(extensions)
  const replacer = createHtmlReplacer({ replacements })

  let codes, sources, loaded

  async function emitFile (sourceOption, outputOptions) {
    const { id, chunk, queries = {}, scripts, links } = sourceOption

    const template = (codes[id] ??= (await readFile(id)).toString())
    const assetFileNames = ensureFunction(outputOptions.assetFileNames || '[name].[ext]')

    const assetInfo = {
      type: 'asset',
      name: `${chunk.name}.html`,
      source: template
    }

    const fileName =
      resolveEmitFileName(
        queries.fileName || (assetFileNames(assetInfo)),
        {
          name: chunk.name,
          hash: '',
          ext: 'html',
          extname: '.html',
          format: outputOptions.format !== 'iife' && outputOptions.format
        }
      ) || assetInfo.name

    const title = queries.title
    const html = generateHTML({ title, template, fileName, scripts, links })

    this.emitFile({
      fileName,
      type: 'asset',
      source: formatHTML(replacer?.(html) || html, format)
    })

    const outputDir = resolveOutputDir(outputOptions)
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
              .map(source => ({ chunk, ...source, ...injectableFiles }))
          )
        }
      })

      return Promise.all(
        bundleSources.map(source => emitFile.call(this, source, outputOptions))
      )
    }
  }
}
