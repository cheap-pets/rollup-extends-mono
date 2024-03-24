import compress from '../utils/compress.js'

import { resolveOutputPath, relativeFromCwd } from '../utils/path.js'

export default function plugin (options = {}) {
  return {
    name: 'compress',
    async writeBundle (outputOptions, bundle) {
      for (const chunk of Object.values(bundle)) {
        const file = resolveOutputPath(outputOptions, chunk.fileName)
        const related = relativeFromCwd(file)

        await compress(file, options)
          .then(() => this.info({ success: true, message: `"${related}" is compressed.` }))
          .catch(() => this.warn({ message: `failed to compress "${related}".` }))
      }
    }
  }
}
