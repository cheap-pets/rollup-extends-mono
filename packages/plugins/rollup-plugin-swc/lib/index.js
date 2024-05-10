/* eslint-disable security/detect-non-literal-fs-filename */

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { createFilter } from '@rollup/pluginutils'
import { createMerger } from 'smob'
import { transform } from '@swc/core'
import { utils } from '@cheap-pets/rollup-extends'

import browserslist from 'browserslist'

const isDevEnv = Boolean(process.env.dev)
const merge = createMerger({ array: false })

export default function plugin (options = {}) {
  const {
    include,
    exclude,
    swcrc = true,
    browserslistrc = true
  } = options

  const filter = createFilter(include, exclude)

  const defaultOptions = {
    env: {
      coreJs: '3'
    },
    minify: !isDevEnv
  }

  if (swcrc) {
    const swcrcPath = utils.isString(swcrc)
      ? swcrc
      : resolve(process.cwd(), '.swcrc')

    if (existsSync(swcrcPath)) defaultOptions.configFile = swcrcPath
  }

  if (browserslistrc) {
    const targets = browserslist.loadConfig({
      env:
        process.env.dev,
      path:
        utils.isString(browserslistrc)
          ? browserslistrc
          : process.cwd()
    })

    if (targets) defaultOptions.env.targets = targets
  }

  const swcOptions = merge({ ...options.swc }, defaultOptions)

  return {
    name: 'swc',

    transform (code, id) {
      return filter(id)
        ? transform(code, swcOptions)
        : null
    }
  }
}
