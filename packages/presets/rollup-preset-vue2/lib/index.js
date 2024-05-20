import pluginVue2 from 'unplugin-vue2/rollup'
import * as compiler from '@vue/compiler-sfc'

import { preset as basicPreset } from '@cheap-pets/rollup-preset-web'

const isDevEnv = Boolean(process.env.dev)

export const preset = basicPreset.extend({
  plugins: [
    'delete',
    'copy',
    'alias',
    'replace',
    'globImport',
    {
      name: 'vue',
      plugin: pluginVue2,
      option: {
        compiler,
        inlineTemplate: !isDevEnv
      }
    },
    'css',
    'string',
    'html',
    'nodeResolve',
    'swc',
    'commonjs',
    'compress'
  ]
})
