/* eslint-disable security/detect-object-injection */

import { parse } from 'node:path'
import { utils } from '@cheap-pets/rollup-extends'

const { createIdMatcher, isString, isObject, isFunction } = utils

function defaultMinifier (css) {
  return css
    .replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, '')
    .replace(/ {2,}/g, ' ')
    .replace(/ ([{:}]) /g, '$1')
    .replace(/([{:}]) /g, '$1')
    .replace(/([;,]) /g, '$1')
    .replace(/ !/g, '$1')
}

export default function plugin (pluginOptions = {}) {
  const {
    extensions = ['.css'],
    transform = v => v,
    extract = false,
    minify = false
  } = pluginOptions

  const styles = {}
  const filter = createIdMatcher(extensions)
  const minifier = isFunction(minify) ? minify : minify && defaultMinifier

  return {
    transform (code, id) {
      if (!filter(id)) return

      return Promise
        .resolve(transform(code, id))
        .then(result => {
          const code = isString(result)
            ? result
            : isObject(result)
              ? result.code || result.css
              : null

          if (code) styles[id] = { code, map: result.map }

          return 'export default undefined'
        })
    },

    generateBundle (outputOptions, bundle) {
      const files = Object.values(bundle)

      for (const file of files) {
        if (file.type !== 'chunk') continue

        const code = Array
          .from(this.getModuleIds(file.facadeModuleId))
          .map(id => styles[id]?.code)
          .filter(Boolean)
          .join('\n')
          .trim()

        if (code) {
          const source = minifier ? minifier(code) : code

          if (extract) {
            this.emitFile({
              type: 'asset',
              name: `${parse(file.fileName).name}.css`,
              source
            })
          } else {
            file.code += `
!(function () {
  const style = document.createElement('style');
  style.textContent = \`${source.replace(/`/g, '\\`')}\`;
  document.head.appendChild(style);
})();
`
          }
        }
      }
    }
  }
}
