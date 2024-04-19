/* eslint-disable security/detect-object-injection */

import { glob } from 'glob'
import { remove } from 'fs-extra'
import { resolve } from 'node:path'
import { utils } from '@cheap-pets/rollup-extends'

const { resolveOutputPath, relativeFromCwd } = utils

const handled = {}
const pluginAction = 'DEL'

function plugin (pluginOptions = {}) {
  const { targets = [] } = pluginOptions

  const generated = {}

  return {
    name: 'delete',

    async options () {
      const unhandled = targets.filter(
        el => !handled[el] && (handled[el] = true)
      )

      if (unhandled.length) {
        const paths = await glob(unhandled)

        for (const el of paths) {
          await remove(resolve(el))
            .then(() => this.info({ pluginAction, success: true, message: `"${el}" is deleted.` }))
            .catch(() => this.warn({ pluginAction, error: true, message: `failed to remove "${el}".` }))
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
            .then(() =>
              this.info({ pluginAction, success: true, message: `"${relatedPath}" is deleted.` })
            )
            .catch(() =>
              this.warn({ pluginAction, error: true, message: `failed to remove "${oldFile}".` })
            )
        }
      }
    }
  }
}

export default plugin
