import pluginDelete from '@cheap-pets/rollup-plugin-delete'
import pluginCopy from '@cheap-pets/rollup-plugin-copy'
import pluginAlias from '@rollup/plugin-alias'
import pluginVue from 'unplugin-vue2'
import pluginJson from '@rollup/plugin-json'
import pluginString from '@cheap-pets/rollup-plugin-string'
import pluginNodeResolve from '@rollup/plugin-node-resolve'
import pluginHtml from '@cheap-pets/rollup-plugin-html'
import pluginSwc from '@rollup/plugin-swc'
import pluginCommonJs from '@rollup/plugin-commonjs'
import pluginCompress from '@cheap-pets/rollup-plugin-compress'

export const plugins = [
  {
    name: 'delete',
    plugin: pluginDelete
  },
  {
    name: 'copy',
    plugin: pluginCopy
  },
  {
    name: 'alias',
    plugin: pluginAlias
  },
  {
    name: 'vue',
    plugin: pluginVue
  },
  {
    name: 'json',
    plugin: pluginJson
  },
  {
    name: 'string',
    plugin: pluginString
  },
  {
    name: 'nodeResolve',
    plugin: pluginNodeResolve,
    option: {
      mainFields: ['browser', 'module', 'main']
    }
  },
  {
    name: 'html',
    plugin: pluginHtml
  },
  {
    name: 'swc',
    plugin: pluginSwc
  },
  {
    name: 'commonJs',
    plugin: pluginCommonJs
  },
  {
    name: 'compress',
    plugin: pluginCompress
  }
]
