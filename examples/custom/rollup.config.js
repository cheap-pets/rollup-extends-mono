/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unpublished-import */

import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globToRollupConfig } from '@cheap-pets/rollup-extends'

import postcss from 'rollup-plugin-postcss'
import pluginCopy from '@cheap-pets/rollup-plugin-copy'
import pluginHtml from '@cheap-pets/rollup-plugin-html'
import pluginString from '@cheap-pets/rollup-plugin-string'
import pluginDelete from '@cheap-pets/rollup-plugin-delete'
import pluginCompress from '@cheap-pets/rollup-plugin-compress'
import pluginGlobImport from '@cheap-pets/rollup-plugin-glob-import'

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

const config = globToRollupConfig({
  'src/index-{a-*,b}.js': () => ({
    logLevel: 'info',
    plugins: [
      {
        plugin: pluginDelete,
        option: { targets: ['dist/*'] }
      },
      {
        plugin: pluginCopy,
        option: { targets: { 'src/assets': 'dist/assets' } }
      },
      {
        plugin: pluginString,
        option: { include: '**/*.txt' }
      },
      pluginGlobImport,
      [postcss, { extract: true }],
      [pluginHtml, { replacements: { '{{ title }}': '这是标题' } }],
      pluginCompress,
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
            : 'assets/[name].[hash].js'
        }
      },
      {
        dir: 'dist',
        hashCharacters: 'base36',
        entryFileNames (chunkInfo) {
          return chunkInfo.name === 'b'
            ? '[name].min.js'
            : 'assets/[name].[hash].min.js'
        }
      }
    ],
    onwarn (msg, defaultHandler) {
      if (msg.code !== 'UNKNOWN_OPTION') defaultHandler(msg)
    }
  })
})

export default config
