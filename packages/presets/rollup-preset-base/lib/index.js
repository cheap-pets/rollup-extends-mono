import { createPreset } from '@cheap-pets/rollup-extends'

import pluginAlias from '@rollup/plugin-alias'
import pluginCommonjs from '@rollup/plugin-commonjs'
import pluginNodeResolve from '@rollup/plugin-node-resolve'

import pluginSwc from '@cheap-pets/rollup-plugin-swc'
import pluginCopy from '@cheap-pets/rollup-plugin-copy'
import pluginDelete from '@cheap-pets/rollup-plugin-delete'
import pluginString from '@cheap-pets/rollup-plugin-string'
import pluginGlobImport from '@cheap-pets/rollup-plugin-glob-import'

const isDevEnv = Boolean(process.env.dev)
const fileName = isDevEnv ? '[name]' : '[name].[hash]'

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
      name: 'globImport',
      plugin: pluginGlobImport
    },
    {
      name: 'string',
      plugin: pluginString,
      option: { include: '**/*.txt' }
    },
    {
      name: 'nodeResolve',
      plugin: pluginNodeResolve,
      option: {
        mainFields: ['main', 'module']
      }
    },
    {
      name: 'swc',
      plugin: pluginSwc
    },
    {
      name: 'commonjs',
      plugin: pluginCommonjs
    }
  ],
  output: {
    sourcemap: isDevEnv,
    entryFileNames: `${fileName}.js`,
    chunkFileNames: `${fileName}.[ext]`,
    assetFileNames: `${fileName}.[ext]`
  }
})
