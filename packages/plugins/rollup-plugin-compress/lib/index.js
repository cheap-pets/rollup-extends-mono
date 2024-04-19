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

      for (const chunk of Object.values(bundle)) {
        if (extensions?.includes(extname(chunk.fileName).toLowerCase()) === false) return

        const file = resolve(outputDir, chunk.fileName)
        const name = relativeFromCwd(file)

        await compress(file, options)
          .then(() =>
            this.info({ pluginAction, success: true, message: `"${name}" is compressed.` })
          )
          .catch(() =>
            this.warn({ pluginAction, message: `failed to compress "${name}".` })
          )
      }
    }
  }
}
