import { createPreset } from '@cheap-pets/rollup-extends'

import pluginAlias from '@rollup/plugin-alias'
import pluginReplace from '@rollup/plugin-replace'
import pluginCommonjs from '@rollup/plugin-commonjs'
import pluginNodeResolve from '@rollup/plugin-node-resolve'

import pluginSwc from '@cheap-pets/rollup-plugin-swc'
import pluginCss from '@cheap-pets/rollup-plugin-css'
import pluginCopy from '@cheap-pets/rollup-plugin-copy'
import pluginHtml from '@cheap-pets/rollup-plugin-html'
import pluginDelete from '@cheap-pets/rollup-plugin-delete'
import pluginString from '@cheap-pets/rollup-plugin-string'
import pluginCompress from '@cheap-pets/rollup-plugin-compress'
import pluginGlobImport from '@cheap-pets/rollup-plugin-glob-import'

const isDevEnv = Boolean(process.env.dev)
const hashPart = isDevEnv ? '' : '.[hash]'
const env = isDevEnv ? 'development' : 'production'

export const preset = createPreset({
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
      name: 'alias',
      plugin: pluginAlias
    },
    {
      name: 'replace',
      plugin: pluginReplace,
      option: { 'process.env.NODE_ENV': JSON.stringify(env), preventAssignment: true }
    },
    {
      name: 'globImport',
      plugin: pluginGlobImport
    },
    {
      name: 'css',
      plugin: pluginCss
    },
    {
      name: 'string',
      plugin: pluginString,
      option: { include: '**/*.txt' }
    },
    {
      name: 'html',
      plugin: pluginHtml,
      option: { fileName: '[name].html' }
    },
    {
      name: 'nodeResolve',
      plugin: pluginNodeResolve,
      option: {
        exportConditions: ['browser'],
        mainFields: ['browser', 'module', 'main']
      }
    },
    {
      name: 'swc',
      plugin: pluginSwc
    },
    {
      name: 'commonjs',
      plugin: pluginCommonjs
    },
    {
      name: 'compress',
      plugin: pluginCompress
    }
  ],
  output: {
    entryFileNames: `[name]${hashPart}.js`,
    chunkFileNames: `[name]${hashPart}.[ext]`,
    assetFileNames: `[name]${hashPart}.[ext]`
  }
})
