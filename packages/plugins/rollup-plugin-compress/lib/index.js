import { extname, resolve } from 'node:path'
import { utils } from '@cheap-pets/rollup-extends'

const { compress, resolveOutputDir, relativeFromCwd } = utils

const pluginAction = 'ZIP'

export default function plugin (options = {}) {
  const extensions = options.extensions?.map(el => el.toLowerCase())

  return {
    name: 'compress',

    async writeBundle (outputOptions, bundle) {
      if (this.meta.watchMode && options.watchMode !== true) return

      const outputDir = resolveOutputDir(outputOptions)

      for (const file of Object.values(bundle)) {
        if (extensions?.includes(extname(file.fileName).toLowerCase()) === false) return

        const fileName = resolve(outputDir, file.fileName)
        const dispName = relativeFromCwd(fileName)

        await compress(fileName, options)
          .then(() =>
            this.info({ pluginAction, success: true, message: `"${dispName}" is compressed.` })
          )
          .catch(() =>
            this.warn({ pluginAction, message: `failed to compress "${dispName}".` })
          )
      }
    }
  }
}
