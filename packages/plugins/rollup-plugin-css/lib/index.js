/* eslint-disable security/detect-object-injection */

import { parse } from 'node:path'
import { utils } from '@cheap-pets/rollup-extends'
import { createMerger } from 'smob'

import CleanCSS from 'clean-css'

const { createIdMatcher, isString, isObject, isFunction } = utils

const getInjectionCode = source => `
!(function () {
  const style = document.createElement("style");
  style.textContent = ${JSON.stringify(source)};
  document.head.appendChild(style);
})();
`

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

function resolveMinifier (minifyOpt, cleanCSSOption) {
  if (isFunction(minifyOpt)) return minifyOpt

  if (minifyOpt !== false) {
    const level = [true, 1, 2].includes(minifyOpt) ? +minifyOpt : undefined

    const format = !level && !cleanCSSOption && {
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

    const minifier = new CleanCSS(
      merge({}, { ...cleanCSSOption }, { level, format })
    )

    return code => minifier.minify(code).styles
  }
}

export default function plugin (pluginOptions = {}) {
  const {
    extensions = ['.css'],
    transform = v => v,
    extract = false,
    cleanCSS,
    minify: minifyOpt = 0
  } = pluginOptions

  const styles = {}
  const filter = createIdMatcher(extensions)
  const minify = resolveMinifier(minifyOpt, cleanCSS)

  return {
    name: 'css',

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

          // if (result.warnings) {
          //   for (const warning of result.warnings()) {
          //     if (!warning.message) {
          //       warning.message = warning.text
          //     }

          //     this.warn(warning)
          //   }
          // }

          if (code) {
            styles[id] = { code, map: result.map }
          }

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

        if (!code) continue

        const source = minify
          ? minify(code)
          : code

        if (extract) {
          const name = outputOptions.file
            ? parse(outputOptions.file).name
            : file.name

          this.emitFile({
            type: 'asset',
            name: `${name}.css`,
            source
          })
        } else {
          file.code += getInjectionCode(source)
        }
      }
    }
  }
}
