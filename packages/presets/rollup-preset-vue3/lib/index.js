import pluginVue3 from 'unplugin-vue/rollup'
// import * as compiler from '@vue/compiler-sfc'

import { preset as basicPreset } from '@cheap-pets/rollup-preset-web'

export const preset = basicPreset.extend({
  plugins: [
    'delete',
    'copy',
    'alias',
    'replace',
    'globImport',
    {
      name: 'vue',
      plugin: pluginVue3
      // option: {
      //   compiler
      //   // inlineTemplate: !isDevEnv
      // }
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
