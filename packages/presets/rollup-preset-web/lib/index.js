import { preset as basicPreset } from '@cheap-pets/rollup-preset-base'

import pluginCss from '@cheap-pets/rollup-plugin-css'
import pluginHtml from '@cheap-pets/rollup-plugin-html'
import pluginReplace from '@rollup/plugin-replace'
import pluginCompress from '@cheap-pets/rollup-plugin-compress'

const isDevEnv = Boolean(process.env.dev)
const env = isDevEnv ? 'development' : 'production'

export const preset = basicPreset.extend({
  plugins: [
    'delete',
    'copy',
    'alias',
    {
      name: 'replace',
      plugin: pluginReplace,
      option: { 'process.env.NODE_ENV': JSON.stringify(env), preventAssignment: true }
    },
    'globImport',
    {
      name: 'css',
      plugin: pluginCss
    },
    'string',
    {
      name: 'html',
      plugin: pluginHtml,
      option: { fileName: '[name].html' }
    },
    'nodeResolve',
    'swc',
    'commonjs',
    {
      name: 'compress',
      plugin: pluginCompress
    }
  ]
})
