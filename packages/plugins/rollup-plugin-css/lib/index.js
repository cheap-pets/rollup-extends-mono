/* eslint-disable security/detect-object-injection */

import CleanCSS from 'clean-css'

import { parse } from 'node:path'
import { utils } from '@cheap-pets/rollup-extends'

import { createMerger } from 'smob'
import { createFilter } from '@rollup/pluginutils'

const { isFunction, isString } = utils

const getInjectionCode = source => `
!(function () {
  const style = document.createElement("style");
  style.textContent = ${JSON.stringify(source)};
  document.head.appendChild(style);
})();
`

const DEFAULT_CLEAN_CSS_FORMAT = {
  breaks: {
    afterAtRule: true,
    afterBlockBegins: true,
    afterBlockEnds: true,
    afterComment: true,
    afterProperty: true,
    afterRuleBegins: true,
    afterRuleEnds: 2,
    beforeBlockEnds: true,
    betweenSelectors: true
  },
  breakWith: '\n',
  spaces: {
    aroundSelectorRelation: true,
    beforeBlockBegins: true,
    beforeValue: true
  },
  semicolonAfterLastProperty: true,
  indentBy: 2
}

/*
function internalMinify (code) {
  return code
    .replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, '')
    .replace(/ {2,}/g, ' ')
    .replace(/ ([{:}]) /g, '$1')
    .replace(/([{:}]) /g, '$1')
    .replace(/([;,]) /g, '$1')
    .replace(/ !/g, '$1')
}
*/

const merge = createMerger({ array: false })

function resolveMinifier (minifyOpt, cleanOpt) {
  if (minifyOpt === false) return v => v
  if (isFunction(minifyOpt)) return minifyOpt

  const level = [true, 1, 2].includes(minifyOpt) ? +minifyOpt : undefined
  const format = !level && !cleanOpt && DEFAULT_CLEAN_CSS_FORMAT

  const minifier = new CleanCSS(
    merge({}, { ...cleanOpt }, { level, format })
  )

  return code => minifier.minify(code).styles
}

export default function plugin (pluginOptions = {}) {
  const {
    include = '**/*.css',
    exclude,
    transform = v => v,
    extract = false,
    minify: minifyOpt = 0,
    cleanCSS: cleanOpt
  } = pluginOptions

  const styles = {}
  const filter = createFilter(include, exclude)
  const minify = resolveMinifier(minifyOpt, cleanOpt)

  function generateStyleCode (chunk) {
    const code = Array
      .from(this.getModuleIds(chunk.facadeModuleId))
      .map(id => styles[id]?.code)
      .filter(Boolean)
      .join('\n')
      .trim()

    return code && minify(code)
  }

  return {
    name: 'css',

    transform (code, id) {
      if (!filter(id)) return

      return Promise
        .resolve(transform(code, id))
        .then(result => {
          const { code: css, map, warnings, dependencies } =
            isString(result) ? { code: result } : Object(result)

          if (this.meta.watchMode) {
            dependencies?.forEach(el => this.addWatchFile(el))
          }

          warnings?.forEach?.(el => this.warn(isString(el) ? el : el.message))

          if (css) {
            styles[id] = { code: css, map }
          }

          return 'export default undefined'
        })
        .catch(error => {
          this.warn({ ...error, error: true })
          throw error
        })
    },

    intro (chunk) {
      if (!extract) {
        const source = generateStyleCode.call(this, chunk)

        if (source) {
          return getInjectionCode(source)
        }
      }
    },

    generateBundle (outputOptions, bundle) {
      if (!extract) return

      const files = Object.values(bundle)

      for (const file of files) {
        const source = file.type === 'chunk' && generateStyleCode.call(this, file)

        if (source) {
          const name = outputOptions.file
            ? parse(outputOptions.file).name
            : file.name

          this.emitFile({
            name: `${name}.css`,
            type: 'asset',
            source
          })
        }
      }
    }
  }
}
