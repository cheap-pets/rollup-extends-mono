import { createFilter } from '@rollup/pluginutils'

export default function plugin (options = {}) {
  const filter = createFilter(options.include, options.exclude)

  return {
    name: 'string',

    transform (code, id) {
      if (options.include && filter(id)) {
        return {
          code: `export default ${JSON.stringify(code)};`,
          map: { mappings: '' }
        }
      }
    }
  }
}
