import { createFilter } from '@rollup/pluginutils'

export default function plugin (options = {}) {
  const filter = createFilter(options.include, options.exclude)

  return {
    name: 'string',

    transform (code, id) {
      return filter(id)
        ? `const value = ${JSON.stringify(code)};\nexport default value;`
        : null
    }
  }
}
