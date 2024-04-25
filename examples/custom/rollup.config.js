/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unpublished-import */

import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globToRollupConfig, createPreset } from '@cheap-pets/rollup-extends'

import pluginPostcss from 'rollup-plugin-postcss'
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

const preset = createPreset({
  logLevel: 'info',
  plugins: [
    {
      name: 'delete',
      plugin: pluginDelete,
      option: { targets: ['dist/*'] }
    },
    {
      name: 'copy',
      plugin: pluginCopy,
      option: { targets: { 'src/assets': 'dist/assets' } }
    },
    {
      name: 'string',
      plugin: pluginString,
      option: { include: '**/*.txt' }
    },
    {
      name: 'globImport',
      plugin: pluginGlobImport
    },
    {
      name: 'postcss',
      plugin: pluginPostcss,
      option: { extract: true }
    },
    {
      name: 'html',
      plugin: pluginHtml,
      option: { replacements: { '{{ title }}': '这是标题' } }
    },
    {
      name: 'compress',
      plugin: pluginCompress
    },
    {
      name: 'myPlugin',
      plugin: myPlugin
    }
  ],
  output: {
    // format: 'iife',
    // name: 'app',
    dir: 'dist',
    // file: 'dist/assets/[name].js',
    hashCharacters: 'base36',
    // hash: true
    entryFileNames: 'assets/[name].[hash].js',
    chunkFileNames: 'assets/[name].[hash].[ext]',
    assetFileNames: '[name].[ext]'
  },
  onwarn (msg, defaultHandler) {
    if (msg.code !== 'UNKNOWN_OPTION') defaultHandler(msg)
  }
})

const config = globToRollupConfig({
  'src/index-{a-*,b}.js': preset.config()
})

export default config
