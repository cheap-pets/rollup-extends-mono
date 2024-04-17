/* eslint-disable security/detect-object-injection */
/* eslint-disable security/detect-non-literal-fs-filename */

import { readFile } from 'node:fs/promises'
import { utils } from '@cheap-pets/rollup-config'

const { isFunction, buildIdMatcher, buildCodeReplacer } = utils

const pluginAction = 'HTM'

function buildReplacer (options) {
  return options.replacements && buildCodeReplacer({
    delimiters: ['', ''],
    objectGuards: false,
    preventAssignment: true,
    ...options
  })
}

function plugin (pluginOptions = {}) {
  const {
    fileNames,
    replacements,
    replaceOptions,
    extensions = ['.htm', '.html']
  } = pluginOptions

  const idMatcher = buildIdMatcher(extensions)
  const replacer = buildReplacer({ replacements, ...replaceOptions })

  let codes, sources, loaded

  function transform (code, fileName, chunk, chunks) {
    return replacer?.(code) || code
  }

  async function emitFile (sourceOption, outputOptions) {
    const { id, chunk, chunks, queries = {} } = sourceOption

    const fileName =
      (
        queries.fileName ||
        (
          isFunction(fileNames)
            ? fileNames({ id, queries, chunk })
            : fileNames
        )
      )?.replaceAll('[name]', chunk.name) || `${chunk.name}.html`

    const code = (codes[id] ??= (await readFile(id)).toString())
    const source = transform.call(this, code, fileName, chunk, chunks)

    this.emitFile({
      type: 'asset',
      fileName,
      source
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
      const bundleSources = []

      chunks.forEach(chunk => {
        const entryId = (chunk.type === 'chunk') && chunk.moduleIds?.[0]

        if (entryId && !loaded[entryId] && sources[entryId]) {
          loaded[entryId] = true

          bundleSources.push(
            ...Object
              .values(sources[entryId])
              .map(source => ({ ...source, chunk, chunks }))
          )
        }
      })

      return Promise.all(
        bundleSources.map(source => emitFile.call(this, source, outputOptions))
      )
    }
  }
}

export default plugin
