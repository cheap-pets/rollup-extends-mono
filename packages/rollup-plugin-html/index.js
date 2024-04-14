/* eslint-disable security/detect-non-literal-fs-filename */

import { readFile } from 'node:fs/promises'
import { utils } from '@cheap-pets/rollup-preset-core'

const pluginAction = 'HTM'

function plugin (pluginOptions = {}) {
  const {
    extensions = ['.htm', '.html']
  } = pluginOptions

  const matchId = utils.id.idMatcherBuild(extensions)
  const contents = {}

  return {
    name: 'html',

    async resolveId (source, importer) {
      const matched = matchId(source)

      return matched
        ? `${source}${matched.query ? '&' : '?'}importer=${importer}`
        : null
    },

    async load (id) {
      delete contents[id]

      const matched = matchId(id)
      const importer = matched?.query?.importer

      if (!importer) return null

      const file = (await this.resolve(matched.id, importer)).id
      const code = (await readFile(file)).toString()

      const importerContents = contents[importer] || (contents[importer] = {})

      Object.assign(importerContents, {
        [matched.id]: {
          code
        }
      })

      return ''
    },

    generateBundle (outputOptions, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'asset') continue

        const file = utils.path.resolveOutputPath(outputOptions, chunk.fileName)
        const related = utils.path.relativeFromCwd(file)

        for (const moduleId of Object.keys(chunk.modules)) {
          const importerContents = contents[moduleId]

          if (importerContents) {
            Object
              .entries(importerContents)
              .forEach(([id, content]) => {
                this.emitFile({
                  type: 'asset',
                  fileName: `${chunk.name}.html`,
                  source: content.code
                })
              })
          }
        }
      }
    }
  }
}

export default plugin
