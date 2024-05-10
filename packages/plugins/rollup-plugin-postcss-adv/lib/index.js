/* eslint-disable security/detect-object-injection */

import base from '@cheap-pets/rollup-plugin-css'
import browserslist from 'browserslist'

import postcss from 'postcss'
import postcssCalc from 'postcss-calc'
import postcssNest from 'postcss-nested'
import autoprefixer from 'autoprefixer'
import postcssAdvanced from 'postcss-advanced-variables'

import { utils } from '@cheap-pets/rollup-extends'

export function createTranspiler (options = {}) {
  const {
    env = process.env.dev,
    overrideBrowserslist: targets = options.autoprefixer?.overrideBrowserslist,
    autoprefixer: autoprefixerOpt = {},
    plugins,
    ...advOptions
  } = options

  const processor = postcss(
    plugins ||
    [
      postcssAdvanced(advOptions),
      postcssCalc,
      postcssNest,
      autoprefixer({
        ...autoprefixerOpt,
        overrideBrowserslist:
          utils.isString(targets)
            ? browserslist.loadConfig({ env, path: targets })
            : Array.isArray(targets) ? targets : undefined
      })
    ]
  )

  return (code, id) => processor.process(code, { from: id })
}

export default function plugin (options = {}) {
  const {
    minify,
    extract,
    transform,
    extensions = ['.css', '.pcss', '.postcss'],
    ...transformOptions
  } = options

  return Object.assign(
    base({
      minify,
      extract,
      extensions,
      transform:
        transform === undefined
          ? createTranspiler(transformOptions)
          : undefined
    }),
    { name: 'postcss' }
  )
}
