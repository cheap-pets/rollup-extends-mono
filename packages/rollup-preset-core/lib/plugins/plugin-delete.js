/* eslint-disable security/detect-object-injection */

import { glob } from 'glob'
import { remove } from 'fs-extra'
import { resolve } from 'node:path'
import { resolveOutputPath, relativeFromCwd } from '../utils/path.js'

const removed = {}

function plugin (options = {}) {
  const {
    once = true,
    targets = []
  } = options

  const generated = {}

  return {
    name: 'delete',

    async buildStart () {
      const unremoved = targets.filter(el =>
        (!once || !removed[el]) &&
        (removed[el] = true)
      )

      if (unremoved.length) {
        const paths = await glob(unremoved)

        for (const el of paths) {
          await remove(resolve(el))
            .then(() => this.info({ success: true, message: `"${el}" is deleted.` }))
            .catch(() => this.warn({ message: `failed to remove "${el}".` }))
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
            .then(() => this.info({ success: true, message: `"${relatedPath}" is deleted.` }))
            .catch(() => this.warn({ error: true, message: `failed to remove "${oldFile}".` }))
        }
      }
    }
  }
}

export default plugin
