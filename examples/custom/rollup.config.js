/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unpublished-import */

import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globToRollupConfig, createPreset } from '@cheap-pets/rollup-extends'

import pluginCss from '@cheap-pets/rollup-plugin-css'
import pluginCopy from '@cheap-pets/rollup-plugin-copy'
import pluginHtml from '@cheap-pets/rollup-plugin-html'
import pluginDelete from '@cheap-pets/rollup-plugin-delete'
import pluginString from '@cheap-pets/rollup-plugin-string'
import pluginCompress from '@cheap-pets/rollup-plugin-compress'
import pluginGlobImport from '@cheap-pets/rollup-plugin-glob-import'

import postcss from 'postcss'

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

const cssProcessor = postcss([])

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
      name: 'css',
      plugin: pluginCss,
      option: {
        extract: false,
        minify: true,
        transform: (code, id) => cssProcessor.process(code, { from: id })
      }
    },
    {
      name: 'html',
      plugin: pluginHtml,
      option: { replacements: { '{{ timestamp }}': new Date() } }
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
  output: [
    {
      // format: 'iife',
      // name: 'app',
      dir: 'dist',
      // file: 'dist/assets/[name].js',
      entryFileNames: 'assets/js/[name].js',
      chunkFileNames: 'assets/[ext]/[name].[ext]',
      assetFileNames: 'assets/[ext]/[name].[ext]'
    }
    // {
    //   dir: 'dist',
    //   hashCharacters: 'base36',
    //   entryFileNames: 'assets/js/[name].[hash].js',
    //   chunkFileNames: 'assets/[ext]/[name].[hash].[ext]',
    //   assetFileNames: 'assets/[ext]/[name].[hash].[ext]'
    // }
  ],
  onwarn (msg, defaultHandler) {
    if (msg.code !== 'UNKNOWN_OPTION') defaultHandler(msg)
  }
})

preset.update({
  overwritePluginOptions: {
    html: {
      replacements: { '{{ timestamp }}': '2024-04-26' }
    }
  },
  plugins: [
    'delete',
    'string',
    'css',
    'html'
  ]
})

const config = globToRollupConfig({
  'src/index-*.js': () => preset.config()
})

export default config
