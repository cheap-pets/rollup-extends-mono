/* eslint-disable security/detect-object-injection */

import { glob } from 'glob'
import { remove } from 'fs-extra'
import { resolve } from 'node:path'
import { resolveOutputPath, relativeFromCwd } from '../utils/path.js'

const handled = {}
const alias = 'DEL'

function plugin (options = {}) {
  const { targets = [] } = options

  const generated = {}

  return {
    name: 'delete',

    async buildStart () {
      const unhandled = targets.filter(
        el => !handled[el] && (handled[el] = true)
      )

      if (unhandled.length) {
        const paths = await glob(unhandled)

        for (const el of paths) {
          await remove(resolve(el))
            .then(() => this.info({ alias, success: true, message: `"${el}" is deleted.` }))
            .catch(() => this.warn({ alias, error: true, message: `failed to remove "${el}".` }))
        }
      }
    },

    async writeBundle (outputOptions, bundle) {
      if (!this.meta.watchMode) return

      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue

        const key = chunk.preliminaryFileName
        const oldFile = generated[key]

        generated[key] = chunk.fileName

        if (oldFile && oldFile !== chunk.fileName) {
          const oldFilePath = resolveOutputPath(outputOptions, oldFile)
          const relatedPath = relativeFromCwd(oldFilePath)

          await remove(oldFilePath)
            .then(() => this.info({ alias, success: true, message: `"${relatedPath}" is deleted.` }))
            .catch(() => this.warn({ alias, error: true, message: `failed to remove "${oldFile}".` }))
        }
      }
    }
  }
}

export default plugin