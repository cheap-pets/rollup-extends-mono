/* eslint-disable security/detect-object-injection */

import base from '@cheap-pets/rollup-plugin-css'
import browserslist from 'browserslist'

import postcss from 'postcss'
import postcssCalc from 'postcss-calc'
import postcssNest from 'postcss-nested'
import autoprefixer from 'autoprefixer'
import postcssAdvanced from 'postcss-advanced-variables'

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
    autoprefixer: autoprefixerOpt,
    advancedVariables: advancedOpt
  } = options

  const overrideBrowserslist = utils.isString(browserslistrc)
    ? browserslist.loadConfig({ path: browserslistrc })
    : undefined

  const processor = postcss(
    plugins ||
    [
      postcssAdvanced(advancedOpt),
      postcssCalc,
      postcssNest,
      autoprefixer({ overrideBrowserslist, ...autoprefixerOpt })
    ]
  )

  return (code, id) =>
    processor
      .process(code, { from: id })
      .then(res => (
        {
          code: res.css,
          map: res.map,
          warnings: res.warnings?.()
        }
      ))
      .catch(err => {
        throw new PostCssError(err)
      })
}

export default function plugin (options = {}) {
  const {
    minify,
    extract,
    transform = createTranspiler(options),
    extensions = ['.css', '.pcss', '.postcss']
  } = options

  return Object.assign(
    base({
      minify,
      extract,
      transform,
      extensions
    }),
    { name: 'postcss' }
  )
}
