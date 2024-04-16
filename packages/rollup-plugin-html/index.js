/* eslint-disable security/detect-object-injection */
/* eslint-disable security/detect-non-literal-fs-filename */

import { readFile } from 'node:fs/promises'
import { utils } from '@cheap-pets/rollup-preset-core'

const { resolveOutputPath } = utils.path
const { idMatcherBuild } = utils.id
const { isFunction } = utils.type

const pluginAction = 'HTM'

function plugin (pluginOptions = {}) {
  const {
    fileName: oFileName,
    extensions = ['.htm', '.html']
  } = pluginOptions

  const matchId = idMatcherBuild(extensions)

  let codes, sources, loaded

  function transform (code, fileName, chunk, chunks) {

  }

  async function emitFile (sourceOption, outputOptions) {
    const { id, chunk, chunks, queries = {} } = sourceOption

    const fileName = (
      isFunction(oFileName)
        ? oFileName({ id, queries, chunk })
        : oFileName || queries.fileName
    )?.replaceAll('[chunkName]', chunk.name) || `${chunk.name}.html`

    const code = (codes[id] ??= (await readFile(id)).toString())
    const source = transform(code, fileName, chunk, chunks)

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
      const matched = matchId(source)

      return matched
        ? (await this.resolve(matched.id, importer)).id + (matched.query || '')
        : null
    },

    async load (id) {
      const matched = matchId(id, true)

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
