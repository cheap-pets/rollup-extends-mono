/* eslint-disable security/detect-object-injection */

import base from '@cheap-pets/rollup-plugin-css'
import browserslist from 'browserslist'

import postcss from 'postcss'
import scssParser from 'postcss-scss'

import pluginVars from 'postcss-simple-vars'
import pluginSass from '@csstools/postcss-sass'
import pluginAutoprefixer from 'autoprefixer'

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
    syntax = scssParser,
    sass: sassOpt
  } = options

  const overrideBrowserslist = utils.isString(browserslistrc)
    ? browserslist.loadConfig({ path: browserslistrc })
    : undefined

  const codePrefix = variables
    ? Object.entries(variables).map(([key, value]) => `$${key}: ${value};\n`).join('')
    : ''

  const processor = postcss(
    plugins || [
      pluginSass({ ...sassOpt }),
      pluginAutoprefixer({ overrideBrowserslist, ...autoprefixerOpt }),
      ...(variables ? [pluginVars({ variables })] : [])
    ]
  )

  return (code, id) =>
    processor
      .process(`${codePrefix}${code}`, { syntax, from: id })
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
    include = '**/*.{css,scss,sass}',
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
