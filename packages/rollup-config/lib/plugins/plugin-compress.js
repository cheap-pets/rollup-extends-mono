import { extname } from 'node:path'
import { compress } from '../utils/compress.js'
import { resolveOutputPath, relativeFromCwd } from '../utils/path.js'

const pluginAction = 'ZIP'

export default function plugin (options = {}) {
  const extensions = options.extensions?.map(el => el.toLowerCase())

  return {
    name: 'compress',
    async writeBundle (outputOptions, bundle) {
      if (this.meta.watchMode && options.watchMode !== true) return

      for (const chunk of Object.values(bundle)) {
        if (extensions?.includes(extname(chunk.fileName).toLowerCase()) === false) return

        const file = resolveOutputPath(outputOptions, chunk.fileName)
        const related = relativeFromCwd(file)

        await compress(file, options)
          .then(() =>
            this.info({ pluginAction, success: true, message: `"${related}" is compressed.` })
          )
          .catch(() =>
            this.warn({ pluginAction, message: `failed to compress "${related}".` })
          )
      }
    }
  }
}
