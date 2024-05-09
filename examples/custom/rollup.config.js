/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unpublished-import */

import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globToRollupConfig } from '@cheap-pets/rollup-extends'
import { preset } from '@cheap-pets/rollup-preset-web'

import postcss from 'postcss'

process.chdir(
  dirname(fileURLToPath(import.meta.url))
)
const isDevEnv = Boolean(process.env.dev)
const hashPart = isDevEnv ? '' : '.[hash]'

const postcssRunner = postcss([])

const myPreset = preset.extend({
  logLevel: 'info',
  output: {
    dir: 'dist',
    entryFileNames: `assets/js/[name]${hashPart}.js`,
    chunkFileNames: `assets/[ext]/[name]${hashPart}.[ext]`,
    assetFileNames: `assets/[ext]/[name]${hashPart}.[ext]`
  },
  overwritePluginOptions: {
    css: {
      minify: true,
      extract: true,
      transform: (code, id) => postcssRunner.process(code, { from: id })
    },
    html: {
      fileNames: '[name].html',
      replacements: { '{{ timestamp }}': '2024-04-26' }
    }
  }
})

const config = globToRollupConfig({
  'src/index-*.js': () => myPreset.config()
})

export default config
