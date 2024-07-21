/* eslint-disable security/detect-object-injection */

import base from '@cheap-pets/rollup-plugin-css'
import browserslist from 'browserslist'

import postcss from 'postcss'
import pluginCalc from 'postcss-calc'
import pluginNest from 'postcss-nested'
import pluginAutoprefixer from 'autoprefixer'
import pluginAdvancedVars from 'postcss-advanced-variables'

import { utils } from '@cheap-pets/rollup-extends'

class PostCssError extends Error {
  constructor (options = {}) {
    super()

    const { reason = options.message, file, line, column } = options

    this.message = reason
    this.location = file && { file, line, column }
  }
}

export function createTranspiler (options = {}) {
  const {
    plugins,
    browserslistrc,
    variables,
    autoprefixer: autoprefixerOpt,
    advancedVariables: advancedOpt
  } = options

  const overrideBrowserslist = utils.isString(browserslistrc)
    ? browserslist.loadConfig({ path: browserslistrc })
    : undefined

  const processor = postcss(
    plugins ||
    [
      pluginAdvancedVars({ variables, ...advancedOpt }),
      pluginCalc,
      pluginNest,
      pluginAutoprefixer({ overrideBrowserslist, ...autoprefixerOpt })
    ]
  )

  return (code, id) =>
    processor
      .process(code, { from: id })
      .then(res => (
        {
          code: res.css,
          map: res.map,
          warnings: res.warnings?.(),
          dependencies: res.messages?.map(el => el.type === 'dependency' && el.file).filter(Boolean)
        }
      ))
      .catch(err => {
        throw new PostCssError(err)
      })
}

export default function plugin (options = {}) {
  const {
    include = '**/*.{css,pcss,postcss}',
    exclude,
    minify,
    extract,
    transform = createTranspiler(options)
  } = options

  return Object.assign(
    base({
      include,
      exclude,
      minify,
      extract,
      transform
    }),
    { name: 'postcss' }
  )
}
