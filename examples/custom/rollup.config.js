/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unpublished-import */

import { generateRollupConfig } from '@cheap-pets/rollup-preset-core'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

process.chdir(
  dirname(fileURLToPath(import.meta.url))
)

function myPlugin (options = {}) {
  return {
    name: 'myPlugin',
    async buildStart (inputOptions) {
      // console.log('[buildStart:inputOptions]', inputOptions)
      // console.log('[buildStart:thisContext]', this)
      // console.log(this.meta.watchMode)
    },
    async generateBundle (outputOptions, bundle) {
      this._x = 1
      // console.log('[generateBundle:bundle]', bundle)
    },
    writeBundle (outputOptions, bundle) {
    }
  }
}

const rollupConfig = generateRollupConfig({
  logLevel: 'debug',
  input:
    // 'src/index-a-x.js',
    // { app: 'src/index-a.js' },
    ['src/index-a-*.js', 'src/index-b.js'],
  separateInputs: false,
  plugins: [
    {
      plugin: 'delete',
      option: { targets: ['dist/*'] }
    },
    [
      'copy',
      {
        targets: {
          'src/assets': 'dist/assets'
        }
      }
    ],
    'compress',
    myPlugin
  ],
  output: [
    {
      // format: 'iife',
      // name: 'app',
      dir: 'dist',
      hashCharacters: 'base36',
      // hash: true
      // entryFileNames: '[name].[hash].js'
      entryFileNames (chunkInfo) {
        return chunkInfo.name === 'b'
          ? '[name].js'
          : '[name].[hash].js'
      }
    },
    {
      dir: 'dist',
      hashCharacters: 'base36',
      entryFileNames (chunkInfo) {
        return chunkInfo.name === 'b'
          ? '[name].min.js'
          : '[name].[hash].min.js'
      }
    }
  ],
  onwarn (msg, defaultHandler) {
    if (msg.code !== 'UNKNOWN_OPTION') defaultHandler(msg)
  }
})

// console.log(rollupConfig)
// console.log(process.argv)

export default rollupConfig
